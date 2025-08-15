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
    minConfidence?: number;
    language?: string;
  };
  searchType?: 'text' | 'semantic' | 'hybrid' | 'ai_powered';
  limit?: number;
  offset?: number;
  includeContent?: boolean;
  sortBy?: 'relevance' | 'date' | 'name' | 'size';
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
      offset = 0,
      includeContent = false,
      sortBy = 'relevance'
    }: SearchRequest = await req.json()

    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required')
    }

    let searchResults: any[] = []
    let totalCount = 0

    // Perform search based on type
    switch (searchType) {
      case 'text':
        searchResults = await performTextSearch(supabaseClient, userProfile.id, query, filters, limit, offset, sortBy)
        break
      case 'semantic':
        searchResults = await performSemanticSearch(supabaseClient, userProfile.id, query, filters, limit, offset)
        break
      case 'ai_powered':
        searchResults = await performAIPoweredSearch(supabaseClient, userProfile.id, query, filters, limit, offset)
        break
      case 'hybrid':
      default:
        // Combine text and semantic search
        const textResults = await performTextSearch(supabaseClient, userProfile.id, query, filters, Math.ceil(limit / 2), offset, sortBy)
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
    }

    totalCount = searchResults.length

    // Enhance results with additional metadata
    const enhancedResults = await enhanceSearchResults(supabaseClient, searchResults, includeContent)

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
          filters: filters,
          has_results: searchResults.length > 0
        },
        time_period: 'daily',
        date_recorded: new Date().toISOString().split('T')[0]
      })

    // Generate search suggestions
    const suggestions = await generateSearchSuggestions(supabaseClient, userProfile.id, query, searchResults)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          results: enhancedResults,
          total_count: totalCount,
          search_type: searchType,
          query: query,
          filters: filters,
          suggestions: suggestions,
          search_metadata: {
            processing_time_ms: Date.now(),
            result_quality_score: calculateResultQuality(enhancedResults),
            search_tips: generateSearchTips(query, searchResults.length)
          }
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

