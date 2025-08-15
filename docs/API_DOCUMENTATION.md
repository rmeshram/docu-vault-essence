# DocuVault AI - Complete API Documentation

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

## Core API Endpoints

### 1. Document Management

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
  "uploadSource": "web",
  "metadata": {
    "client_info": "mobile_app_v1.0"
  }
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
    "duplicate_document_id": null,
    "storage_used": 2457600,
    "storage_limit": 53687091200,
    "processing_webhook_url": "webhook-url"
  }
}
```

#### Process Document (OCR + AI)
```http
POST /document-processor
```

**Request Body:**
```json
{
  "documentId": "uuid",
  "fileUrl": "storage-url",
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "enableOCR": true,
  "enableAI": true,
  "language": "auto",
  "processingOptions": {
    "extractKeyInfo": true,
    "generateSummary": true,
    "detectDuplicates": true,
    "createEmbedding": true
  }
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
    "aiConfidence": 95.5,
    "detectedLanguage": "en",
    "suggestedCategory": "Tax",
    "aiTags": ["tax", "income", "2024"],
    "keyInfo": {
      "dates": ["2024-03-15"],
      "amounts": ["₹85,000"],
      "important_numbers": ["PAN123456"],
      "names": ["John Doe"],
      "addresses": ["Mumbai, Maharashtra"]
    },
    "riskAssessment": {
      "level": "low",
      "factors": ["All required fields present"],
      "recommendations": ["Keep document secure"]
    },
    "embeddingCreated": true
  }
}
```

### 2. AI Chat System

#### Send Chat Message
```http
POST /ai-chat
```

**Request Body:**
```json
{
  "conversationId": "uuid",
  "message": "What's my total tax liability for 2024?",
  "documentIds": ["uuid1", "uuid2"],
  "language": "en",
  "includeDocumentContext": true,
  "voiceInput": false,
  "messageType": "text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "content": "Based on your tax documents, your total tax liability for 2024 is ₹18,500...",
      "confidence_score": 92.5,
      "tokens_used": 245,
      "processing_time_ms": 1250,
      "ai_model": "gpt-4"
    },
    "related_documents": [
      {
        "id": "uuid",
        "name": "Tax Return 2024",
        "category": "Tax",
        "summary": "Income tax return with ₹85,000 total income"
      }
    ],
    "queries_remaining": 142
  }
}
```

### 3. Advanced Search

#### Search Documents
```http
POST /search-engine
```

**Request Body:**
```json
{
  "query": "insurance policy expiring soon",
  "filters": {
    "category": "Insurance",
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "fileType": "pdf",
    "tags": ["important"],
    "minConfidence": 80,
    "language": "en"
  },
  "searchType": "ai_powered",
  "limit": 20,
  "offset": 0,
  "includeContent": false,
  "sortBy": "relevance"
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
        "ai_summary": "Health insurance with ₹5L coverage, expires March 2025",
        "relevance_score": 95,
        "search_type": "ai_powered",
        "ai_reasoning": "Document contains expiry information matching query",
        "tags": [
          {"tag": "insurance", "is_ai_generated": true},
          {"tag": "health", "is_ai_generated": true}
        ],
        "related_documents": [
          {"document_id": "uuid2", "relationship_type": "related"}
        ],
        "sharing_info": [],
        "content_preview": "Health Insurance Policy... expires on 31/03/2025..."
      }
    ],
    "total_count": 5,
    "suggestions": [
      "Filter by Insurance documents",
      "Show all expiring documents",
      "Set renewal reminders"
    ],
    "search_metadata": {
      "processing_time_ms": 245,
      "result_quality_score": 88,
      "search_tips": [
        "Use specific keywords for better results",
        "Try semantic search for conceptual queries"
      ]
    }
  }
}
```

### 4. Smart Reminders

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
    "reminder_type": "renewal",
    "category": "Insurance",
    "urgency": "high",
    "document_id": "uuid",
    "amount": "₹25,000",
    "is_recurring": true,
    "recurrence_pattern": {
      "frequency": "yearly",
      "interval": 1
    },
    "notification_settings": {
      "email": true,
      "push": true,
      "sms": false
    }
  }
}
```

