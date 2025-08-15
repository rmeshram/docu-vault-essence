import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export interface ChatMessage {
  id: string
  conversation_id: string
  message: string
  is_user_message: boolean
  created_at: string
  ai_model?: string
  confidence_score?: number
  related_document_ids?: string[]
}

export const useAIChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !conversationId) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching chat messages', error)
      } else {
        setMessages(data || [])
      }
      setLoading(false)
    }

    fetchMessages()

    const subscription = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage])
      })
      .subscribe()

    // Cleanup must be synchronous: remove channel without returning a Promise
    return () => {
      try {
        if (subscription) {
          // removeChannel is synchronous from the SDK perspective
          supabase.removeChannel(subscription)
        }
      } catch (err) {
        // ignore
      }
    }
  }, [user, conversationId])

  const sendMessage = async (
    message: string,
    documentIds: string[] = [],
    options?: { language?: string; voiceInput?: boolean; includeContext?: boolean }
  ) => {
    if (!user || !conversationId) return
    setSending(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          conversationId,
          message,
          documentIds,
          language: options?.language || 'en',
          includeDocumentContext: options?.includeContext ?? true,
          voiceInput: options?.voiceInput || false
        }
      })

      if (error) {
        throw error
      }

      return data
    } catch (err) {
      console.error('sendMessage error', err)
      throw err
    } finally {
      setSending(false)
    }
  }

  return { messages, loading, sending, sendMessage }
}