async function performTextSearch(supabaseClient: any, userId: string, query: string, filters: any, limit: number, offset: number, sortBy: string) {
  let searchQuery = supabaseClient
    .from('documents')
    .select(`
      id, name, category, ai_summary, extracted_text, file_type, file_size,
      created_at, updated_at, ai_tags, custom_tags, thumbnail_url, ai_confidence,
      metadata, status, language_detected
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')

  // Apply text search with PostgreSQL full-text search
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)
  if (searchTerms.length > 0) {
    const tsQuery = searchTerms.join(' & ')
    searchQuery = searchQuery.or(`
      name.ilike.%${query}%,
      extracted_text.ilike.%${query}%,
      ai_summary.ilike.%${query}%,
      to_tsvector('english', name || ' ' || COALESCE(extracted_text, '') || ' ' || COALESCE(ai_summary, '')).@@.to_tsquery('english', '${tsQuery}')
    `)
  }

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

  if (filters.minConfidence) {
    searchQuery = searchQuery.gte('ai_confidence', filters.minConfidence)
  }

  if (filters.language) {
    searchQuery = searchQuery.eq('language_detected', filters.language)
  }

  // Apply sorting
  switch (sortBy) {
    case 'date':
      searchQuery = searchQuery.order('created_at', { ascending: false })
      break
    case 'name':
      searchQuery = searchQuery.order('name', { ascending: true })
      break
    case 'size':
      searchQuery = searchQuery.order('file_size', { ascending: false })
      break
    default: // relevance
      searchQuery = searchQuery.order('ai_confidence', { ascending: false })
  }

  const { data: results, error } = await searchQuery.range(offset, offset + limit - 1)

  if (error) throw error

  // Calculate relevance scores for text search
  return (results || []).map(doc => {
    let relevanceScore = 0
    const queryLower = query.toLowerCase()
    
    // Name match (highest weight)
    if (doc.name.toLowerCase().includes(queryLower)) {
      relevanceScore += 50
    }
    
    // Summary match (high weight)
    if (doc.ai_summary?.toLowerCase().includes(queryLower)) {
      relevanceScore += 40
    }
    
    // Content match (medium weight)
    if (doc.extracted_text?.toLowerCase().includes(queryLower)) {
      relevanceScore += 30
    }
    
    // Tag match (medium weight)
    const allTags = [...(doc.ai_tags || []), ...(doc.custom_tags || [])]
    if (allTags.some(tag => tag.toLowerCase().includes(queryLower))) {
      relevanceScore += 35
    }

    // Category match (low weight)
    if (doc.category?.toLowerCase().includes(queryLower)) {
      relevanceScore += 20
    }

    // Boost score based on AI confidence
    relevanceScore += (doc.ai_confidence || 0) * 0.1

    return {
      ...doc,
      relevance_score: Math.min(relevanceScore, 100),
      search_type: 'text',
      match_highlights: generateMatchHighlights(doc, queryLower)
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
        similarity_threshold: 0.6,
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
      search_type: 'semantic',
      semantic_similarity: doc.similarity
    }))

  } catch (error) {
    console.error('Semantic search failed:', error)
    return []
  }
}

async function performAIPoweredSearch(supabaseClient: any, userId: string, query: string, filters: any, limit: number, offset: number) {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.log('OpenAI API key not available, falling back to text search')
      return await performTextSearch(supabaseClient, userId, query, filters, limit, offset, 'relevance')
    }

    // Get user's documents for context
    const { data: userDocs } = await supabaseClient
      .from('documents')
      .select('id, name, category, ai_summary, ai_tags, custom_tags')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(50) // Limit for context

    if (!userDocs || userDocs.length === 0) {
      return []
    }

    // Use AI to understand search intent and find relevant documents
    const searchPrompt = `You are a document search assistant. Analyze the user's search query and find the most relevant documents from their collection.

User query: "${query}"

Available documents:
${userDocs.map(doc => `ID: ${doc.id}, Name: ${doc.name}, Category: ${doc.category}, Summary: ${doc.ai_summary || 'No summary'}, Tags: ${[...(doc.ai_tags || []), ...(doc.custom_tags || [])].join(', ')}`).join('\n')}

Return a JSON array of document IDs ranked by relevance (most relevant first), with relevance scores (0-100):
[
  {"document_id": "uuid", "relevance_score": 95, "reason": "exact match for insurance policy"},
  {"document_id": "uuid", "relevance_score": 80, "reason": "related financial document"}
]

Consider:
- Exact keyword matches
- Semantic similarity
- Document category relevance
- Tag matches
- Content context

Return only the JSON array, no other text.`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: searchPrompt }],
        max_tokens: 1000,
        temperature: 0.1
      })
    })

    if (aiResponse.ok) {
      const aiData = await aiResponse.json()
      const aiResultsText = aiData.choices?.[0]?.message?.content || ''
      
      try {
        const aiResults = JSON.parse(aiResultsText)
        
        if (Array.isArray(aiResults)) {
          // Get full document details for AI-ranked results
          const documentIds = aiResults.slice(offset, offset + limit).map(r => r.document_id)
          
          const { data: documents } = await supabaseClient
            .from('documents')
            .select(`
              id, name, category, ai_summary, extracted_text, file_type, file_size,
              created_at, updated_at, ai_tags, custom_tags, thumbnail_url, ai_confidence,
              metadata, status, language_detected
            `)
            .in('id', documentIds)

          if (documents) {
            return documents.map(doc => {
              const aiResult = aiResults.find(r => r.document_id === doc.id)
              return {
                ...doc,
                relevance_score: aiResult?.relevance_score || 50,
                search_type: 'ai_powered',
                ai_reasoning: aiResult?.reason || 'AI-determined relevance',
                extracted_text: includeContent ? doc.extracted_text : undefined
              }
            }).sort((a, b) => b.relevance_score - a.relevance_score)
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI search results:', parseError)
      }
    }

    // Fallback to hybrid search
    return await performTextSearch(supabaseClient, userId, query, filters, limit, offset, sortBy)

  } catch (error) {
    console.error('AI-powered search failed:', error)
    return await performTextSearch(supabaseClient, userId, query, filters, limit, offset, sortBy)
  }
}

async function enhanceSearchResults(supabaseClient: any, results: any[], includeContent: boolean) {
  const enhancedResults = []

  for (const result of results) {
    // Get document tags
    const { data: tags } = await supabaseClient
      .from('document_tags')
      .select('tag, is_ai_generated')
      .eq('document_id', result.id)

    // Get document relationships
    const { data: relationships } = await supabaseClient
      .from('document_relationships')
      .select('document_id_2, relationship_type, confidence_score')
      .eq('document_id_1', result.id)
      .limit(3)

    // Get sharing information
    const { data: shares } = await supabaseClient
      .from('document_shares')
      .select('permission_level, shared_with_email, created_at')
      .eq('document_id', result.id)
      .eq('is_active', true)

    enhancedResults.push({
      ...result,
      tags: tags || [],
      related_documents: relationships || [],
      sharing_info: shares || [],
      extracted_text: includeContent ? result.extracted_text : undefined,
      content_preview: result.extracted_text ? result.extracted_text.substring(0, 200) + '...' : null
    })
  }

  return enhancedResults
}

async function generateSearchSuggestions(supabaseClient: any, userId: string, query: string, results: any[]) {
  const suggestions = []

  // Category-based suggestions
  if (results.length > 0) {
    const categories = [...new Set(results.map(r => r.category).filter(Boolean))]
    if (categories.length > 1) {
      suggestions.push(`Filter by ${categories[0]} documents`)
    }
  }

  // Related search suggestions based on user's documents
  const { data: userCategories } = await supabaseClient
    .from('documents')
    .select('category')
    .eq('user_id', userId)
    .eq('status', 'completed')

  if (userCategories) {
    const availableCategories = [...new Set(userCategories.map(d => d.category).filter(Boolean))]
    
    if (query.toLowerCase().includes('insurance') && availableCategories.includes('Insurance')) {
      suggestions.push('Show all insurance policies', 'Find expiring insurance documents')
    }
    
    if (query.toLowerCase().includes('tax') && availableCategories.includes('Tax')) {
      suggestions.push('Show tax documents for this year', 'Find tax deduction receipts')
    }
  }

  // AI-powered suggestions
  if (results.length === 0) {
    suggestions.push(
      'Try using different keywords',
      'Search in all categories',
      'Use voice search for better results'
    )
  }

  return suggestions.slice(0, 5) // Limit to 5 suggestions
}

function generateMatchHighlights(doc: any, query: string): any {
  const highlights = {
    name: [],
    summary: [],
    content: [],
    tags: []
  }

  const queryTerms = query.split(' ').filter(term => term.length > 2)

  // Highlight matches in document name
  queryTerms.forEach(term => {
    if (doc.name.toLowerCase().includes(term)) {
      highlights.name.push(term)
    }
  })

  // Highlight matches in summary
  queryTerms.forEach(term => {
    if (doc.ai_summary?.toLowerCase().includes(term)) {
      highlights.summary.push(term)
    }
  })

  // Highlight tag matches
  const allTags = [...(doc.ai_tags || []), ...(doc.custom_tags || [])]
  queryTerms.forEach(term => {
    const matchingTags = allTags.filter(tag => tag.toLowerCase().includes(term))
    highlights.tags.push(...matchingTags)
  })

  return highlights
}

function calculateResultQuality(results: any[]): number {
  if (results.length === 0) return 0

  const avgRelevance = results.reduce((sum, r) => sum + (r.relevance_score || 0), 0) / results.length
  const avgConfidence = results.reduce((sum, r) => sum + (r.ai_confidence || 0), 0) / results.length
  
  return Math.round((avgRelevance + avgConfidence) / 2)
}

function generateSearchTips(query: string, resultCount: number): string[] {
  const tips = []

  if (resultCount === 0) {
    tips.push('Try using broader search terms')
    tips.push('Check if documents are uploaded and processed')
    tips.push('Use category filters to narrow down search')
  } else if (resultCount > 20) {
    tips.push('Use specific keywords to narrow results')
    tips.push('Apply date or category filters')
    tips.push('Try semantic search for better relevance')
  }

  if (query.length < 3) {
    tips.push('Use at least 3 characters for better results')
  }

  if (!query.includes(' ')) {
    tips.push('Try using multiple keywords for better matching')
  }

  return tips.slice(0, 3)
}