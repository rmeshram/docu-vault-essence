# DocuVault AI - API Documentation

## Overview

DocuVault AI provides a comprehensive REST API built on Supabase for intelligent document management. All endpoints support real-time updates via Supabase Realtime subscriptions.

## Base URL
```
https://your-project.supabase.co/functions/v1
```

## Authentication

All API endpoints require authentication using Supabase JWT tokens:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_SUPABASE_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

## Core Endpoints

### Document Management

#### Upload Document
```http
POST /document-upload
```

**Request Body:**
```json
{
  "fileName": "tax_return_2024.pdf",
  "fileSize": 2457600,
  "fileType": "application/pdf",
  "category": "Tax",
  "familyVaultId": "optional-vault-id",
  "tags": ["important", "2024"],
  "uploadMethod": "manual",
  "uploadSource": "web"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document_id": "uuid",
    "upload_url": "signed-upload-url",
    "file_path": "user-id/timestamp_filename",
    "duplicate_detected": false,
    "storage_used": 2457600,
    "storage_limit": 53687091200
  }
}
```

#### Process Document (OCR + AI)
```http
POST /document-ocr
```

**Request Body:**
```json
{
  "documentId": "uuid",
  "fileUrl": "storage-url",
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "language": "auto",
  "enableAI": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "extractedText": "Document content...",
    "aiSummary": "AI-generated summary",
    "confidence": 95.5,
    "detectedLanguage": "en",
    "suggestedCategory": "Tax",
    "aiTags": ["tax", "income", "2024"],
    "keyInfo": {
      "dates": ["2024-03-15"],
      "amounts": ["₹85,000"],
      "important_numbers": ["PAN123456"]
    }
  }
}
```

### AI Chat

#### Send Chat Message
```http
POST /ai-chat
```

**Request Body:**
```json
{
  "conversationId": "uuid",
  "message": "What's my total tax liability?",
  "documentIds": ["uuid1", "uuid2"],
  "language": "en",
  "includeDocumentContext": true,
  "voiceInput": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "content": "Based on your tax documents...",
      "confidence": 92.5,
      "tokens_used": 245
    },
    "related_documents": [
      {
        "id": "uuid",
        "name": "Tax Return 2024",
        "category": "Tax",
        "summary": "Document summary"
      }
    ],
    "processing_time_ms": 1250,
    "queries_remaining": 142
  }
}
```

### Search

#### Search Documents
```http
POST /search-engine
```

**Request Body:**
```json
{
  "query": "insurance policy",
  "filters": {
    "category": "Insurance",
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "fileType": "pdf",
    "tags": ["important"]
  },
  "searchType": "hybrid",
  "limit": 20,
  "offset": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "name": "Health Insurance Policy",
        "category": "Insurance",
        "ai_summary": "Health insurance with ₹5L coverage",
        "relevance_score": 95,
        "search_type": "semantic"
      }
    ],
    "total_count": 5,
    "search_type": "hybrid"
  }
}
```

### Analytics

#### Get Dashboard Analytics
```http
POST /analytics-engine
```

**Request Body:**
```json
{
  "type": "dashboard",
  "timeframe": "monthly",
  "format": "json"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_documents": 45,
      "total_storage_bytes": 125829120,
      "upcoming_reminders": 3,
      "ai_queries_used": 67
    },
    "category_breakdown": {
      "Tax": 12,
      "Insurance": 8,
      "Identity": 15
    },
    "recent_activity": [...],
    "storage_analysis": {...}
  }
}
```

### Reminders

#### Create Reminder
```http
POST /reminder-engine
```

**Request Body:**
```json
{
  "action": "create",
  "reminderData": {
    "title": "Insurance Renewal",
    "description": "Health insurance policy expires soon",
    "reminder_date": "2024-04-15T09:00:00Z",
    "category": "Insurance",
    "urgency": "high",
    "document_id": "uuid",
    "amount": "₹25,000"
  }
}
```

### Family Vault

#### Create Family Vault
```http
POST /family-vault
```

**Request Body:**
```json
{
  "action": "create",
  "vaultData": {
    "name": "Family Documents",
    "description": "Shared family document vault",
    "member_limit": 5,
    "emergency_access_enabled": true
  }
}
```

#### Invite Family Member
```http
POST /family-vault
```

