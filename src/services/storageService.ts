import { supabase } from '@/integrations/supabase/client';

export const storageService = {
  // Upload file to storage
  async uploadFile(file: File, path: string, bucket = 'documents') {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  },

  // Get file URL
  async getFileUrl(path: string, bucket = 'documents') {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Get signed URL for download
  async getDownloadUrl(path: string, bucket = 'documents', expiresIn = 60) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  // Delete file
  async deleteFile(path: string, bucket = 'documents') {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },

  // List files in folder
  async listFiles(folder: string, bucket = 'documents') {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);

    if (error) throw error;
    return data;
  },

  // Move file
  async moveFile(fromPath: string, toPath: string, bucket = 'documents') {
    const { data, error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) throw error;
    return data;
  },

  // Copy file
  async copyFile(fromPath: string, toPath: string, bucket = 'documents') {
    const { data, error } = await supabase.storage
      .from(bucket)
      .copy(fromPath, toPath);

    if (error) throw error;
    return data;
  },

  // Get file metadata
  async getFileInfo(path: string, bucket = 'documents') {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        search: path
      });

    if (error) throw error;
    return data?.[0];
  }
};