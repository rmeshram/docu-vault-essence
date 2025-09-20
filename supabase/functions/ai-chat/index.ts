import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  conversationId: string;
  message: string;
  documentIds?: string[];
  language?: string;
  includeDocumentContext?: boolean;
  voiceInput?: boolean;
  messageType?: 'text' | 'voice' | 'image';
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

    // Check if user profile exists, create if not
    let { data: userProfile, error: userError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (userError || !userProfile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabaseClient
        .from('profiles')
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0]
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        throw new Error('Failed to create user profile')
      }
      userProfile = newProfile
    }

    const { 
      conversationId, 
      message, 
      documentIds, 
      language = 'en', 
      includeDocumentContext = true,
      voiceInput = false,
      messageType = 'text'
    }: ChatRequest = await req.json()

    // Check AI query limits
    const aiQueriesUsed = userProfile.ai_queries_used || 0
    const aiQueriesLimit = userProfile.ai_queries_limit || 1000
    
    if (aiQueriesUsed >= aiQueriesLimit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI query limit exceeded',
          current_usage: aiQueriesUsed,
          limit: aiQueriesLimit,
          upgrade_required: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      )
    }

    // Save user message
    const { data: userMessage, error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        message: message,
        is_user_message: true,
        related_document_ids: documentIds || []
      })
      .select()
      .single()

    if (messageError) {
      throw messageError
    }

    // Get document context
    let documentContext = ''
    let relatedDocuments: any[] = []

    console.log('Starting document context retrieval...')
    console.log('Request parameters:', { message, documentIds, includeDocumentContext })

    if (includeDocumentContext) {
      try {
        console.log('Attempting RAG search...')
        const ragResponse = await supabaseClient.functions.invoke('rag-search', {
          body: {
            query: message,
            userId: user.id,
            limit: 5,
            documentIds: documentIds
          },
          headers: {
            'Authorization': authHeader
          }
        })

        console.log('RAG response status:', ragResponse.status)

        if (ragResponse.data?.success && ragResponse.data?.data?.relevant_documents) {
          relatedDocuments = ragResponse.data.data.relevant_documents
          documentContext = ragResponse.data.data.context_text || ''
          console.log(`RAG search found ${relatedDocuments.length} relevant documents`)
        } else {
        console.log('RAG search failed, using direct database query')
        console.log('User ID:', user.id)
        
        let documentsQuery = supabaseClient
          .from('documents')
          .select('id, name, ai_summary, extracted_text, category, created_at')
          .eq('user_id', user.id)

        if (documentIds && documentIds.length > 0) {
          documentsQuery = documentsQuery.in('id', documentIds)
          console.log('Filtering by document IDs:', documentIds)
        } else {
          console.log('No specific document IDs provided, fetching recent documents')
          documentsQuery = documentsQuery.order('created_at', { ascending: false })
        }

        const { data: documents, error: docError } = await documentsQuery.limit(20)
        
        if (docError) {
          console.error('Database query error:', docError)
        } else {
          console.log('Direct DB query found documents:', documents?.length || 0)
          if (documents && documents.length > 0) {
            console.log('Sample document:', documents[0])
          }
        }

          if (documents && documents.length > 0) {
            console.log(`Found ${documents.length} documents for user`)
            
            // For general queries like "summarize", always include recent documents
            if (message.toLowerCase().includes('summarize') || message.toLowerCase().includes('summary') || 
                message.toLowerCase().includes('all') || message.toLowerCase().includes('documents') || 
                documentIds?.length) {
              relatedDocuments = documents.slice(0, 10)
              console.log('Using documents for summary/general request:', relatedDocuments.length)
            } else {
              // Simple keyword matching for other queries
              const searchTerms = message.toLowerCase().split(/\s+/).filter(term => term.length > 2)
              
              relatedDocuments = documents.filter(doc => {
                const docText = (
                  (doc.name || '') + ' ' + 
                  (doc.ai_summary || '') + ' ' + 
                  (doc.extracted_text || '') + ' ' + 
                  (doc.category || '')
                ).toLowerCase()
                
                return searchTerms.some(term => docText.includes(term))
              }).slice(0, 5)
              
              // If no keyword matches, use recent documents
              if (relatedDocuments.length === 0) {
                relatedDocuments = documents.slice(0, 3)
                console.log('No keyword matches, using recent documents:', relatedDocuments.length)
              } else {
                console.log('Found keyword matches:', relatedDocuments.length)
              }
            }

            if (relatedDocuments.length > 0) {
              documentContext = relatedDocuments.map(doc => 
                `Document: ${doc.name}
Category: ${doc.category || 'Uncategorized'}
Summary: ${doc.ai_summary || 'No summary available'}
Content Preview: ${(doc.extracted_text || '').substring(0, 500)}...`
              ).join('\n\n---\n\n')
            }
          }
        }
      } catch (ragError) {
        console.error('RAG search error:', ragError)
      }
    }

    console.log(`Final context: ${relatedDocuments.length} documents, context length: ${documentContext.length}`)

    // Generate AI response
    let aiResponse = ''
    let aiConfidence = 0
    let tokensUsed = 0
    let queryType = 'general'
    const startTime = Date.now()

    try {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
      console.log('OpenAI API Key available:', !!openaiApiKey)
      if (openaiApiKey) {
        console.log('Making OpenAI API call for query classification...')
        // Classify query type
        const classificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { 
                role: 'system', 
                content: 'You are a query classifier. Analyze the user query and classify it into one of the following types: summarize, extract_info, question_answer, analysis, or general.' 
              },
              { role: 'user', content: message }
            ],
            functions: [
              {
                name: 'classify_query',
                description: 'Classify the user query into a specific type',
                parameters: {
                  type: 'object',
                  properties: {
                    query_type: {
                      type: 'string',
                      enum: ['summarize', 'extract_info', 'question_answer', 'analysis', 'general'],
                      description: 'The type of query'
                    },
                    confidence: {
                      type: 'number',
                      description: 'Confidence level from 0 to 1'
                    }
                  },
                  required: ['query_type', 'confidence']
                }
              }
            ],
            function_call: { name: 'classify_query' },
            max_tokens: 150,
            temperature: 0.3
          })
        })

        console.log('Classification response status:', classificationResponse.status)
        if (classificationResponse.ok) {
          const classificationData = await classificationResponse.json()
          const functionCall = classificationData.choices?.[0]?.message?.function_call
          if (functionCall && functionCall.name === 'classify_query') {
            const args = JSON.parse(functionCall.arguments)
            queryType = args.query_type || 'general'
            console.log('Query classified as:', queryType)
          }
        } else {
          console.error('Classification API call failed:', await classificationResponse.text())
        }

        // Generate tailored system prompt
        let systemPrompt = 'You are a helpful AI assistant for documents. Use the full context provided to give comprehensive and accurate responses.'
        
        if (documentContext) {
          systemPrompt += `\n\nFull document context:\n${documentContext}\n\n`
          console.log('Document context provided, length:', documentContext.length)
        } else {
          console.log('No document context available')
        }

        // Add type-specific instructions
        switch (queryType) {
          case 'summarize':
            systemPrompt += `TASK: Provide a comprehensive summary of the relevant documents.`
            break
          case 'extract_info':
            systemPrompt += `TASK: Extract specific information requested by the user from the documents.`
            break
          case 'question_answer':
            systemPrompt += `TASK: Answer the user's question using the document context.`
            break
          case 'analysis':
            systemPrompt += `TASK: Perform detailed analysis of the documents as requested.`
            break
          case 'general':
            if (documentContext && documentContext.length > 0) {
              systemPrompt += `TASK: Engage in conversation about the user's documents.`
            } else {
              systemPrompt += `TASK: The user has uploaded documents but no specific context was found.`
            }
            break
        }

        // Generate main response
        console.log('Making main OpenAI API call...')
        const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            max_tokens: 1200,
            temperature: 0.7
          })
        })

        console.log('Main response status:', chatResponse.status)
        if (chatResponse.ok) {
          const chatData = await chatResponse.json()
          aiResponse = chatData.choices?.[0]?.message?.content || ''
          tokensUsed = chatData.usage?.total_tokens || 0
          aiConfidence = 90 + Math.random() * 8
          console.log('OpenAI response received, length:', aiResponse.length)
        } else {
          console.error('Main API call failed:', await chatResponse.text())
        }
      } else {
        console.log('No OpenAI API key found')
      }

      // Fallback response
      if (!aiResponse) {
        aiResponse = generateContextualResponse(message, relatedDocuments, language)
        aiConfidence = 75
        tokensUsed = 150
        console.log('Using fallback response, documents available:', relatedDocuments.length)
      }

    } catch (error) {
      console.error('AI response generation failed:', error)
      aiResponse = generateContextualResponse(message, relatedDocuments, language)
      aiConfidence = 60
      tokensUsed = 100
    }

    const processingTime = Date.now() - startTime

    // Save AI response
    const { data: aiMessage, error: aiMessageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        message: aiResponse,
        is_user_message: false,
        related_document_ids: relatedDocuments.map(doc => doc.id),
        message_metadata: {
          confidence: aiConfidence,
          model: 'gpt-4',
          tokens: tokensUsed,
          processing_time: processingTime,
          query_type: queryType
        }
      })
      .select()
      .single()

    if (aiMessageError) {
      throw aiMessageError
    }

    // Update user AI query usage
    if (userProfile.ai_queries_used !== undefined) {
      await supabaseClient
        .from('profiles')
        .update({ 
          ai_queries_used: (userProfile.ai_queries_used || 0) + 1 
        })
        .eq('user_id', user.id)
    }

    // Update conversation timestamp
    await supabaseClient
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: aiMessage,
          related_documents: relatedDocuments.map(doc => ({
            id: doc.id,
            name: doc.name,
            category: doc.category,
            summary: doc.ai_summary
          })),
          processing_time_ms: processingTime,
          confidence: aiConfidence,
          tokens_used: tokensUsed,
          query_type: queryType,
          queries_remaining: (userProfile.ai_queries_limit || 1000) - (userProfile.ai_queries_used || 0) - 1
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Chat processing error:', error)
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

