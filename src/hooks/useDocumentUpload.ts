import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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
      // If you have an edge function to create upload and return signed URL, call it.
      // Fallback: upload directly to Supabase Storage bucket named 'documents'.

      // Create a unique path
      const filePath = `uploads/${Date.now()}-${file.name}`

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (error) {
        throw error
      }

      setProgress(50)

      // Optionally call a processing function (edge function) to start OCR/AI
      try {
        await supabase.functions.invoke('document-processor', {
          body: {
            filePath: data?.path,
            fileName: file.name,
            contentType: file.type,
            options: {
              enableAI: options.enableAI ?? true,
              enableOCR: options.enableOCR ?? true,
              category: options.category,
              tags: options.tags || []
            }
          }
        })
      } catch (fnErr) {
        // It's ok if functions are not deployed yet
        console.warn('document-processor function call failed', fnErr)
      }

      setProgress(100)

      return {
        path: data?.path,
        url: supabase.storage.from('documents').getPublicUrl(data?.path || '')
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
