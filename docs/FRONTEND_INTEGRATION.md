# DocuVault AI - Frontend Integration Guide

## Overview

This guide provides comprehensive instructions for integrating your React frontend with the DocuVault AI Supabase backend. It covers authentication, real-time features, file uploads, AI chat, and all advanced features.

## Installation and Setup

### 1. Install Required Dependencies
```bash
npm install @supabase/supabase-js
npm install @tanstack/react-query  # For data fetching
npm install zustand  # For state management
npm install react-hook-form  # For forms
npm install date-fns  # For date handling
```

### 2. Supabase Client Configuration
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Type-safe database types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
```

### 3. Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

## Authentication Integration

### 1. Auth Context Provider
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: any) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          // Clear local storage, reset app state
          localStorage.clear()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { error }
  }

  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('auth_user_id', user.id)

    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 2. Protected Route Component
```typescript
// src/components/ProtectedRoute.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireSubscription?: boolean
  minimumTier?: 'free' | 'premium' | 'family_plus' | 'business'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireSubscription = false,
  minimumTier = 'free'
}) => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  // Check subscription requirements
  if (requireSubscription) {
    return <SubscriptionGate minimumTier={minimumTier}>{children}</SubscriptionGate>
  }

  return <>{children}</>
}
```

## Document Management Integration

### 1. Document Upload Hook
```typescript
// src/hooks/useDocumentUpload.ts
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UploadOptions {
  category?: string
  familyVaultId?: string
  tags?: string[]
  enableAI?: boolean
  enableOCR?: boolean
}

export const useDocumentUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { user } = useAuth()

  const uploadDocument = async (file: File, options: UploadOptions = {}) => {
    if (!user) throw new Error('User not authenticated')

    setUploading(true)
    setProgress(0)

    try {
      // Step 1: Initiate upload
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('document-upload', {
        body: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          category: options.category,
          familyVaultId: options.familyVaultId,
          tags: options.tags || [],
          uploadMethod: 'manual',
          uploadSource: 'web'
        }
      })

      if (uploadError) throw uploadError

      setProgress(25)

      // Step 2: Upload file to signed URL
      const uploadResponse = await fetch(uploadData.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('File upload failed')
      }

      setProgress(50)

      // Step 3: Trigger processing
      const { data: processData, error: processError } = await supabase.functions.invoke('document-processor', {
        body: {
          documentId: uploadData.document_id,
          fileUrl: uploadData.file_path,
          fileName: file.name,
          fileType: file.type,
          enableOCR: options.enableOCR ?? true,
          enableAI: options.enableAI ?? true,
          language: 'auto'
        }
      })

      if (processError) throw processError

      setProgress(100)

      return {
        documentId: uploadData.document_id,
        processingData: processData
      }

    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return {
    uploadDocument,
    uploading,
    progress
  }
}
```

### 2. Document List Component
```typescript
// src/components/DocumentList.tsx
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Tables } from '@/lib/supabase'

type Document = Tables<'documents'>

