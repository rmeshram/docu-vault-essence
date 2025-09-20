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

    // Check AI query limits (skip check if user doesn't have these fields)
    const aiQueriesUsed = userProfile.ai_queries_used || 0
    const aiQueriesLimit = userProfile.ai_queries_limit || 1000 // Default limit
    
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

    // Get document context using RAG search
    let documentContext = ''
    let relatedDocuments: any[] = []

    if (includeDocumentContext) {
      try {
        // Use RAG search for better document retrieval
        const ragResponse = await supabaseClient.functions.invoke('rag-search', {
          body: {
            query: message,
            userId: user.id,
            limit: 5,
            documentIds: documentIds
          },
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        })

        if (ragResponse.data?.success && ragResponse.data?.data?.relevant_documents) {
          relatedDocuments = ragResponse.data.data.relevant_documents
          documentContext = ragResponse.data.data.context_text || ''
          console.log(`RAG search found ${relatedDocuments.length} relevant documents`)
        } else {
          // Fallback to simple search if RAG fails
          console.log('RAG search failed, using fallback search')
          let documentsQuery = supabaseClient
            .from('documents')
            .select('id, name, ai_summary, extracted_text, category')
            .eq('user_id', user.id)

          if (documentIds && documentIds.length > 0) {
            documentsQuery = documentsQuery.in('id', documentIds)
          }

          const { data: documents } = await documentsQuery.limit(10)

          if (documents && documents.length > 0) {
            relatedDocuments = documents.filter(doc => {
              const searchTerms = message.toLowerCase().split(' ')
              const docText = (doc.name + ' ' + (doc.ai_summary || '') + ' ' + (doc.extracted_text || '')).toLowerCase()
              return searchTerms.some(term => docText.includes(term))
            }).slice(0, 5)

            if (relatedDocuments.length > 0) {
              documentContext = relatedDocuments.map(doc => 
                `Document: ${doc.name}\nCategory: ${doc.category}\nSummary: ${doc.ai_summary || 'No summary available'}`
              ).join('\n\n')
            }
          }
        }
      } catch (ragError) {
        console.error('RAG search error:', ragError)
        // Continue with empty context if RAG fails
      }
    }

    // Generate AI response with function calling for query classification
    let aiResponse = ''
    let aiConfidence = 0
    let tokensUsed = 0
    let queryType = 'general'
    const startTime = Date.now()

    try {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
      if (openaiApiKey) {
        // First, classify the query type using function calling
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
                      description: 'The type of query: summarize (summarize documents), extract_info (extract specific information), question_answer (answer questions about documents), analysis (analyze or compare documents), general (general conversation)'
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

        if (classificationResponse.ok) {
          const classificationData = await classificationResponse.json()
          const functionCall = classificationData.choices?.[0]?.message?.function_call
          if (functionCall && functionCall.name === 'classify_query') {
            const args = JSON.parse(functionCall.arguments)
            queryType = args.query_type || 'general'
            console.log(`Query classified as: ${queryType}`)
          }
        }

        // Generate tailored system prompt based on query type
        let systemPrompt = 'You are a helpful AI assistant for documents. Use the full context provided to give comprehensive and accurate responses.'
        
        if (documentContext) {
          systemPrompt += `\n\nFull document context:\n${documentContext}\n\n`
        }

        // Add type-specific instructions
        switch (queryType) {
          case 'summarize':
            systemPrompt += `TASK: Provide a comprehensive summary of the relevant documents. Include key points, main themes, and important details. Structure your response clearly with headings if needed.`
            break
          case 'extract_info':
            systemPrompt += `TASK: Extract specific information requested by the user from the documents. Be precise and cite which documents the information comes from. If information is not available, clearly state what's missing.`
            break
          case 'question_answer':
            systemPrompt += `TASK: Answer the user's question using the document context. Provide detailed answers with specific references to the documents. If you cannot answer based on available documents, explain what additional information would be needed.`
            break
          case 'analysis':
            systemPrompt += `TASK: Perform detailed analysis of the documents as requested. This may include comparisons, trend analysis, insights, or evaluations. Provide structured analysis with clear conclusions and supporting evidence from the documents.`
            break
          case 'general':
            systemPrompt += `TASK: Engage in general conversation about documents. Provide helpful guidance, suggestions for document organization, or general assistance with document management.`
            break
        }

        systemPrompt += `\n\nGuidelines:
- Always reference specific documents when relevant
- Be comprehensive and detailed in your responses
- If you lack sufficient information, clearly explain what's needed
- Maintain accuracy and cite sources
- Provide actionable insights when possible`

        // Generate main response with GPT-4
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

        if (chatResponse.ok) {
          const chatData = await chatResponse.json()
          aiResponse = chatData.choices?.[0]?.message?.content || ''
          tokensUsed = chatData.usage?.total_tokens || 0
          aiConfidence = 90 + Math.random() * 8
        }
      }

      // Fallback: Generate contextual response
      if (!aiResponse) {
        aiResponse = generateContextualResponse(message, relatedDocuments, language)
        aiConfidence = 75
        tokensUsed = 150
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

    // Update user AI query usage if the field exists
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

    // Skip analytics for now

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
      },
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
      },
    )
  }
})