#### Auto-Generate Reminders
```http
POST /reminder-engine
```

**Request Body:**
```json
{
  "action": "auto_generate",
  "documentId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_reminders": [
      {
        "id": "uuid",
        "title": "Insurance Policy Renewal",
        "reminder_date": "2024-02-15T09:00:00Z",
        "urgency": "high",
        "is_auto_generated": true,
        "ai_confidence": 90
      }
    ]
  }
}
```

### 5. Family Vault Management

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
    "emergency_access_enabled": true,
    "encryption_level": "enhanced"
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
      "can_upload": true,
      "can_edit": false,
      "can_delete": false,
      "can_share": true,
      "can_invite": false
    },
    "emergency_contact": false
  }
}
```

#### Emergency Access
```http
POST /family-vault
```

**Request Body:**
```json
{
  "action": "emergency_access",
  "vaultId": "uuid",
  "emergencyCode": "emergency-access-code"
}
```

### 6. Professional Marketplace

#### Search Professionals
```http
POST /professional-marketplace
```

**Request Body:**
```json
{
  "action": "search_professionals",
  "searchFilters": {
    "professional_type": "chartered_accountant",
    "specialization": "tax_planning",
    "max_fee": 2000,
    "languages": ["en", "hi"],
    "rating_min": 4.0,
    "location": "Mumbai"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "professionals": [
      {
        "id": "uuid",
        "professional_type": "chartered_accountant",
        "business_name": "Tax Experts CA",
        "specialization": ["tax_planning", "gst_compliance"],
        "experience_years": 8,
        "average_rating": 4.7,
        "total_reviews": 156,
        "consultation_fee": 1500,
        "currency": "INR",
        "languages_spoken": ["en", "hi", "mr"],
        "next_available_slot": "2024-03-20T10:00:00Z",
        "response_time_category": "Fast",
        "users": {
          "full_name": "CA Rajesh Sharma",
          "avatar_url": "profile-image-url"
        }
      }
    ]
  }
}
```

#### Book Consultation
```http
POST /professional-marketplace
```

**Request Body:**
```json
{
  "action": "book_consultation",
  "consultationData": {
    "professional_id": "uuid",
    "title": "Tax Planning Consultation",
    "description": "Need help with tax planning for FY 2024-25",
    "scheduled_at": "2024-03-20T10:00:00Z",
    "duration_minutes": 60,
    "shared_documents": ["uuid1", "uuid2"]
  }
}
```

### 7. Analytics & Insights

#### Get Dashboard Analytics
```http
POST /analytics-engine
```

**Request Body:**
```json
{
  "type": "dashboard",
  "timeframe": "monthly",
  "includePersonalInsights": true,
  "includePredictions": false
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
      "processing_success_rate": 96,
      "upcoming_reminders": 3,
      "completed_reminders": 12,
      "high_priority_reminders": 1,
      "ai_queries_used": 67,
      "avg_ai_confidence": 92,
      "family_vaults": 1,
      "encrypted_documents": 43,
      "verified_documents": 40
    },
    "category_breakdown": {
      "Tax": 12,
      "Insurance": 8,
      "Identity": 15,
      "Financial": 10
    },
    "security_metrics": {
      "encryption_rate": 95.6,
      "verification_rate": 88.9,
      "compliance_score": 85
    },
    "recent_activity": [...],
    "storage_analysis": {...}
  }
}
```

#### Get Predictive Analytics
```http
POST /analytics-engine
```

**Request Body:**
```json
{
  "type": "predictions",
  "timeframe": "quarterly",
  "includePredictions": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": {
      "storage_forecast": {
        "next_month": 1500000000,
        "next_quarter": 4500000000,
        "yearly_projection": 18000000000,
        "confidence": "high"
      },
      "document_growth": {
        "next_month": 15,
        "next_quarter": 45,
        "confidence": "high"
      },
      "ai_usage_trend": {
        "next_month": 120,
        "trend": "increasing",
        "confidence": "medium"
      },
      "cost_projection": {
        "current_tier_sufficient": false,
        "recommended_tier": "premium",
        "projected_monthly_cost": 149,
        "savings_opportunities": ["Optimize storage", "Reduce duplicates"]
      }
    },
    "confidence_scores": {
      "storage_forecast": 85,
      "document_growth": 78,
      "ai_usage_trend": 82
    }
  }
}
```

### 8. Translation Service

#### Translate Text/Document
```http
POST /translation-service
```

**Request Body:**
```json
{
  "text": "This is a tax document with important information",
  "targetLanguage": "hi",
  "sourceLanguage": "en",
  "documentId": "uuid",
  "preserveFormatting": false,
  "translationType": "document"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "translated_text": "यह एक कर दस्तावेज़ है जिसमें महत्वपूर्ण जानकारी है",
    "source_language": "en",
    "target_language": "hi",
    "confidence": 95.2,
    "method": "google_translate",
    "supported_languages": {
      "hi": {"name": "Hindi", "native": "हिंदी", "rtl": false},
      "ta": {"name": "Tamil", "native": "தமிழ்", "rtl": false}
    },
    "character_count": 52,
    "estimated_cost": 0.001
  }
}
```

### 9. Subscription Management

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
        "price": {"monthly": 0, "yearly": 0},
        "storage_gb": 1,
        "ai_queries": 50,
        "family_members": 0,
        "features": ["Basic storage", "OCR processing"],
        "limits": {
          "daily_uploads": 10,
          "max_file_size_mb": 10
        }
      },
      "premium": {
        "name": "Premium",
        "price": {"monthly": 149, "yearly": 1490},
        "storage_gb": 50,
        "ai_queries": 500,
        "features": ["Advanced AI", "Priority support"]
      }
    },
    "current_promotions": [
      {
        "code": "LAUNCH50",
        "description": "50% off first 3 months",
        "valid_until": "2024-06-30"
      }
    ]
  }
}
```