export const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_tags(tag, is_ai_generated)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
      } else {
        setDocuments(data || [])
      }
      setLoading(false)
    }

    fetchDocuments()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('document-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Document update:', payload)
        
        if (payload.eventType === 'INSERT') {
          setDocuments(prev => [payload.new as Document, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setDocuments(prev => prev.map(doc => 
            doc.id === payload.new.id ? payload.new as Document : doc
          ))
        } else if (payload.eventType === 'DELETE') {
          setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  if (loading) return <DocumentListSkeleton />

  return (
    <div className="space-y-4">
      {documents.map(document => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </div>
  )
}
```

### 3. Real-time Document Processing
```typescript
// src/hooks/useDocumentProcessing.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface ProcessingStatus {
  documentId: string
  status: string
  stage: string
  progress: number
  error?: string
}

export const useDocumentProcessing = () => {
  const [processingDocuments, setProcessingDocuments] = useState<Map<string, ProcessingStatus>>(new Map())
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('document-processing')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const doc = payload.new as any
        
        setProcessingDocuments(prev => {
          const updated = new Map(prev)
          
          if (doc.status === 'completed' || doc.status === 'failed') {
            updated.delete(doc.id)
          } else {
            updated.set(doc.id, {
              documentId: doc.id,
              status: doc.status,
              stage: doc.processing_stage,
              progress: getProgressFromStage(doc.processing_stage),
              error: doc.processing_error
            })
          }
          
          return updated
        })
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [user])

  return {
    processingDocuments: Array.from(processingDocuments.values()),
    isProcessing: processingDocuments.size > 0
  }
}

function getProgressFromStage(stage: string): number {
  const stageProgress = {
    'upload': 20,
    'ocr': 40,
    'ai_analysis': 60,
    'categorization': 80,
    'embedding': 90,
    'completed': 100
  }
  return stageProgress[stage as keyof typeof stageProgress] || 0
}
```

## AI Chat Integration

### 1. Chat Hook
```typescript
// src/hooks/useAIChat.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface ChatMessage {
  id: string
  conversation_id: string
  message: string
  is_user_message: boolean
  created_at: string
  ai_model?: string
  confidence_score?: number
  related_document_ids?: string[]
}

export const useAIChat = (conversationId: string) => {
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
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data || [])
      }
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage
        setMessages(prev => [...prev, newMessage])
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [user, conversationId])

  const sendMessage = async (
    message: string, 
    documentIds?: string[], 
    options?: {
      language?: string
      voiceInput?: boolean
      includeContext?: boolean
    }
  ) => {
    if (!user || !conversationId) return

    setSending(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          conversationId,
          message,
          documentIds: documentIds || [],
          language: options?.language || 'en',
          includeDocumentContext: options?.includeContext ?? true,
          voiceInput: options?.voiceInput || false
        }
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    } finally {
      setSending(false)
    }
  }

  return {
    messages,
    loading,
    sending,
    sendMessage
  }
}
```

### 2. Chat Component
```typescript
// src/components/AIChat.tsx
import React, { useState, useRef, useEffect } from 'react'
import { useAIChat } from '@/hooks/useAIChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Mic, Paperclip } from 'lucide-react'

interface AIChatProps {
  conversationId: string
  selectedDocuments?: string[]
}