**Request Body:**
```json
{
  "action": "invite",
  "vaultId": "uuid",
  "memberData": {
    "email": "family@example.com",
    "role": "member",
    "permissions": {
      "can_view": true,
      "can_upload": false,
      "can_edit": false,
      "can_delete": false,
      "can_share": false
    }
  }
}
```

### Translation

#### Translate Text
```http
POST /translation-service
```

**Request Body:**
```json
{
  "text": "This is a tax document",
  "targetLanguage": "hi",
  "sourceLanguage": "en",
  "documentId": "uuid",
  "preserveFormatting": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "translated_text": "यह एक कर दस्तावेज़ है",
    "source_language": "en",
    "target_language": "hi",
    "confidence": 95.2,
    "supported_languages": {...}
  }
}
```

### Subscription Management

#### Get Subscription Plans
```http
POST /subscription-manager
```

**Request Body:**
```json
{
  "action": "get_plans"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": {
      "free": {
        "name": "Free",
        "price": 0,
        "storage_gb": 1,
        "ai_queries": 50,
        "features": [...]
      },
      "premium": {
        "name": "Premium",
        "price": 149,
        "storage_gb": 50,
        "ai_queries": 500,
        "features": [...]
      }
    }
  }
}
```

## Real-time Subscriptions

### Document Updates
```javascript
const subscription = supabase
  .channel('document-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'documents',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Document updated:', payload)
  })
  .subscribe()
```

### Chat Messages
```javascript
const chatSubscription = supabase
  .channel(`chat-${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('New message:', payload.new)
  })
  .subscribe()
```

### Reminders
```javascript
const reminderSubscription = supabase
  .channel('reminders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'reminders',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Reminder updated:', payload)
  })
  .subscribe()
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "error_code": "SPECIFIC_ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

## Rate Limiting

- Free tier: 100 requests/hour
- Premium tier: 1000 requests/hour
- Family Plus: 2000 requests/hour
- Business: 10000 requests/hour

## Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Images**: JPG, JPEG, PNG, WEBP, TIFF
- **Spreadsheets**: XLS, XLSX, CSV
- **Maximum file size**: 50MB per file

## Language Support

Supported languages for OCR and translation:
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Marathi (mr)
- Gujarati (gu)
- Kannada (kn)
- Malayalam (ml)
- Punjabi (pa)
- Odia (or)
- Assamese (as)
- Urdu (ur)
- Sanskrit (sa)
- Nepali (ne)

## Webhook Events

Subscribe to webhook events for real-time updates:

### Document Processing Complete
```json
{
  "event": "document.processed",
  "data": {
    "document_id": "uuid",
    "user_id": "uuid",
    "processing_status": "completed",
    "ai_confidence": 95.5
  }
}
```

### Subscription Updated
```json
{
  "event": "subscription.updated",
  "data": {
    "user_id": "uuid",
    "old_tier": "free",
    "new_tier": "premium",
    "effective_date": "2024-03-15T00:00:00Z"
  }
}
```

## SDK Integration

### JavaScript/TypeScript
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

// Upload document
const uploadDocument = async (file, metadata) => {
  const { data, error } = await supabase.functions.invoke('document-upload', {
    body: {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      ...metadata
    }
  })
  
  if (error) throw error
  return data
}

// Chat with AI
const chatWithAI = async (conversationId, message) => {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      conversationId,
      message,
      includeDocumentContext: true
    }
  })
  
  if (error) throw error
  return data
}
```

### React Native
```javascript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

## Testing

### Test Authentication
```bash
curl -X POST https://your-project.supabase.co/auth/v1/signup \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Test Document Upload
```bash
curl -X POST https://your-project.supabase.co/functions/v1/document-upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.pdf", "fileSize": 1024, "fileType": "application/pdf"}'
```

## Performance Optimization

- Use connection pooling for database queries
- Implement caching for frequently accessed data
- Use CDN for static assets and thumbnails
- Optimize vector search with proper indexing
- Batch operations where possible

## Security Best Practices

- Always validate input data
- Use parameterized queries to prevent SQL injection
- Implement rate limiting per user/IP
- Log all sensitive operations
- Use signed URLs for file access
- Encrypt sensitive data at rest
- Implement proper CORS policies

## Monitoring and Logging

Monitor these key metrics:
- API response times
- Error rates by endpoint
- User activity patterns
- Storage usage trends
- AI query usage
- Database performance

Use Supabase Dashboard and integrate with external monitoring tools like DataDog or New Relic for production monitoring.