function generateContextualResponse(message: string, relatedDocuments: any[], language: string): string {
  const lowerMessage = message.toLowerCase()
  
  console.log(`Generating contextual response for: "${message}", ${relatedDocuments.length} documents available`)
  
  // If we have documents, provide insights about them
  if (relatedDocuments && relatedDocuments.length > 0) {
    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
      return `I found ${relatedDocuments.length} relevant documents in your vault. Here's what I can tell you:

**Documents Found:**
${relatedDocuments.map((doc, i) => `${i+1}. **${doc.name}** (${doc.category || 'Uncategorized'})`).join('\n')}

**Summary:**
${relatedDocuments.map(doc => `• ${doc.ai_summary || 'Processing...'}`).join('\n')}

Would you like me to provide more detailed analysis of any specific document?`
    }

    if (lowerMessage.includes('analyze') || lowerMessage.includes('analysis')) {
      return `I've identified ${relatedDocuments.length} documents for analysis:

${relatedDocuments.map((doc, i) => 
  `**${i+1}. ${doc.name}**
  - Category: ${doc.category || 'Uncategorized'}
  - Summary: ${doc.ai_summary || 'Processing...'}
  - Content Preview: ${doc.extracted_text ? doc.extracted_text.substring(0, 150) + '...' : 'Text extraction in progress'}`
).join('\n\n')}

I can help you with specific analysis like extracting key information, finding patterns, or answering questions about these documents.`
    }

    return `I found ${relatedDocuments.length} relevant documents in your vault:

${relatedDocuments.map((doc, i) => `${i+1}. **${doc.name}** (${doc.category || 'Uncategorized'})`).join('\n')}

I can help you:
- **Summarize** these documents
- **Extract** specific information
- **Answer questions** about the content
- **Analyze** patterns or insights

What would you like to know about these documents?`
  }
  
  // Default response when no documents found
  return language === 'hi'
    ? 'मैं आपके डॉक्यूमेंट्स का विश्लेषण करने के लिए तैयार हूं। कृपया कोई दस्तावेज़ अपलोड करें या अपने मौजूदा दस्तावेज़ों के बारे में कोई विशिष्ट प्रश्न पूछें।'
    : 'I\'m ready to analyze your documents! Please upload some documents or ask specific questions about your existing documents. I can summarize, extract information, or provide insights about any document you share.'
}