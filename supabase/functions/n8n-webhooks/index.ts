import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookRequest {
  action: 'document_upload' | 'document_query' | 'chat_message';
  data: any;
  userId?: string;
  apiKey?: string;
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

    const url = new URL(req.url)
    const webhookType = url.pathname.split('/').pop()
    
    console.log('N8N Webhook triggered:', webhookType)

    const {
      action,
      data,
      userId,
      apiKey
    }: WebhookRequest = await req.json()

    // Basic API key validation (you should implement proper authentication)
    const expectedApiKey = Deno.env.get('N8N_WEBHOOK_API_KEY')
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    let result: any = {}

    switch (action) {
      case 'document_upload':
        result = await handleDocumentUploadWebhook(supabaseClient, data, userId)
        break
      
      case 'document_query':
        result = await handleDocumentQueryWebhook(supabaseClient, data, userId)
        break
      
      case 'chat_message':
        result = await handleChatMessageWebhook(supabaseClient, data, userId)
        break
      
      default:
        throw new Error(`Unsupported webhook action: ${action}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        webhook_type: webhookType,
        action: action,
        data: result,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('N8N webhook error:', error)
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

// Handle document upload webhook
async function handleDocumentUploadWebhook(
  supabaseClient: any, 
  data: any, 
  userId?: string
): Promise<any> {
  console.log('Processing document upload webhook:', data)

  const { 
    file_url, 
    file_name, 
    file_type, 
    category = 'Personal',
    tags = [],
    user_id = userId
  } = data

  if (!user_id) {
    throw new Error('User ID is required for document upload')
  }

  // Create document record
  const documentId = crypto.randomUUID()
  
  const { data: document, error: docError } = await supabaseClient
    .from('documents')
    .insert({
      id: documentId,
      user_id: user_id,
      name: file_name,
      file_url: file_url,
      mime_type: file_type,
      category: category,
      tags: { tags },
      status: 'processing',
      upload_method: 'n8n_webhook'
    })
    .select()
    .single()

  if (docError) {
    throw new Error(`Failed to create document: ${docError.message}`)
  }

  // Trigger document processing
  const processingResponse = await supabaseClient.functions.invoke('document-processor', {
    body: {
      documentId: documentId,
      fileUrl: file_url,
      fileName: file_name,
      fileType: file_type,
      enableAI: true,
      enableOCR: true,
      processingOptions: {
        extractKeyInfo: true,
        generateSummary: true,
        createEmbedding: true
      }
    }
  })

  return {
    document_id: documentId,
    status: 'processing_started',
    processing_response: processingResponse
  }
}

// Handle document query webhook
async function handleDocumentQueryWebhook(
  supabaseClient: any, 
  data: any, 
  userId?: string
): Promise<any> {
  console.log('Processing document query webhook:', data)

  const { 
    query, 
    document_ids, 
    limit = 5,
    user_id = userId
  } = data

  if (!user_id) {
    throw new Error('User ID is required for document query')
  }

  // Perform RAG search
  const searchResponse = await supabaseClient.functions.invoke('rag-search', {
    body: {
      query: query,
      userId: user_id,
      limit: limit,
      documentIds: document_ids
    },
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    }
  })

  return {
    query: query,
    search_results: searchResponse.data,
    user_id: user_id
  }
}

// Handle chat message webhook
async function handleChatMessageWebhook(
  supabaseClient: any, 
  data: any, 
  userId?: string
): Promise<any> {
  console.log('Processing chat message webhook:', data)

  const { 
    message, 
    conversation_id,
    document_ids,
    language = 'en',
    user_id = userId
  } = data

  if (!user_id) {
    throw new Error('User ID is required for chat message')
  }

  let conversationId = conversation_id

  // Create conversation if not provided
  if (!conversationId) {
    const { data: conversation, error: convError } = await supabaseClient
      .from('chat_conversations')
      .insert({
        user_id: user_id,
        title: 'N8N Webhook Chat'
      })
      .select()
      .single()

    if (convError) {
      throw new Error(`Failed to create conversation: ${convError.message}`)
    }
    
    conversationId = conversation.id
  }

  // Send message through AI chat function
  const chatResponse = await supabaseClient.functions.invoke('ai-chat', {
    body: {
      conversationId: conversationId,
      message: message,
      documentIds: document_ids,
      language: language,
      includeDocumentContext: true
    },
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    }
  })

  return {
    conversation_id: conversationId,
    message_sent: message,
    ai_response: chatResponse.data,
    user_id: user_id
  }
}