#### Create Subscription
```http
POST /subscription-manager
```

**Request Body:**
```json
{
  "action": "create",
  "tier": "premium",
  "paymentProvider": "razorpay",
  "billingCycle": "monthly"
}
```

#### Check Usage
```http
POST /subscription-manager
```

**Request Body:**
```json
{
  "action": "usage_check"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_tier": "premium",
    "usage": {
      "storage": {
        "used_bytes": 15728640,
        "document_count": 25,
        "by_category": {
          "Tax": 5242880,
          "Insurance": 3145728
        }
      },
      "monthly_uploads": 15,
      "monthly_ai_queries": 67
    },
    "limits": {
      "daily_uploads": 100,
      "monthly_uploads": 1000,
      "ai_queries_per_month": 500
    },
    "recommendations": []
  }
}
```

## Real-time Subscriptions

### Document Processing Updates
```javascript
const subscription = supabaseClient
  .channel('document-processing')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'documents',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Document updated:', payload.new)
    // Handle processing status updates
    if (payload.new.status === 'completed') {
      showProcessingComplete(payload.new)
    }
  })
  .subscribe()
```

### Chat Messages
```javascript
const chatSubscription = supabaseClient
  .channel(`chat-${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('New message:', payload.new)
    addMessageToChat(payload.new)
  })
  .subscribe()
```

### Reminders and Notifications
```javascript
const notificationSubscription = supabaseClient
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('New notification:', payload.new)
    showNotification(payload.new)
  })
  .subscribe()