export const AIChat: React.FC<AIChatProps> = ({ conversationId, selectedDocuments }) => {
  const [inputMessage, setInputMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, loading, sending, sendMessage } = useAIChat(conversationId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return

    try {
      await sendMessage(inputMessage, selectedDocuments, {
        language: 'en',
        includeContext: true
      })
      setInputMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleVoiceInput = async () => {
    setIsRecording(!isRecording)
    
    if (!isRecording) {
      try {
        // Implement voice recording
        const audioBlob = await recordAudio()
        const transcription = await transcribeAudio(audioBlob)
        setInputMessage(transcription)
      } catch (error) {
        console.error('Voice input failed:', error)
      }
    }
  }

  if (loading) return <ChatSkeleton />

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {sending && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleVoiceInput}
            className={isRecording ? 'bg-red-500 text-white' : ''}
          >
            <Mic className="w-4 h-4" />
          </Button>
          
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask AI about your documents..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## Search Integration

### 1. Advanced Search Hook
```typescript
// src/hooks/useDocumentSearch.ts
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { debounce } from 'lodash'

interface SearchFilters {
  category?: string
  dateRange?: { start: string; end: string }
  fileType?: string
  tags?: string[]
  minConfidence?: number
}

interface SearchOptions {
  searchType?: 'text' | 'semantic' | 'hybrid' | 'ai_powered'
  limit?: number
  includeContent?: boolean
  sortBy?: 'relevance' | 'date' | 'name' | 'size'
}

export const useDocumentSearch = () => {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const { user } = useAuth()

  const search = useCallback(async (
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ) => {
    if (!user || !query.trim()) {
      setResults([])
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('search-engine', {
        body: {
          query,
          filters,
          searchType: options.searchType || 'hybrid',
          limit: options.limit || 20,
          offset: 0,
          includeContent: options.includeContent || false,
          sortBy: options.sortBy || 'relevance'
        }
      })

      if (error) throw error

      setResults(data.results || [])
      setSuggestions(data.suggestions || [])

      return data
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
      throw error
    } finally {
      setLoading(false)
    }
  }, [user])

  // Debounced search for real-time search as user types
  const debouncedSearch = useCallback(
    debounce((query: string, filters: SearchFilters, options: SearchOptions) => {
      search(query, filters, options)
    }, 300),
    [search]
  )

  return {
    results,
    loading,
    suggestions,
    search,
    debouncedSearch
  }
}
```

### 2. Search Component
```typescript
// src/components/DocumentSearch.tsx
import React, { useState } from 'react'
import { useDocumentSearch } from '@/hooks/useDocumentSearch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Sparkles } from 'lucide-react'

export const DocumentSearch: React.FC = () => {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [searchType, setSearchType] = useState<'hybrid' | 'ai_powered'>('hybrid')
  const { results, loading, suggestions, search, debouncedSearch } = useDocumentSearch()

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery, filters, { searchType })
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search documents, ask AI questions..."
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          <Button
            variant={searchType === 'ai_powered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchType('ai_powered')}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => handleSearch(suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {loading && <SearchSkeleton />}
        {results.map(result => (
          <SearchResultCard key={result.id} result={result} />
        ))}
        {!loading && results.length === 0 && query && (
          <EmptySearchResults query={query} />
        )}
      </div>
    </div>
  )
}
```

## Family Vault Integration

### 1. Family Vault Hook
```typescript
// src/hooks/useFamilyVault.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export const useFamilyVault = (vaultId?: string) => {
  const [vault, setVault] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchVaultData = async () => {
      if (vaultId) {
        // Fetch specific vault
        const { data: vaultData, error } = await supabase.functions.invoke('family-vault', {
          body: { action: 'get_vault', vaultId }
        })

        if (error) {
          console.error('Error fetching vault:', error)
        } else {
          setVault(vaultData.vault)
          setMembers(vaultData.vault.family_members || [])
        }
      } else {
        // Fetch user's vaults
        const { data: userVaults, error } = await supabase
          .from('family_members')
          .select(`
            *,
            family_vaults(*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (error) {
          console.error('Error fetching user vaults:', error)
        } else {
          setVault(userVaults?.[0]?.family_vaults || null)
        }
      }
      setLoading(false)
    }

    fetchVaultData()

    // Subscribe to family vault updates
    const subscription = supabase
      .channel('family-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'family_members',
        filter: vaultId ? `vault_id=eq.${vaultId}` : `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Family vault update:', payload)
        // Refresh data
        fetchVaultData()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [user, vaultId])

  const inviteMember = async (email: string, role: string, permissions: any) => {
    if (!vault) return

    try {
      const { data, error } = await supabase.functions.invoke('family-vault', {
        body: {
          action: 'invite',
          vaultId: vault.id,
          memberData: { email, role, permissions }
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to invite member:', error)
      throw error
    }
  }

  const updateMemberPermissions = async (memberId: string, permissions: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('family-vault', {
        body: {
          action: 'update_permissions',
          vaultId: vault.id,
          memberId,
          memberData: { permissions }
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update permissions:', error)
      throw error
    }
  }

  return {
    vault,
    members,
    loading,
    inviteMember,
    updateMemberPermissions
  }
}
```

### 2. Family Vault Component
```typescript
// src/components/FamilyVault.tsx
import React, { useState } from 'react'
import { useFamilyVault } from '@/hooks/useFamilyVault'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Users, Shield, Plus, Settings } from 'lucide-react'

export const FamilyVault: React.FC = () => {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const { vault, members, loading, inviteMember } = useFamilyVault()

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    try {
      await inviteMember(inviteEmail, inviteRole, {
        can_view: true,
        can_upload: inviteRole !== 'viewer',
        can_edit: inviteRole === 'admin',
        can_delete: inviteRole === 'admin',
        can_share: true
      })
      
      setInviteEmail('')
      // Show success message
    } catch (error) {
      // Show error message
    }
  }

  if (loading) return <FamilyVaultSkeleton />

  if (!vault) {
    return <CreateFamilyVaultPrompt />
  }

  return (
    <div className="space-y-6">
      {/* Vault Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{vault.name}</h2>
            <p className="text-gray-600">{vault.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{members.length}</p>
              <p className="text-sm text-gray-600">Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((vault.storage_used / vault.storage_limit) * 100)}%
              </p>
              <p className="text-sm text-gray-600">Storage Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Member */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Invite Family Member</h3>
        <div className="flex gap-4">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email address"
            type="email"
            className="flex-1"
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <option value="viewer">Viewer</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>
          <Button onClick={handleInvite}>
            <Plus className="w-4 h-4 mr-2" />
            Invite
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Family Members</h3>
        </div>
        <div className="divide-y">
          {members.map(member => (
            <FamilyMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

## Real-time Features

### 1. Notification System
```typescript
// src/hooks/useNotifications.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  action_url?: string
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
      } else {
        setNotifications(data || [])
        setUnreadCount(data?.filter(n => !n.is_read).length || 0)
      }
    }

    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico'
          })
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  }
}
```

### 2. Real-time Document Updates
```typescript
// src/hooks/useRealtimeDocuments.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'