function generateContextualResponse(message: string, relatedDocuments: any[], language: string): string {
  const lowerMessage = message.toLowerCase()
  
  // Tax-related queries
  if (lowerMessage.includes('tax') || lowerMessage.includes('टैक्स') || lowerMessage.includes('itr')) {
    if (relatedDocuments.some(doc => doc.category === 'Tax')) {
      return language === 'hi' 
        ? `आपके टैक्स डॉक्यूमेंट्स का विश्लेषण करने के बाद, मैंने ${relatedDocuments.length} संबंधित दस्तावेज़ पाए हैं। क्या आप किसी विशिष्ट टैक्स जानकारी के बारे में जानना चाहते हैं?`
        : `I found ${relatedDocuments.length} tax-related documents in your vault. I can help you with tax calculations, deductions, or filing deadlines. What specific tax information do you need?`
    } else {
      return language === 'hi'
        ? 'मुझे आपके टैक्स डॉक्यूमेंट्स नहीं मिले। कृपया अपने ITR, TDS सर्टिफिकेट या अन्य टैक्स दस्तावेज़ अपलोड करें।'
        : 'I couldn\'t find any tax documents in your vault. Please upload your ITR, TDS certificates, or other tax-related documents for better assistance.'
    }
  }
  
  // Insurance queries
  if (lowerMessage.includes('insurance') || lowerMessage.includes('इंश्योरेंस') || lowerMessage.includes('policy')) {
    if (relatedDocuments.some(doc => doc.category === 'Insurance')) {
      return language === 'hi'
        ? `आपके इंश्योरेंस पॉलिसी डॉक्यूमेंट्स मिल गए हैं। मैं आपकी कवरेज, प्रीमियम, या रिन्यूअल डेट्स के बारे में बता सकता हूं।`
        : `I found your insurance policy documents. I can help you with coverage details, premium information, or renewal dates. What would you like to know?`
    } else {
      return 'I don\'t see any insurance documents uploaded yet. Upload your policy documents to get insights about coverage, premiums, and renewal dates.'
    }
  }
  
  // Medical queries
  if (lowerMessage.includes('medical') || lowerMessage.includes('health') || lowerMessage.includes('मेडिकल')) {
    if (relatedDocuments.some(doc => doc.category === 'Medical')) {
      return 'I found your medical documents. I can help you track appointments, medications, or health records. What specific information do you need?'
    } else {
      return 'Upload your medical reports, prescriptions, or health records to get personalized health insights and reminders.'
    }
  }
  
  // General document queries
  if (lowerMessage.includes('document') || lowerMessage.includes('file') || lowerMessage.includes('डॉक्यूमेंट')) {
    return `I can see ${relatedDocuments.length} relevant documents in your vault. I can help you organize, analyze, or find specific information. What would you like me to help you with?`
  }
  
  // Default response
  return language === 'hi'
    ? 'मैं आपके डॉक्यूमेंट्स को समझने और व्यवस्थित करने में आपकी मदद कर सकता हूं। कृपया अपना प्रश्न स्पष्ट करें या कोई विशिष्ट दस्तावेज़ अपलोड करें।'
    : 'I\'m here to help you understand and manage your documents. Please ask me specific questions about your documents or upload new ones for analysis.'
}