```

### Family Vault Updates
```javascript
const familySubscription = supabaseClient
  .channel('family-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'family_members',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Family vault update:', payload)
    updateFamilyVaultUI(payload)
  })
  .subscribe()
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Detailed error message",
  "error_code": "SPECIFIC_ERROR_CODE",
  "details": {
    "field": "Additional error context",
    "suggestion": "How to fix the error"
  },
  "upgrade_required": false
}
```

### Common Error Codes

- `UNAUTHORIZED`: Invalid or expired authentication token
- `STORAGE_LIMIT_EXCEEDED`: User has exceeded storage quota
- `AI_QUERY_LIMIT_EXCEEDED`: Monthly AI query limit reached
- `FILE_TOO_LARGE`: File exceeds maximum size limit
- `UNSUPPORTED_FILE_TYPE`: File type not supported
- `PROCESSING_FAILED`: Document processing failed
- `DUPLICATE_DETECTED`: Duplicate document found
- `FAMILY_VAULT_LIMIT_EXCEEDED`: Family vault member limit reached
- `SUBSCRIPTION_REQUIRED`: Feature requires paid subscription

## Rate Limiting

Rate limits by subscription tier:
- **Free**: 100 requests/hour, 1,000 requests/day
- **Premium**: 500 requests/hour, 10,000 requests/day  
- **Family Plus**: 1,000 requests/hour, 20,000 requests/day
- **Business**: 5,000 requests/hour, 100,000 requests/day

## File Upload Specifications

### Supported File Types
- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Images**: JPG, JPEG, PNG, WEBP, TIFF, BMP
- **Spreadsheets**: XLS, XLSX, CSV
- **Maximum file size**: 50MB per file (100MB for Business tier)
- **Batch upload**: Up to 20 files simultaneously

### File Processing Pipeline
1. **Upload**: Secure upload to Supabase Storage
2. **Virus Scan**: Automatic malware detection
3. **OCR**: Text extraction using Google Vision API
4. **AI Analysis**: Categorization, summarization, key info extraction
5. **Embedding**: Vector embedding generation for semantic search
6. **Duplicate Detection**: Compare with existing documents
7. **Notification**: Real-time status updates

## Language Support

### Supported Languages for OCR and Translation
- English (en) - Primary
- Hindi (hi) - हिंदी
- Tamil (ta) - தமிழ்
- Telugu (te) - తెలుగు
- Bengali (bn) - বাংলা
- Marathi (mr) - मराठी
- Gujarati (gu) - ગુજરાતી
- Kannada (kn) - ಕನ್ನಡ
- Malayalam (ml) - മലയാളം
- Punjabi (pa) - ਪੰਜਾਬੀ
- Odia (or) - ଓଡ଼ିଆ
- Assamese (as) - অসমীয়া
- Urdu (ur) - اردو
- Sanskrit (sa) - संस्कृत
- Nepali (ne) - नेपाली

## Security Features

### Authentication Methods
- Email/Password with Supabase Auth
- Phone number with OTP
- Biometric authentication (frontend integration)
- Multi-factor authentication (MFA)
- OAuth providers (Google, Apple)

### Data Protection
- AES-256 encryption for files at rest
- TLS 1.3 for data in transit
- Zero-knowledge encryption for sensitive documents
- Row-level security (RLS) for database access
- Audit logging for all operations
- GDPR and Indian data protection compliance

### Access Control
- Role-based permissions (Owner, Admin, Member, Viewer, Emergency)
- Time-limited sharing links
- IP-based access restrictions
- Device-based authentication
- Emergency access protocols

## SDK Integration Examples

### JavaScript/TypeScript
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

// Upload and process document
const uploadDocument = async (file, metadata) => {
  // Step 1: Initiate upload
  const { data: uploadData } = await supabase.functions.invoke('document-upload', {
    body: {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      ...metadata
    }
  })
  
  // Step 2: Upload file to signed URL
  const uploadResponse = await fetch(uploadData.upload_url, {
    method: 'PUT',
    body: file
  })
  
  if (!uploadResponse.ok) throw new Error('File upload failed')
  
  // Step 3: Trigger processing
  const { data: processData } = await supabase.functions.invoke('document-processor', {
    body: {
      documentId: uploadData.document_id,
      fileUrl: uploadData.file_path,
      fileName: file.name,
      fileType: file.type,
      enableOCR: true,
      enableAI: true
    }
  })
  
  return processData
}

// Chat with AI
const chatWithAI = async (conversationId, message, documentIds = []) => {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      conversationId,
      message,
      documentIds,
      includeDocumentContext: true,
      language: 'en'
    }
  })
  
  if (error) throw error
  return data
}

// Search documents
const searchDocuments = async (query, filters = {}) => {
  const { data, error } = await supabase.functions.invoke('search-engine', {
    body: {
      query,
      filters,
      searchType: 'hybrid',
      limit: 20,
      includeContent: false
    }
  })
  
  if (error) throw error
  return data
}
```

