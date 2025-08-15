import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GmailIntegrationRequest {
  action: 'connect' | 'sync' | 'disconnect' | 'search';
  accessToken?: string;
  query?: string;
  maxResults?: number;
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

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header missing')
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
    
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    const {
      action,
      accessToken,
      query = 'has:attachment (pdf OR jpg OR png OR doc)',
      maxResults = 10
    }: GmailIntegrationRequest = await req.json()

    console.log(`Gmail ${action} request for user: ${user.id}`)

    switch (action) {
      case 'connect':
        if (!accessToken) {
          throw new Error('Access token required for connection')
        }

        // Verify token with Google
        const tokenResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`)
        const tokenData = await tokenResponse.json()

        if (!tokenResponse.ok) {
          throw new Error('Invalid Gmail access token')
        }

        // Store integration
        await supabaseClient
          .from('integrations')
          .upsert({
            user_id: user.id,
            service: 'gmail',
            access_token: accessToken,
            metadata: {
              email: tokenData.email,
              scope: tokenData.scope,
              connected_at: new Date().toISOString()
            },
            is_active: true
          })

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Gmail connected successfully',
            data: { email: tokenData.email }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'sync':
        // Get stored access token
        const { data: integration } = await supabaseClient
          .from('integrations')
          .select('access_token, metadata')
          .eq('user_id', user.id)
          .eq('service', 'gmail')
          .eq('is_active', true)
          .single()

        if (!integration) {
          throw new Error('Gmail not connected')
        }

        // Search for emails with attachments
        const gmailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
          {
            headers: {
              'Authorization': `Bearer ${integration.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!gmailResponse.ok) {
          throw new Error('Failed to fetch Gmail messages')
        }

        const gmailData = await gmailResponse.json()
        const messages = gmailData.messages || []

        const processedDocuments = []

        // Process each message
        for (const message of messages) {
          const messageResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                'Authorization': `Bearer ${integration.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (!messageResponse.ok) continue

          const messageData = await messageResponse.json()
          const payload = messageData.payload

          // Extract attachments
          const attachments = []
          if (payload.parts) {
            for (const part of payload.parts) {
              if (part.filename && part.filename.length > 0 && part.body.attachmentId) {
                attachments.push({
                  filename: part.filename,
                  mimeType: part.mimeType,
                  attachmentId: part.body.attachmentId,
                  size: part.body.size
                })
              }
            }
          }

          // Download and store attachments
          for (const attachment of attachments) {
            try {
              const attachmentResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}/attachments/${attachment.attachmentId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${integration.access_token}`,
                    'Content-Type': 'application/json'
                  }
                }
              )

              if (!attachmentResponse.ok) continue

              const attachmentData = await attachmentResponse.json()
              const fileData = Uint8Array.from(atob(attachmentData.data.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))

              // Upload to Supabase storage
              const documentId = crypto.randomUUID()
              const filePath = `${user.id}/gmail/${documentId}-${attachment.filename}`

              const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('documents')
                .upload(filePath, fileData, {
                  contentType: attachment.mimeType,
                  cacheControl: '3600'
                })

              if (uploadError) {
                console.error('Upload failed:', uploadError)
                continue
              }

              // Create document record
              const { data: document, error: docError } = await supabaseClient
                .from('documents')
                .insert({
                  id: documentId,
                  user_id: user.id,
                  name: attachment.filename,
                  mime_type: attachment.mimeType,
                  size: attachment.size || 0,
                  storage_path: uploadData.path,
                  category: 'Email Attachment',
                  status: 'processing',
                  metadata: {
                    source: 'gmail',
                    message_id: message.id,
                    imported_at: new Date().toISOString()
                  }
                })
                .select()
                .single()

              if (!docError && document) {
                processedDocuments.push(document)

                // Trigger AI processing
                const fileUrl = supabaseClient.storage.from('documents').getPublicUrl(uploadData.path).data.publicUrl
                
                await supabaseClient.functions.invoke('document-processor', {
                  body: {
                    documentId: documentId,
                    fileUrl: fileUrl,
                    fileName: attachment.filename,
                    fileType: attachment.mimeType,
                    enableAI: true,
                    enableOCR: true
                  }
                })
              }
            } catch (error) {
              console.error('Error processing attachment:', error)
            }
          }
        }

        // Log sync activity
        await supabaseClient
          .from('user_activity')
          .insert({
            user_id: user.id,
            activity_type: 'gmail_sync',
            description: `Imported ${processedDocuments.length} documents from Gmail`,
            metadata: {
              documents_imported: processedDocuments.length,
              sync_timestamp: new Date().toISOString()
            }
          })

        return new Response(
          JSON.stringify({
            success: true,
            message: `Processed ${processedDocuments.length} documents from Gmail`,
            data: { 
              documentsImported: processedDocuments.length,
              documents: processedDocuments
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'disconnect':
        await supabaseClient
          .from('integrations')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('service', 'gmail')

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Gmail disconnected successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Gmail integration error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Gmail integration failed: ${error.message}`,
        details: {
          timestamp: new Date().toISOString(),
          function: 'gmail-integration',
          error_type: error.constructor.name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})