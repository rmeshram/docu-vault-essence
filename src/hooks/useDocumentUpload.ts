import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface UploadOptions {
  category?: string
  tags?: string[]
  enableAI?: boolean
  enableOCR?: boolean
}

export const useDocumentUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadDocument = async (file: File, options: UploadOptions = {}) => {
    setUploading(true)
    setProgress(0)

    try {
      console.log('Starting document upload:', file.name)
      
      // Get the authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('User not authenticated')

      console.log('Authenticated user:', authUser.id)

      const documentId = crypto.randomUUID()
      const filePath = `${authUser.id}/${documentId}-${file.name}`

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          user_id: authUser.id,
          name: file.name,
          mime_type: file.type,
          size: file.size,
          category: options.category || 'Personal',
          tags: options.tags || [],
          status: 'uploading'
        })
        .select()
        .single()

      if (docError) {
        console.error('Failed to create document record:', docError)
        throw docError
      }

      console.log('Document record created:', documentId)
      setProgress(25)

      // Step 2: Upload file to storage
      console.log('Uploading file to storage...')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { 
          cacheControl: '3600', 
          upsert: false 
        })

      if (uploadError) {
        console.error('Storage upload failed:', uploadError)
        // Update document status to error
        await supabase
          .from('documents')
          .update({ status: 'error' })
          .eq('id', documentId)
        throw uploadError
      }

      console.log('File uploaded to storage:', uploadData.path)
      setProgress(50)

      // Update document with storage path
      await supabase
        .from('documents')
        .update({ 
          path: uploadData.path,
          status: 'processing'
        })
        .eq('id', documentId)

      setProgress(60)

      // Step 3: Trigger AI processing via Edge Function
      console.log('Starting AI analysis...')
      const fileUrl = supabase.storage.from('documents').getPublicUrl(uploadData.path).data.publicUrl

      const { data: processingResult, error: processingError } = await supabase.functions.invoke('document-processor', {
        body: {
          documentId: documentId,
          fileUrl: fileUrl,
          fileName: file.name,
          fileType: file.type,
          enableAI: options.enableAI ?? true,
          enableOCR: options.enableOCR ?? true,
          language: 'auto',
          processingOptions: {
            extractKeyInfo: true,
            generateSummary: true,
            detectDuplicates: true,
            createEmbedding: true
          }
        }
      })

      if (processingError) {
        console.error('AI processing failed:', processingError)
        // Don't throw - file is uploaded, just analysis failed
        await supabase
          .from('documents')
          .update({ status: 'error' })
          .eq('id', documentId)
      } else {
        console.log('AI processing completed:', processingResult)
      }

      setProgress(100)

      return {
        documentId: documentId,
        path: uploadData.path,
        url: fileUrl,
        document: document
      }
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return { uploadDocument, uploading, progress }
}
