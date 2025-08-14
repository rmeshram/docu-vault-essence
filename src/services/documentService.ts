import { supabase } from '@/integrations/supabase/client';

export type DocumentCategory = 'Identity' | 'Financial' | 'Insurance' | 'Medical' | 'Legal' | 'Personal' | 'Business' | 'Tax';

export interface Document {
  id: string;
  user_id: string;
  name: string;
  size: number;
  file_type: string;
  category: DocumentCategory;
  storage_path?: string;
  thumbnail_url?: string;
  extracted_text?: string;
  ai_summary?: string;
  ai_confidence?: number;
  language_detected?: string;
  pages?: number;
  is_encrypted: boolean;
  is_verified: boolean;
  version: number;
  parent_document_id?: string;
  upload_method: string;
  created_at: string;
  updated_at: string;
}

export const documentService = {
  // Get all documents for the current user
  async getDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_tags(tag, is_ai_generated)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get documents by category
  async getDocumentsByCategory(category: DocumentCategory) {
    const { data, error } = await (supabase as any)
      .from('documents')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get single document
  async getDocument(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_tags(tag, is_ai_generated)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new document
  async createDocument(document: Partial<Document>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await (supabase as any)
      .from('documents')
      .insert({
        ...document,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update document
  async updateDocument(id: string, updates: Partial<Document>) {
    const { data, error } = await (supabase as any)
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete document
  async deleteDocument(id: string) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Search documents
  async searchDocuments(query: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`name.ilike.%${query}%,extracted_text.ilike.%${query}%,ai_summary.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Add tags to document
  async addDocumentTags(documentId: string, tags: string[]) {
    const tagData = tags.map(tag => ({
      document_id: documentId,
      tag: tag.trim(),
      is_ai_generated: false
    }));

    const { data, error } = await supabase
      .from('document_tags')
      .insert(tagData)
      .select();

    if (error) throw error;
    return data;
  },

  // Get recent documents
  async getRecentDocuments(limit: number = 10) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get document categories with counts
  async getCategoriesWithCounts() {
    const { data, error } = await (supabase as any)
      .from('documents')
      .select('category')
      .then(({ data }: any) => {
        const counts: Record<string, number> = {};
        data?.forEach((doc: any) => {
          counts[doc.category] = (counts[doc.category] || 0) + 1;
        });
        return { data: Object.entries(counts).map(([category, count]) => ({ category, count })), error: null };
      });

    if (error) throw error;
    return data;
  }
};