export const useRealtimeDocuments = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('document-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Document realtime update:', payload)
        
        // Invalidate and refetch document queries
        queryClient.invalidateQueries({ queryKey: ['documents'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        
        // Handle specific events
        if (payload.eventType === 'UPDATE') {
          const document = payload.new as any
          
          if (document.status === 'completed') {
            // Show processing complete notification
            showNotification('Document processed successfully', document.name)
          } else if (document.status === 'failed') {
            // Show error notification
            showErrorNotification('Document processing failed', document.processing_error)
          }
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [user, queryClient])
}

function showNotification(title: string, message: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message })
  }
}

function showErrorNotification(title: string, message: string) {
  console.error(title, message)
  // Integrate with your toast/notification system
}
```

## Analytics Integration

### 1. Analytics Hook
```typescript
// src/hooks/useAnalytics.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export const useAnalytics = (type: string, timeframe: string = 'monthly') => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchAnalytics = async () => {
      try {
        const { data: analyticsData, error } = await supabase.functions.invoke('analytics-engine', {
          body: {
            type,
            timeframe,
            includePersonalInsights: true,
            includePredictions: type === 'predictions'
          }
        })

        if (error) throw error
        setData(analyticsData)
      } catch (error) {
        console.error('Analytics fetch failed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, type, timeframe])

  return { data, loading }
}
```

### 2. Dashboard Component
```typescript
// src/components/Dashboard.tsx
import React from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FileText, Brain, Shield, TrendingUp } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { data: dashboardData, loading } = useAnalytics('dashboard', 'monthly')

  if (loading) return <DashboardSkeleton />

  const overview = dashboardData?.overview || {}

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_documents}</div>
            <p className="text-xs text-muted-foreground">
              {overview.processing_success_rate}% processing success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Queries</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.ai_queries_used}</div>
            <p className="text-xs text-muted-foreground">
              {overview.avg_ai_confidence}% avg confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.security_metrics?.compliance_score}</div>
            <Progress 
              value={dashboardData?.security_metrics?.compliance_score || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((overview.total_storage_bytes / (1024 * 1024 * 1024)) * 10) / 10}GB
            </div>
            <Progress 
              value={(overview.total_storage_bytes / (50 * 1024 * 1024 * 1024)) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Document Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryChart data={dashboardData?.category_breakdown} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={dashboardData?.recent_activity || []} />
        </CardContent>
      </Card>
    </div>
  )
}
```

## Subscription Integration

### 1. Subscription Hook
```typescript
// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [plans, setPlans] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchSubscriptionData = async () => {
      try {
        // Get current subscription
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        setSubscription(subData)

        // Get usage data
        const { data: usageData, error: usageError } = await supabase.functions.invoke('subscription-manager', {
          body: { action: 'usage_check' }
        })

        if (!usageError) {
          setUsage(usageData)
        }

        // Get available plans
        const { data: plansData, error: plansError } = await supabase.functions.invoke('subscription-manager', {
          body: { action: 'get_plans' }
        })

        if (!plansError) {
          setPlans(plansData.plans)
        }

      } catch (error) {
        console.error('Error fetching subscription data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionData()
  }, [user])

  const createSubscription = async (tier: string, paymentProvider: string, billingCycle: string = 'monthly') => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-manager', {
        body: {
          action: 'create',
          tier,
          paymentProvider,
          billingCycle
        }
      })

      if (error) throw error

      // Redirect to payment URL
      window.location.href = data.payment_url

      return data
    } catch (error) {
      console.error('Failed to create subscription:', error)
      throw error
    }
  }

  const cancelSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-manager', {
        body: { action: 'cancel' }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      throw error
    }
  }

  return {
    subscription,
    usage,
    plans,
    loading,
    createSubscription,
    cancelSubscription
  }
}
```

### 2. Subscription Management Component
```typescript
// src/components/SubscriptionManager.tsx
import React from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Crown, Zap, Users, Shield } from 'lucide-react'

