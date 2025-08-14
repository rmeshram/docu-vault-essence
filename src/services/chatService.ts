import { supabase } from '@/integrations/supabase/client';

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  message: string;
  is_user_message: boolean;
  related_document_ids?: string[];
  message_metadata?: any;
  created_at: string;
}

export const chatService = {
  // Get all conversations for the current user
  async getConversations() {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as ChatConversation[];
  },

  // Get messages for a conversation
  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as ChatMessage[];
  },

  // Create new conversation
  async createConversation(title?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title: title || 'New Conversation'
      })
      .select()
      .single();

    if (error) throw error;
    return data as ChatConversation;
  },

  // Send message to conversation
  async sendMessage(
    conversationId: string, 
    message: string, 
    isUserMessage: boolean = true,
    relatedDocumentIds?: string[],
    metadata?: any
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        message,
        is_user_message: isUserMessage,
        related_document_ids: relatedDocumentIds,
        message_metadata: metadata
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data as ChatMessage;
  },

  // Delete conversation
  async deleteConversation(conversationId: string) {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },

  // Update conversation title
  async updateConversationTitle(conversationId: string, title: string) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .update({ title })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data as ChatConversation;
  },

  // Subscribe to real-time messages
  subscribeToMessages(conversationId: string, callback: (message: ChatMessage) => void) {
    const subscription = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return subscription;
  }
};