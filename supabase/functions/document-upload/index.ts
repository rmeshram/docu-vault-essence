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
  metadata?: any;
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

    // Get user profile with current usage
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
      uploadSource = 'web',
      metadata = {}
    }: UploadRequest = await req.json()

    // Validate file size and type
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (fileSize > maxFileSize) {
      throw new Error('File size exceeds maximum limit of 50MB')
    }

    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt', 'webp', 'tiff']
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      throw new Error('File type not supported')
    }

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

    // Check daily upload limits
    const today = new Date().toISOString().split('T')[0]
    const { count: todayUploads } = await supabaseClient
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userProfile.id)
      .gte('created_at', today)

    const dailyLimit = getDailyUploadLimit(userProfile.subscription_tier)
    if ((todayUploads || 0) >= dailyLimit) {
      throw new Error(`Daily upload limit of ${dailyLimit} files exceeded`)
    }

    // Check for potential duplicates
    const { data: potentialDuplicates } = await supabaseClient
      .from('documents')
      .select('id, name, file_size, file_hash')
      .eq('user_id', userProfile.id)
      .eq('name', fileName)
      .eq('file_size', fileSize)

    let isDuplicate = false
    let duplicateDocumentId = null

    if (potentialDuplicates && potentialDuplicates.length > 0) {
      isDuplicate = true
      duplicateDocumentId = potentialDuplicates[0].id
    }

    // Generate secure file path
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${userProfile.id}/${timestamp}_${randomSuffix}_${sanitizedFileName}`

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
      custom_tags: tags,
      upload_method: uploadMethod,
      upload_source: uploadSource,
      upload_ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      upload_user_agent: req.headers.get('user-agent'),
      status: 'uploading',
      processing_stage: 'upload',
      version_number: isDuplicate ? 2 : 1,
      parent_document_id: duplicateDocumentId,
      metadata: {
        ...metadata,
        upload_timestamp: new Date().toISOString(),
        original_size: fileSize,
        duplicate_detected: isDuplicate,
        client_metadata: metadata
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

    // Generate signed upload URL for Supabase Storage
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
      .update({ 
        storage_used: newStorageUsed,
        monthly_uploads: userProfile.monthly_uploads + 1
      })
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
        },
        ip_address: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent')
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
          duplicate_detected: isDuplicate,
          family_vault: !!familyVaultId
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
          duplicate_document_id: duplicateDocumentId,
          storage_used: newStorageUsed,
          storage_limit: userProfile.storage_limit,
          processing_webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/document-processor`
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

function getDailyUploadLimit(tier: string): number {
  const limits = {
    'free': 10,
    'premium': 100,
    'family_plus': 200,
    'business': 1000
  }
  return limits[tier as keyof typeof limits] || 10
}