export const SubscriptionManager: React.FC = () => {
  const { subscription, usage, plans, loading, createSubscription } = useSubscription()

  if (loading) return <SubscriptionSkeleton />

  const currentTier = subscription?.tier || 'free'
  const currentPlan = plans?.[currentTier]

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Current Plan: {currentPlan?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Storage Usage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Storage</span>
                <span>{Math.round((usage?.storage.used_bytes / (1024 * 1024 * 1024)) * 10) / 10}GB / {currentPlan?.storage_gb}GB</span>
              </div>
              <Progress value={(usage?.storage.used_bytes / (currentPlan?.storage_gb * 1024 * 1024 * 1024)) * 100} />
            </div>

            {/* AI Queries */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>AI Queries</span>
                <span>{usage?.monthly_ai_queries} / {currentPlan?.ai_queries}</span>
              </div>
              <Progress value={(usage?.monthly_ai_queries / currentPlan?.ai_queries) * 100} />
            </div>

            {/* Uploads */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Uploads</span>
                <span>{usage?.monthly_uploads} / {currentPlan?.limits?.monthly_uploads}</span>
              </div>
              <Progress value={(usage?.monthly_uploads / currentPlan?.limits?.monthly_uploads) * 100} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(plans || {}).map(([tierKey, plan]: [string, any]) => (
          <Card key={tierKey} className={`relative ${currentTier === tierKey ? 'ring-2 ring-primary' : ''}`}>
            {tierKey === 'family_plus' && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500">
                Most Popular
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {tierKey === 'free' && <Zap className="w-5 h-5" />}
                {tierKey === 'premium' && <Crown className="w-5 h-5" />}
                {tierKey === 'family_plus' && <Users className="w-5 h-5" />}
                {tierKey === 'business' && <Shield className="w-5 h-5" />}
                {plan.name}
              </CardTitle>
              <div className="text-3xl font-bold">
                ₹{plan.price.monthly}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>📁 {plan.storage_gb}GB Storage</li>
                <li>🤖 {plan.ai_queries} AI Queries</li>
                {plan.family_members > 0 && (
                  <li>👥 {plan.family_members} Family Members</li>
                )}
                {plan.features.slice(0, 3).map((feature: string, index: number) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
              
              {currentTier !== tierKey && (
                <Button 
                  className="w-full mt-4"
                  onClick={() => createSubscription(tierKey, 'razorpay')}
                >
                  {currentTier === 'free' ? 'Upgrade' : 'Switch Plan'}
                </Button>
              )}
              
              {currentTier === tierKey && (
                <Badge className="w-full justify-center mt-4" variant="secondary">
                  Current Plan
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

## Professional Marketplace Integration

### 1. Professional Search Hook
```typescript
// src/hooks/useProfessionalSearch.ts
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SearchFilters {
  professional_type?: string
  specialization?: string
  max_fee?: number
  languages?: string[]
  rating_min?: number
}

export const useProfessionalSearch = () => {
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const searchProfessionals = async (filters: SearchFilters) => {
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('professional-marketplace', {
        body: {
          action: 'search_professionals',
          searchFilters: filters
        }
      })

      if (error) throw error

      setProfessionals(data.professionals || [])
      return data.professionals
    } catch (error) {
      console.error('Professional search failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const bookConsultation = async (professionalId: string, consultationData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('professional-marketplace', {
        body: {
          action: 'book_consultation',
          consultationData: {
            professional_id: professionalId,
            ...consultationData
          }
        }
      })

      if (error) throw error
      return data.consultation
    } catch (error) {
      console.error('Consultation booking failed:', error)
      throw error
    }
  }

  return {
    professionals,
    loading,
    searchProfessionals,
    bookConsultation
  }
}
```

## Offline Support

### 1. Offline Storage Hook
```typescript
// src/hooks/useOfflineStorage.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface OfflineDocument {
  id: string
  name: string
  content: string
  lastModified: string
  syncStatus: 'synced' | 'pending' | 'failed'
}

export const useOfflineStorage = () => {
  const [offlineDocuments, setOfflineDocuments] = useState<OfflineDocument[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Load offline documents from localStorage
    const stored = localStorage.getItem('offline_documents')
    if (stored) {
      setOfflineDocuments(JSON.parse(stored))
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineDocuments()
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const saveOfflineDocument = (document: Omit<OfflineDocument, 'syncStatus'>) => {
    const offlineDoc: OfflineDocument = {
      ...document,
      syncStatus: 'pending'
    }

    const updated = [...offlineDocuments, offlineDoc]
    setOfflineDocuments(updated)
    localStorage.setItem('offline_documents', JSON.stringify(updated))
  }

  const syncOfflineDocuments = async () => {
    const pendingDocs = offlineDocuments.filter(doc => doc.syncStatus === 'pending')

    for (const doc of pendingDocs) {
      try {
        // Sync with Supabase
        const { error } = await supabase
          .from('documents')
          .upsert({
            id: doc.id,
            name: doc.name,
            extracted_text: doc.content,
            updated_at: doc.lastModified
          })

        if (error) throw error

        // Mark as synced
        setOfflineDocuments(prev => prev.map(d => 
          d.id === doc.id ? { ...d, syncStatus: 'synced' } : d
        ))
      } catch (error) {
        console.error('Sync failed for document:', doc.id, error)
        
        // Mark as failed
        setOfflineDocuments(prev => prev.map(d => 
          d.id === doc.id ? { ...d, syncStatus: 'failed' } : d
        ))
      }
    }

    // Update localStorage
    localStorage.setItem('offline_documents', JSON.stringify(offlineDocuments))
  }

  return {
    offlineDocuments,
    isOnline,
    saveOfflineDocument,
    syncOfflineDocuments
  }
}
```

## Error Handling and Loading States

### 1. Error Boundary
```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    
    // Log error to monitoring service
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Integrate with Sentry or similar
    console.error('Error logged:', { error, errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We're sorry for the inconvenience</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 2. Loading States
```typescript
// src/components/LoadingStates.tsx
import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const DocumentListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
        <Skeleton className="h-12 w-12 rounded" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
)

export const ChatSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-xs space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
)

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  </div>
)
```

## Performance Optimization

### 1. Query Optimization with React Query
```typescript
// src/hooks/useOptimizedQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const useDocuments = (filters?: any) => {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentData: any) => {
      const { data, error } = await supabase.functions.invoke('document-upload', {
        body: documentData
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}
```

### 2. Image Optimization
```typescript
// src/utils/imageOptimization.ts
export const optimizeImage = async (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          resolve(optimizedFile)
        }
      }, 'image/jpeg', quality)
    }

    img.src = URL.createObjectURL(file)
  })
}
```

## Testing Integration

### 1. API Testing Utilities
```typescript
// src/utils/testUtils.ts
import { supabase } from '@/lib/supabase'

export const createTestUser = async () => {
  const testEmail = `test-${Date.now()}@example.com`
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'testpassword123'
  })
  
  if (error) throw error
  return data.user
}

export const uploadTestDocument = async (userId: string) => {
  const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
  
  const { data, error } = await supabase.functions.invoke('document-upload', {
    body: {
      fileName: testFile.name,
      fileSize: testFile.size,
      fileType: testFile.type,
      category: 'Personal'
    }
  })
  
  if (error) throw error
  return data
}

export const cleanupTestData = async (userId: string) => {
  // Clean up test documents
  await supabase
    .from('documents')
    .delete()
    .eq('user_id', userId)
  
  // Clean up test user
  await supabase.auth.admin.deleteUser(userId)
}
```

### 2. Component Testing
```typescript
// src/components/__tests__/DocumentList.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DocumentList } from '../DocumentList'
import { AuthProvider } from '@/contexts/AuthContext'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('DocumentList', () => {
  it('renders document list correctly', async () => {
    render(<DocumentList />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument()
    })
  })

  it('handles empty state', async () => {
    // Mock empty response
    render(<DocumentList />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText('No documents found')).toBeInTheDocument()
    })
  })
})
```

## Mobile-Specific Features

### 1. Camera Integration
```typescript
// src/hooks/useCameraUpload.ts (React Native)
import { useState } from 'react'
import { launchImageLibrary, launchCamera, MediaType } from 'react-native-image-picker'
import DocumentScanner from 'react-native-document-scanner-plugin'

