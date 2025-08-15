import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  query: string;
  filters?: {
    category?: string;
    dateRange?: { start: string; end: string };
    fileType?: string;
    tags?: string[];
    familyVaultId?: string;
  };
  searchType?: 'text' | 'semantic' | 'hybrid';
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: userProfile } = await supabaseClient
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (!userProfile) {
      throw new Error('User profile not found')
    }

    const {
      query,
      filters = {},
      searchType = 'hybrid',
      limit = 20,
      offset = 0
    }: SearchRequest = await req.json()

    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required')
    }

    let searchResults: any[] = []

    // Perform search based on type
    switch (searchType) {
      case 'text':
        searchResults = await performTextSearch(supabaseClient, userProfile.id, query, filters, limit, offset)
        break
      case 'semantic':
        searchResults = await performSemanticSearch(supabaseClient, userProfile.id, query, filters, limit, offset)
        break
      case 'hybrid':
        const textResults = await performTextSearch(supabaseClient, userProfile.id, query, filters, Math.ceil(limit / 2), offset)
        const semanticResults = await performSemanticSearch(supabaseClient, userProfile.id, query, filters, Math.ceil(limit / 2), offset)
        
        // Merge and deduplicate results
        const combinedResults = [...textResults, ...semanticResults]
        const uniqueResults = combinedResults.filter((result, index, self) => 
          index === self.findIndex(r => r.id === result.id)
        )
        
        // Sort by relevance score
        searchResults = uniqueResults
          .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
          .slice(0, limit)
        break
      default:
        throw new Error('Invalid search type')
    }

    // Log search activity
    await supabaseClient
      .from('analytics_data')
      .insert({
        user_id: userProfile.id,
        metric_type: 'search_usage',
        metric_category: 'engagement',
        metric_value: 1,
        metric_data: {
          query: query,
          search_type: searchType,
          results_count: searchResults.length,
          filters: filters
        },
        time_period: 'daily',
        date_recorded: new Date().toISOString().split('T')[0]
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          results: searchResults,
          total_count: searchResults.length,
          search_type: searchType,
          query: query,
          filters: filters
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Search processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function performTextSearch(supabaseClient: any, userId: string, query: string, filters: any, limit: number, offset: number) {
  let searchQuery = supabaseClient
    .from('documents')
    .select(`
      id, name, category, ai_summary, extracted_text, file_type, file_size,
      created_at, updated_at, tags, ai_tags, thumbnail_url
    `)
    .eq('user_id', userId)

  // Apply text search
  searchQuery = searchQuery.or(`name.ilike.%${query}%,extracted_text.ilike.%${query}%,ai_summary.ilike.%${query}%`)

  // Apply filters
  if (filters.category) {
    searchQuery = searchQuery.eq('category', filters.category)
  }
  
  if (filters.fileType) {
    searchQuery = searchQuery.ilike('file_type', `%${filters.fileType}%`)
  }
  
  if (filters.dateRange) {
    searchQuery = searchQuery
      .gte('created_at', filters.dateRange.start)
      .lte('created_at', filters.dateRange.end)
  }

  if (filters.familyVaultId) {
    searchQuery = searchQuery.eq('family_vault_id', filters.familyVaultId)
  }

  const { data: results, error } = await searchQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  // Calculate relevance scores for text search
  return (results || []).map(doc => {
    let relevanceScore = 0
    const queryLower = query.toLowerCase()
    
    // Name match (highest weight)
    if (doc.name.toLowerCase().includes(queryLower)) {
      relevanceScore += 50
    }
    
    // Summary match (medium weight)
    if (doc.ai_summary?.toLowerCase().includes(queryLower)) {
      relevanceScore += 30
    }
    
    // Content match (lower weight)
    if (doc.extracted_text?.toLowerCase().includes(queryLower)) {
      relevanceScore += 20
    }
    
    // Tag match (medium weight)
    if (doc.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower)) ||
        doc.ai_tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
      relevanceScore += 25
    }

    return {
      ...doc,
      relevance_score: relevanceScore,
      search_type: 'text'
    }
  })
}

async function performSemanticSearch(supabaseClient: any, userId: string, query: string, filters: any, limit: number, offset: number) {
  try {
    // Generate query embedding
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.log('OpenAI API key not available, skipping semantic search')
      return []
    }

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query
      })
    })

    if (!embeddingResponse.ok) {
      console.log('Failed to generate query embedding')
      return []
    }

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.data?.[0]?.embedding

    if (!queryEmbedding) {
      console.log('No embedding generated for query')
      return []
    }

    // Perform vector similarity search
    const { data: results, error } = await supabaseClient
      .rpc('search_documents_by_similarity', {
        query_embedding: queryEmbedding,
        user_id: userId,
        similarity_threshold: 0.7,
        limit_count: limit
      })

    if (error) {
      console.error('Vector search failed:', error)
      return []
    }

    // Apply additional filters
    let filteredResults = results || []

    if (filters.category) {
      filteredResults = filteredResults.filter((doc: any) => doc.category === filters.category)
    }

    if (filters.fileType) {
      filteredResults = filteredResults.filter((doc: any) => 
        doc.file_type?.toLowerCase().includes(filters.fileType.toLowerCase())
      )
    }

    if (filters.dateRange) {
      filteredResults = filteredResults.filter((doc: any) => {
        const docDate = new Date(doc.created_at)
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        return docDate >= startDate && docDate <= endDate
      })
    }

    return filteredResults.map((doc: any) => ({
      ...doc,
      relevance_score: Math.round(doc.similarity * 100),
      search_type: 'semantic'
    }))

  } catch (error) {
    console.error('Semantic search failed:', error)
    return []
  }
}