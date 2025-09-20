import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  query: string;
  userId: string;
  limit?: number;
  similarityThreshold?: number;
  documentIds?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header found')
      throw new Error('Authorization header required')
    }

    // Create client with anon key for user validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      console.error('User validation failed:', userError)
      throw new Error('Unauthorized')
    }

    console.log('User validated:', user.id)

    const {
      query,
      limit = 5,
      similarityThreshold = 0.7,
      documentIds
    }: SearchRequest = await req.json()

    console.log('RAG Search request:', { query, limit, similarityThreshold })

    let relevantDocuments: any[] = []

    // Create embedding for the query
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (openaiApiKey) {
      try {
        console.log('Creating query embedding...')
        
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

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json()
          const queryEmbedding = embeddingData.data?.[0]?.embedding

          if (queryEmbedding) {
            // Create service role client for database queries
            const serviceClient = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // Vector similarity search using embeddings
            let documentsQuery = serviceClient
              .from('documents')
              .select(`
                *,
                document_embeddings (
                  embedding_json,
                  content_hash
                )
              `)
              .eq('user_id', user.id)
              .not('document_embeddings', 'is', null)

            if (documentIds && documentIds.length > 0) {
              documentsQuery = documentsQuery.in('id', documentIds)
            }

            const { data: documentsWithEmbeddings } = await documentsQuery.limit(20)

            if (documentsWithEmbeddings && documentsWithEmbeddings.length > 0) {
              // Calculate cosine similarity for each document
              const documentsWithSimilarity = documentsWithEmbeddings
                .filter(doc => doc.document_embeddings && doc.document_embeddings.length > 0)
                .map(doc => {
                  const embedding = doc.document_embeddings[0]?.embedding_json?.embedding
                  if (!embedding) return null

                  const similarity = cosineSimilarity(queryEmbedding, embedding)
                  return {
                    ...doc,
                    similarity_score: similarity
                  }
                })
                .filter(doc => doc && doc.similarity_score >= similarityThreshold)
                .sort((a, b) => b.similarity_score - a.similarity_score)
                .slice(0, limit)

              relevantDocuments = documentsWithSimilarity
              console.log(`Found ${relevantDocuments.length} relevant documents with similarity >= ${similarityThreshold}`)
            }
          }
        }
      } catch (embeddingError) {
        console.error('Embedding search failed:', embeddingError)
      }
    }

    // Fallback: keyword-based search if vector search fails
    if (relevantDocuments.length === 0) {
      console.log('Falling back to keyword search...')
      
      const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2)
      
      // Use service client for fallback search too
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      let keywordQuery = serviceClient
        .from('documents')
        .select('*')
        .eq('user_id', user.id)

      if (documentIds && documentIds.length > 0) {
        keywordQuery = keywordQuery.in('id', documentIds)
      }

      const { data: allDocuments } = await keywordQuery.limit(50)

      if (allDocuments && allDocuments.length > 0) {
        relevantDocuments = allDocuments
          .map(doc => {
            const docText = (
              doc.name + ' ' + 
              (doc.ai_summary || '') + ' ' + 
              (doc.extracted_text || '') + ' ' + 
              (doc.category || '')
            ).toLowerCase()

            const matchCount = searchTerms.reduce((count, term) => {
              return count + (docText.includes(term) ? 1 : 0)
            }, 0)

            return {
              ...doc,
              similarity_score: matchCount / searchTerms.length,
              match_type: 'keyword'
            }
          })
          .filter(doc => doc.similarity_score > 0)
          .sort((a, b) => b.similarity_score - a.similarity_score)
          .slice(0, limit)
      }
    }

    // Prepare context for RAG
    const documentContext = relevantDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      category: doc.category,
      summary: doc.ai_summary || 'No summary available',
      similarity_score: doc.similarity_score,
      match_type: doc.match_type || 'vector'
    }))

    const contextText = relevantDocuments
      .map(doc => `Document: ${doc.name}
Category: ${doc.category}
Summary: ${doc.ai_summary || 'No summary'}
Content Preview: ${(doc.extracted_text || '').substring(0, 500)}...`)
      .join('\n\n---\n\n')

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          query: query,
          relevant_documents: documentContext,
          context_text: contextText,
          search_method: relevantDocuments.some(doc => doc.match_type === 'vector') ? 'vector' : 'keyword',
          total_results: relevantDocuments.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('RAG search error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  return isNaN(similarity) ? 0 : similarity
}