export const useCameraUpload = () => {
  const [scanning, setScanning] = useState(false)

  const scanDocument = async (): Promise<File[]> => {
    setScanning(true)

    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 5,
        letUserAdjustCrop: true,
        croppedImageQuality: 100
      })

      if (scannedImages && scannedImages.length > 0) {
        // Convert scanned images to File objects
        const files = await Promise.all(
          scannedImages.map(async (imagePath, index) => {
            const response = await fetch(imagePath)
            const blob = await response.blob()
            return new File([blob], `scanned_document_${index + 1}.jpg`, {
              type: 'image/jpeg'
            })
          })
        )

        return files
      }

      return []
    } catch (error) {
      console.error('Document scanning failed:', error)
      throw error
    } finally {
      setScanning(false)
    }
  }

  const takePhoto = async (): Promise<File | null> => {
    return new Promise((resolve, reject) => {
      launchCamera(
        {
          mediaType: 'photo' as MediaType,
          quality: 0.8,
          includeBase64: false
        },
        (response) => {
          if (response.didCancel || response.errorMessage) {
            resolve(null)
            return
          }

          const asset = response.assets?.[0]
          if (asset && asset.uri) {
            fetch(asset.uri)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], asset.fileName || 'photo.jpg', {
                  type: asset.type || 'image/jpeg'
                })
                resolve(file)
              })
              .catch(reject)
          } else {
            resolve(null)
          }
        }
      )
    })
  }

  return {
    scanning,
    scanDocument,
    takePhoto
  }
}
```

### 2. Biometric Authentication
```typescript
// src/hooks/useBiometricAuth.ts (React Native)
import { useState } from 'react'
import TouchID from 'react-native-touch-id'
import { supabase } from '@/lib/supabase'

