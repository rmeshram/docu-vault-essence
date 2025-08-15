import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DigiLockerRequest {
  action: 'connect' | 'sync' | 'disconnect' | 'fetch_document';
  accessToken?: string;
  documentType?: string;
  documentId?: string;
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
      documentType,
      documentId
    }: DigiLockerRequest = await req.json()

    console.log(`DigiLocker ${action} request for user: ${user.id}`)

    switch (action) {
      case 'connect':
        if (!accessToken) {
          throw new Error('Access token required for connection')
        }

        // Verify token with DigiLocker API
        const profileResponse = await fetch('https://api.digitallocker.gov.in/public/oauth2/2/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!profileResponse.ok) {
          throw new Error('Invalid DigiLocker access token')
        }

        const profileData = await profileResponse.json()

        // Store integration
        await supabaseClient
          .from('integrations')
          .upsert({
            user_id: user.id,
            service: 'digilocker',
            access_token: accessToken,
            metadata: {
              profile: profileData,
              connected_at: new Date().toISOString()
            },
            is_active: true
          })

        return new Response(
          JSON.stringify({
            success: true,
            message: 'DigiLocker connected successfully',
            data: { profile: profileData }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'sync':
        // Get stored access token
        const { data: integration } = await supabaseClient
          .from('integrations')
          .select('access_token, metadata')
          .eq('user_id', user.id)
          .eq('service', 'digilocker')
          .eq('is_active', true)
          .single()

        if (!integration) {
          throw new Error('DigiLocker not connected')
        }

        // Fetch issued documents
        const issuedDocsResponse = await fetch('https://api.digitallocker.gov.in/public/oauth2/2/files/issued', {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!issuedDocsResponse.ok) {
          throw new Error('Failed to fetch DigiLocker documents')
        }

        const issuedDocs = await issuedDocsResponse.json()
        const documents = issuedDocs.items || []

        const processedDocuments = []

        // Process each document
        for (const doc of documents) {
          try {
            // Download document
            const downloadResponse = await fetch(`https://api.digitallocker.gov.in/public/oauth2/2/files/issued/${doc.uri}`, {
              headers: {
                'Authorization': `Bearer ${integration.access_token}`,
                'Content-Type': 'application/json'
              }
            })

            if (!downloadResponse.ok) continue

            const documentBuffer = await downloadResponse.arrayBuffer()
            const documentData = new Uint8Array(documentBuffer)

            // Upload to Supabase storage
            const documentId = crypto.randomUUID()
            const fileName = `${doc.type || 'document'}-${doc.name || documentId}.pdf`
            const filePath = `${user.id}/digilocker/${documentId}-${fileName}`

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
              .from('documents')
              .upload(filePath, documentData, {
                contentType: 'application/pdf',
                cacheControl: '3600'
              })

            if (uploadError) {
              console.error('Upload failed:', uploadError)
              continue
            }

            // Determine category based on document type
            const category = categorizeDigiLockerDocument(doc.type || doc.name)

            // Create document record
            const { data: document, error: docError } = await supabaseClient
              .from('documents')
              .insert({
                id: documentId,
                user_id: user.id,
                name: doc.name || fileName,
                mime_type: 'application/pdf',
                size: documentData.length,
                storage_path: uploadData.path,
                category: category,
                status: 'processing',
                ai_tags: ['digilocker', 'government', doc.type || 'document'],
                metadata: {
                  source: 'digilocker',
                  digilocker_uri: doc.uri,
                  digilocker_type: doc.type,
                  issue_date: doc.date,
                  issuer: doc.issuer,
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
                  fileName: fileName,
                  fileType: 'application/pdf',
                  enableAI: true,
                  enableOCR: true
                }
              })
            }
          } catch (error) {
            console.error('Error processing DigiLocker document:', error)
          }
        }

        // Log sync activity
        await supabaseClient
          .from('user_activity')
          .insert({
            user_id: user.id,
            activity_type: 'digilocker_sync',
            description: `Imported ${processedDocuments.length} documents from DigiLocker`,
            metadata: {
              documents_imported: processedDocuments.length,
              sync_timestamp: new Date().toISOString()
            }
          })

        return new Response(
          JSON.stringify({
            success: true,
            message: `Processed ${processedDocuments.length} documents from DigiLocker`,
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
          .eq('service', 'digilocker')

        return new Response(
          JSON.stringify({
            success: true,
            message: 'DigiLocker disconnected successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('DigiLocker integration error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `DigiLocker integration failed: ${error.message}`,
        details: {
          timestamp: new Date().toISOString(),
          function: 'digilocker-integration',
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

function categorizeDigiLockerDocument(type: string): string {
  const typeMap: { [key: string]: string } = {
    'AADHAAR': 'Identity',
    'PAN': 'Identity', 
    'PASSPORT': 'Identity',
    'DRIVING_LICENSE': 'Identity',
    'VOTER_ID': 'Identity',
    'MARKSHEET': 'Education',
    'CERTIFICATE': 'Education',
    'INCOME_CERTIFICATE': 'Financial',
    'CASTE_CERTIFICATE': 'Personal',
    'DOMICILE_CERTIFICATE': 'Personal'
  }
  
  const upperType = type.toUpperCase()
  return typeMap[upperType] || 'Personal'
}