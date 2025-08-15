import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UploadRequest {
  fileName: string;
  fileSize: number;
  fileType: string;
  category?: string;
  familyVaultId?: string;
  tags?: string[];
  uploadMethod?: string;
  uploadSource?: string;
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

    // Get user profile
    const { data: userProfile, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userProfile) {
      throw new Error('User profile not found')
    }

    const {
      fileName,
      fileSize,
      fileType,
      category,
      familyVaultId,
      tags = [],
      uploadMethod = 'manual',
      uploadSource = 'web'
    }: UploadRequest = await req.json()

    // Check storage limits
    const newStorageUsed = userProfile.storage_used + fileSize
    if (newStorageUsed > userProfile.storage_limit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Storage limit exceeded',
          current_usage: userProfile.storage_used,
          limit: userProfile.storage_limit,
          upgrade_required: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 413,
        }
      )
    }

    // Check for duplicates
    const { data: existingDocs } = await supabaseClient
      .from('documents')
      .select('id, name, file_size')
      .eq('user_id', userProfile.id)
      .eq('name', fileName)
      .eq('file_size', fileSize)

    let isDuplicate = false
    let duplicateAction = 'create_new'
    
    if (existingDocs && existingDocs.length > 0) {
      isDuplicate = true
      // For now, create new version by default
      duplicateAction = 'create_version'
    }

    // Generate file path
    const fileExtension = fileName.split('.').pop()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const timestamp = Date.now()
    const filePath = `${userProfile.id}/${timestamp}_${sanitizedFileName}`

    // Create document record
    const documentData = {
      user_id: userProfile.id,
      family_vault_id: familyVaultId,
      name: fileName,
      original_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      file_type: fileType,
      mime_type: fileType,
      category: category,
      tags: tags,
      upload_method: uploadMethod,
      upload_source: uploadSource,
      processing_status: 'pending',
      version_number: isDuplicate ? 2 : 1,
      parent_document_id: isDuplicate ? existingDocs[0].id : null,
      metadata: {
        upload_timestamp: new Date().toISOString(),
        original_size: fileSize,
        duplicate_detected: isDuplicate,
        duplicate_action: duplicateAction
      }
    }

    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (docError) {
      throw docError
    }

    // Generate signed upload URL
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('documents')
      .createSignedUploadUrl(filePath, {
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Update user storage usage
    await supabaseClient
      .from('users')
      .update({ storage_used: newStorageUsed })
      .eq('id', userProfile.id)

    // Log upload activity
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: userProfile.id,
        action: 'document_upload_initiated',
        resource_type: 'document',
        resource_id: document.id,
        new_values: {
          file_name: fileName,
          file_size: fileSize,
          category: category,
          upload_method: uploadMethod,
          duplicate_detected: isDuplicate
        }
      })

    // Record analytics
    await supabaseClient
      .from('analytics_data')
      .insert({
        user_id: userProfile.id,
        metric_type: 'document_upload',
        metric_category: 'usage',
        metric_value: 1,
        metric_data: {
          file_size: fileSize,
          file_type: fileType,
          category: category,
          upload_method: uploadMethod,
          duplicate_detected: isDuplicate
        },
        time_period: 'daily',
        date_recorded: new Date().toISOString().split('T')[0]
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          document_id: document.id,
          upload_url: uploadData.signedUrl,
          file_path: filePath,
          duplicate_detected: isDuplicate,
          storage_used: newStorageUsed,
          storage_limit: userProfile.storage_limit,
          processing_webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/document-ocr`
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Upload processing error:', error)
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