export const useBiometricAuth = () => {
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  const checkBiometricSupport = async () => {
    try {
      const biometryType = await TouchID.isSupported()
      setBiometricSupported(!!biometryType)
      return biometryType
    } catch (error) {
      setBiometricSupported(false)
      return null
    }
  }

  const enableBiometric = async () => {
    try {
      await TouchID.authenticate('Enable biometric authentication for DocuVault AI', {
        title: 'Biometric Authentication',
        subtitle: 'Use your fingerprint or face to secure your documents',
        fallbackLabel: 'Use Passcode'
      })

      // Generate and store biometric token
      const biometricToken = generateBiometricToken()
      
      const { error } = await supabase
        .from('users')
        .update({
          biometric_enabled: true,
          biometric_token: biometricToken
        })
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)

      if (error) throw error

      setBiometricEnabled(true)
      return true
    } catch (error) {
      console.error('Biometric setup failed:', error)
      return false
    }
  }

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      await TouchID.authenticate('Authenticate to access your documents', {
        title: 'DocuVault AI',
        subtitle: 'Use your biometric to unlock',
        fallbackLabel: 'Use Password'
      })

      return true
    } catch (error) {
      console.error('Biometric authentication failed:', error)
      return false
    }
  }

  return {
    biometricSupported,
    biometricEnabled,
    checkBiometricSupport,
    enableBiometric,
    authenticateWithBiometric
  }
}

function generateBiometricToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

## State Management

### 1. Global State with Zustand
```typescript
// src/store/appStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  language: string
  
  // Document State
  selectedDocuments: string[]
  currentCategory: string | null
  
  // Chat State
  activeConversationId: string | null
  
  // Upload State
  uploadQueue: any[]
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: string) => void
  setSelectedDocuments: (documents: string[]) => void
  setCurrentCategory: (category: string | null) => void
  setActiveConversationId: (id: string | null) => void
  addToUploadQueue: (file: any) => void
  removeFromUploadQueue: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      theme: 'light',
      language: 'en',
      selectedDocuments: [],
      currentCategory: null,
      activeConversationId: null,
      uploadQueue: [],

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSelectedDocuments: (documents) => set({ selectedDocuments: documents }),
      setCurrentCategory: (category) => set({ currentCategory: category }),
      setActiveConversationId: (id) => set({ activeConversationId: id }),
      addToUploadQueue: (file) => set((state) => ({ 
        uploadQueue: [...state.uploadQueue, file] 
      })),
      removeFromUploadQueue: (id) => set((state) => ({
        uploadQueue: state.uploadQueue.filter(f => f.id !== id)
      }))
    }),
    {
      name: 'docuvault-app-state',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
)
```

## Integration Checklist

### Frontend Setup
- [ ] Supabase client configured with correct URL and keys
- [ ] Authentication context provider implemented
- [ ] Protected routes configured
- [ ] Real-time subscriptions set up
- [ ] Error boundaries implemented
- [ ] Loading states designed
- [ ] Offline support implemented

### Document Management
- [ ] File upload with progress tracking
- [ ] Real-time processing status updates
- [ ] Document list with real-time updates
- [ ] Search functionality integrated
- [ ] Category management
- [ ] Tag management
- [ ] Version control UI

### AI Features
- [ ] Chat interface with real-time messages
- [ ] Voice input/output integration
- [ ] Multi-language support
- [ ] Document context in chat
- [ ] AI insights display
- [ ] Translation interface

### Family Features
- [ ] Family vault creation and management
- [ ] Member invitation system
- [ ] Permission management UI
- [ ] Shared document access
- [ ] Emergency access protocols

### Business Features
- [ ] Subscription management interface
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Professional marketplace
- [ ] Consultation booking
- [ ] Analytics dashboard

### Security
- [ ] Biometric authentication (mobile)
- [ ] MFA implementation
- [ ] Secure file handling
- [ ] Privacy controls
- [ ] Audit log access

### Performance
- [ ] Image optimization
- [ ] Lazy loading implemented
- [ ] Query optimization
- [ ] Caching strategy
- [ ] Bundle optimization

This comprehensive integration guide provides everything needed to connect your React frontend with the DocuVault AI Supabase backend, ensuring full feature parity and optimal performance.