### React Native Integration
```javascript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DocumentPicker from 'react-native-document-picker'

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

// Document upload with camera
const uploadFromCamera = async () => {
  try {
    // Use react-native-image-picker or expo-camera
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
    })
    
    const file = result[0]
    const uploadResult = await uploadDocument(file, {
      category: 'Identity',
      uploadMethod: 'camera',
      uploadSource: 'mobile'
    })
    
    return uploadResult
  } catch (error) {
    console.error('Camera upload failed:', error)
  }
}

// Real-time document processing updates
const subscribeToDocumentUpdates = (userId, callback) => {
  return supabase
    .channel('document-updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'documents',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe()
}

// Voice-enabled chat
const voiceChatWithAI = async (audioFile, conversationId) => {
  // First, transcribe audio (use speech-to-text service)
  const transcription = await transcribeAudio(audioFile)
  
  // Then send to AI chat
  const response = await chatWithAI(conversationId, transcription, [], {
    voiceInput: true,
    messageType: 'voice'
  })
  
  return response
}
```

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
    "ai_confidence": 95.5,
    "category": "Tax",
    "key_insights": ["Tax liability: ₹18,500", "Refund expected: ₹2,300"]
  },
  "timestamp": "2024-03-15T10:30:00Z"
}
```

### AI Insight Generated
```json
{
  "event": "ai_insight.generated",
  "data": {
    "insight_id": "uuid",
    "user_id": "uuid",
    "insight_type": "opportunity",
    "title": "Tax Savings Opportunity",
    "potential_savings": 25000,
    "priority": "high"
  },
  "timestamp": "2024-03-15T10:30:00Z"
}
```

### Family Vault Activity
```json
{
  "event": "family_vault.member_joined",
  "data": {
    "vault_id": "uuid",
    "member_id": "uuid",
    "member_email": "family@example.com",
    "role": "member",
    "invited_by": "uuid"
  },
  "timestamp": "2024-03-15T10:30:00Z"
}
```

## Performance Optimization

### Caching Strategy
- Document metadata: 1 hour cache
- User profiles: 30 minutes cache
- Search results: 15 minutes cache
-AI responses: 24 hours cache for identical queries
- Analytics data: 6 hours cache

### Database Optimization
```sql
-- Optimize document search
CREATE INDEX CONCURRENTLY idx_documents_fts 
  ON documents USING gin(to_tsvector('english', name || ' ' || COALESCE(extracted_text, '')));

-- Optimize vector search
CREATE INDEX CONCURRENTLY idx_embeddings_cosine 
  ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Optimize analytics queries
CREATE INDEX CONCURRENTLY idx_analytics_user_date_type 
  ON analytics_data(user_id, date_recorded, metric_type);
```

### API Response Times
- Document upload initiation: <200ms
- Search queries: <500ms
- AI chat responses: <2000ms
- Analytics dashboard: <800ms
- File processing: 5-30 seconds (async)

## Testing and Monitoring

### Health Check Endpoint
```http
GET /health-check
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "ai_services": "healthy",
    "external_apis": "healthy"
  },
  "version": "1.0.0",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

### Monitoring Metrics
- API response times
- Error rates by endpoint
- User activity patterns
- Storage usage trends
- AI query patterns
- Database performance
- External API health

This comprehensive API documentation provides everything needed to integrate with the DocuVault AI backend, supporting all features from basic document management to advanced AI-powered insights and family collaboration.