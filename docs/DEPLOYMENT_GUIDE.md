# DocuVault AI - Complete Deployment Guide

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18+ installed
3. **Supabase CLI**: Install globally
4. **Git**: For version control
5. **External API Keys**: OpenAI, Google Cloud, Stripe/Razorpay

## Initial Setup

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Create New Project
```bash
# Create project via Supabase Dashboard
# Note the project reference ID and database password
```

### 4. Initialize Local Development
```bash
# Clone your repository
git clone <your-repo-url>
cd docuvault-ai

# Initialize Supabase
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Start local development
supabase start
```

## Database Setup

### 1. Enable Required Extensions
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

### 2. Run Database Migrations
```bash
# Apply all migrations
supabase db push

# Or run specific migration
supabase migration up --file create_enhanced_schema.sql
```

### 3. Set Up Storage Buckets
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('thumbnails', 'thumbnails', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Set up storage policies
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public access for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Environment Variables

### 1. Core Supabase Variables
```bash
# .env (for local development)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend URL for redirects and webhooks
FRONTEND_URL=https://your-app.com
```

### 2. AI and ML Services
```bash
# OpenAI for advanced AI features
OPENAI_API_KEY=sk-your-openai-key

# Anthropic Claude as fallback
ANTHROPIC_API_KEY=your-anthropic-key

# Google Cloud Services
GOOGLE_VISION_API_KEY=your-google-vision-key
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Hugging Face for specialized models
HUGGINGFACE_API_KEY=your-huggingface-key
```

### 3. Payment Providers
```bash
# Stripe (International)
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key

# Razorpay (India)
RAZORPAY_KEY_ID=rzp_live_your-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

### 4. Communication Services
```bash
# Firebase for push notifications
FIREBASE_SERVER_KEY=your-firebase-server-key
FIREBASE_PROJECT_ID=your-firebase-project

# Email service (SendGrid/Resend)
SENDGRID_API_KEY=SG.your-sendgrid-key
RESEND_API_KEY=re_your-resend-key

# SMS service (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone
```

### 5. Security and Compliance
```bash
# Encryption keys
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret

# Blockchain verification (optional)
CHAINLINK_API_KEY=your-chainlink-key
ETHEREUM_RPC_URL=your-ethereum-rpc

# Compliance and monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

### 6. Set Environment Variables in Supabase
```bash
# Set secrets via Supabase CLI
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set GOOGLE_VISION_API_KEY=your-key
supabase secrets set STRIPE_SECRET_KEY=your-key
supabase secrets set RAZORPAY_KEY_SECRET=your-key
supabase secrets set FIREBASE_SERVER_KEY=your-key
supabase secrets set SENDGRID_API_KEY=your-key

# Or set via Supabase Dashboard:
# Project Settings > API > Environment Variables
```

## Deploy Edge Functions

### 1. Deploy All Functions
```bash
# Deploy all functions at once
supabase functions deploy

# Deploy with environment variables
supabase functions deploy --no-verify-jwt
```

### 2. Deploy Individual Functions
```bash
# Core document processing
supabase functions deploy document-upload
supabase functions deploy document-processor

# AI and chat features
supabase functions deploy ai-chat
supabase functions deploy translation-service

# Analytics and insights
supabase functions deploy analytics-engine
supabase functions deploy reminder-engine

# Family and collaboration
supabase functions deploy family-vault

# Business features
supabase functions deploy professional-marketplace
supabase functions deploy subscription-manager

# Search and discovery
supabase functions deploy search-engine
```

### 3. Test Functions Locally
```bash
# Start local development server
supabase functions serve

# Test specific function
curl -X POST http://localhost:54321/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "test", "message": "Hello AI"}'
```

## Production Deployment

### 1. Upgrade to Supabase Pro
- Go to Supabase Dashboard > Settings > Billing
- Upgrade to Pro plan ($25/month) for production features
- Enable additional compute resources
- Configure custom domain

### 2. Database Optimization for Production
```sql
-- Optimize for production workloads
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET max_connections = 200;

-- Create additional performance indexes
CREATE INDEX CONCURRENTLY idx_documents_ai_summary_gin 
  ON documents USING gin(to_tsvector('english', ai_summary));

CREATE INDEX CONCURRENTLY idx_chat_messages_created_at_desc 
  ON chat_messages(created_at DESC);

CREATE INDEX CONCURRENTLY idx_analytics_composite
  ON analytics_data(user_id, metric_type, date_recorded);

-- Optimize vector search performance
CREATE INDEX CONCURRENTLY idx_embeddings_ivfflat
  ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Partition large tables for better performance
CREATE TABLE analytics_data_2024 PARTITION OF analytics_data
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 3. Configure CDN and Caching
```bash
# Set up CloudFront distribution for Supabase Storage
# Configure caching rules:
# - Static assets: 1 year cache
# - Document thumbnails: 1 month cache
# - API responses: 5 minutes cache
```

### 4. Set Up Monitoring
```javascript
// Add to each Edge Function
const startTime = Date.now()

// ... function logic ...

// Log performance metrics
await supabaseClient
  .from('performance_metrics')
  .insert({
    function_name: 'ai-chat',
    execution_time_ms: Date.now() - startTime,
    memory_used_mb: getMemoryUsage(),
    timestamp: new Date().toISOString()
  })
```

## Security Configuration

### 1. Configure Row Level Security (RLS)
```sql
-- Verify all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Test RLS policies
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "test-user-id"}';
SELECT * FROM documents; -- Should only return user's documents
```

### 2. API Security Headers
```javascript
// Add to all Edge Functions
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### 3. Rate Limiting Implementation
```javascript
// Implement in each function
const rateLimiter = new Map()

function checkRateLimit(userId: string, tier: string) {
  const limits = {
    'free': 100,
    'premium': 500,
    'family_plus': 1000,
    'business': 5000
  }
  
  const limit = limits[tier] || 100
  const now = Date.now()
  const windowStart = now - (60 * 60 * 1000) // 1 hour window
  
  if (!rateLimiter.has(userId)) {
    rateLimiter.set(userId, [])
  }
  
  const requests = rateLimiter.get(userId)
  const recentRequests = requests.filter((time: number) => time > windowStart)
  
  if (recentRequests.length >= limit) {
    throw new Error('Rate limit exceeded')
  }
  
  recentRequests.push(now)
  rateLimiter.set(userId, recentRequests)
}
```

## External Service Integration

### 1. Google Cloud Setup
```bash
# Enable required APIs
gcloud services enable vision.googleapis.com
gcloud services enable translate.googleapis.com
gcloud services enable storage.googleapis.com

# Create service account
gcloud iam service-accounts create docuvault-ai \
  --display-name="DocuVault AI Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:docuvault-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/ml.developer"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=docuvault-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 2. OpenAI Setup
```bash
# Set up OpenAI organization and billing
# Create API key with appropriate limits
# Configure usage monitoring and alerts
```

### 3. Payment Provider Setup

#### Stripe Configuration
```bash
# Configure Stripe webhook endpoints
# Production: https://your-app.supabase.co/functions/v1/subscription-manager
# Events to listen for:
# - checkout.session.completed
# - invoice.payment_succeeded
# - customer.subscription.deleted
# - invoice.payment_failed
```

#### Razorpay Configuration
```bash
# Configure Razorpay webhook
# Webhook URL: https://your-app.supabase.co/functions/v1/subscription-manager
# Events:
# - payment.captured
# - payment.failed
# - subscription.cancelled
```

## CI/CD Pipeline

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy DocuVault AI Backend

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run security audit
        run: npm audit --audit-level high

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Link to staging project
        run: supabase link --project-ref ${{ secrets.SUPABASE_STAGING_PROJECT_REF }}
        
      - name: Deploy migrations
        run: supabase db push
        
      - name: Deploy functions
        run: supabase functions deploy --no-verify-jwt

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Link to production project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROD_PROJECT_REF }}
        
      - name: Deploy migrations
        run: supabase db push
        
      - name: Deploy functions
        run: supabase functions deploy --no-verify-jwt
        
      - name: Run post-deployment tests
        run: npm run test:integration
        
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Environment-Specific Deployments
```bash
# Development
supabase link --project-ref your-dev-project-ref
supabase db push
supabase functions deploy

# Staging
supabase link --project-ref your-staging-project-ref
supabase db push
supabase functions deploy

# Production
supabase link --project-ref your-prod-project-ref
supabase db push
supabase functions deploy
```

## Performance Optimization

### 1. Database Performance
```sql
-- Monitor slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Optimize vector search
VACUUM ANALYZE document_embeddings;
REINDEX INDEX idx_embeddings_ivfflat;
```

### 2. Function Performance
```javascript
// Add performance monitoring to functions
const performanceMonitor = {
  startTime: Date.now(),
  memoryStart: Deno.memoryUsage(),
  
  end() {
    const endTime = Date.now()
    const memoryEnd = Deno.memoryUsage()
    
    return {
      execution_time_ms: endTime - this.startTime,
      memory_used_mb: (memoryEnd.rss - this.memoryStart.rss) / 1024 / 1024,
      heap_used_mb: (memoryEnd.heapUsed - this.memoryStart.heapUsed) / 1024 / 1024
    }
  }
}
```

### 3. Caching Strategy
```javascript
// Implement Redis caching for frequently accessed data
const redis = new Redis(Deno.env.get('REDIS_URL'))

async function getCachedData(key: string, fetchFunction: () => Promise<any>, ttl: number = 3600) {
  try {
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    
    const data = await fetchFunction()
    await redis.setex(key, ttl, JSON.stringify(data))
    return data
  } catch (error) {
    console.error('Cache error:', error)
    return await fetchFunction()
  }
}
```

## Monitoring and Alerting

### 1. Health Check Implementation
```javascript
// Create health-check function
export const healthCheck = async () => {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    ai_services: await checkAIServices(),
    external_apis: await checkExternalAPIs(),
    memory_usage: Deno.memoryUsage(),
    uptime: process.uptime()
  }
  
  const isHealthy = Object.values(checks).every(check => 
    typeof check === 'object' ? check.status === 'healthy' : true
  )
  
  return {
    status: isHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }
}

async function checkDatabase() {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('count')
      .limit(1)
    
    return { status: 'healthy', response_time_ms: Date.now() }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}
```

### 2. Alerting Configuration
```sql
-- Create monitoring function
CREATE OR REPLACE FUNCTION monitor_system_health()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for failed document processing
  IF (SELECT COUNT(*) FROM documents WHERE status = 'failed' AND created_at > now() - interval '1 hour') > 10 THEN
    PERFORM pg_notify('system_alert', json_build_object(
      'type', 'high_failure_rate',
      'message', 'High number of document processing failures',
      'count', (SELECT COUNT(*) FROM documents WHERE status = 'failed' AND created_at > now() - interval '1 hour')
    )::text);
  END IF;
  
  -- Check storage usage
  IF (SELECT AVG(storage_used::float / storage_limit) FROM users WHERE subscription_tier != 'business') > 0.9 THEN
    PERFORM pg_notify('system_alert', json_build_object(
      'type', 'high_storage_usage',
      'message', 'Users approaching storage limits',
      'avg_usage_percent', (SELECT AVG(storage_used::float / storage_limit) * 100 FROM users)
    )::text);
  END IF;
  
  -- Check AI service health
  IF (SELECT COUNT(*) FROM chat_messages WHERE created_at > now() - interval '1 hour' AND ai_model IS NULL) > 50 THEN
    PERFORM pg_notify('system_alert', json_build_object(
      'type', 'ai_service_degraded',
      'message', 'AI service appears to be degraded'
    )::text);
  END IF;
END;
$$;

-- Schedule monitoring (requires pg_cron extension)
SELECT cron.schedule('system-health-check', '*/5 * * * *', 'SELECT monitor_system_health();');
```

### 3. Performance Monitoring
```javascript
// Add to critical functions
const metrics = {
  function_name: 'ai-chat',
  execution_time_ms: Date.now() - startTime,
  memory_used_mb: getMemoryUsage(),
  success: true,
  user_tier: userProfile.subscription_tier,
  timestamp: new Date().toISOString()
}

await supabaseClient
  .from('performance_metrics')
  .insert(metrics)
```

## Backup and Recovery

### 1. Automated Backups
```bash
# Supabase Pro includes automated daily backups
# Configure backup retention policy in Dashboard
# Test backup restoration process regularly

# Manual backup
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql

# Restore from backup
psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql
```

### 2. Point-in-Time Recovery
```bash
# Restore to specific timestamp (Supabase Pro feature)
supabase db restore --timestamp "2024-03-15 10:30:00"
```

### 3. Data Export and Migration
```bash
# Export specific tables
pg_dump -h db.your-project.supabase.co -U postgres \
  --table=documents --table=users --table=chat_messages \
  --data-only > user_data_backup.sql

# Export with schema
pg_dump -h db.your-project.supabase.co -U postgres \
  --schema-only > schema_backup.sql
```

## Scaling Considerations

### 1. Database Scaling
```sql
-- Monitor connection usage
SELECT count(*) as active_connections, state
FROM pg_stat_activity
WHERE state IS NOT NULL
GROUP BY state;

-- Implement connection pooling
-- Use PgBouncer for connection management
-- Configure read replicas for analytics queries

-- Partition large tables
CREATE TABLE documents_2024 PARTITION OF documents
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE analytics_data_2024 PARTITION OF analytics_data
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 2. Storage Scaling
```javascript
// Implement lifecycle policies
const archiveOldDocuments = async () => {
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
  
  const { data: oldDocuments } = await supabaseClient
    .from('documents')
    .select('id, file_path')
    .lt('accessed_at', sixMonthsAgo.toISOString())
    .eq('status', 'completed')
  
  // Move to cold storage or compress
  for (const doc of oldDocuments || []) {
    await moveToArchive(doc.file_path)
  }
}
```

### 3. Function Scaling
```javascript
// Implement function warming for critical paths
const warmFunction = async (functionName: string) => {
  try {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'warm' })
    })
  } catch (error) {
    console.log(`Function warming failed for ${functionName}:`, error)
  }
}

// Schedule warming for critical functions
setInterval(() => {
  warmFunction('ai-chat')
  warmFunction('document-processor')
  warmFunction('search-engine')
}, 5 * 60 * 1000) // Every 5 minutes
```

## Security Audit Checklist

### Pre-Production Security Review
- [ ] All RLS policies tested and verified
- [ ] API endpoints secured with proper authentication
- [ ] Rate limiting implemented and tested
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection implemented
- [ ] CSRF protection enabled
- [ ] Sensitive data encryption verified
- [ ] Audit logging comprehensive
- [ ] Error messages don't leak sensitive info
- [ ] File upload security (virus scanning, type validation)
- [ ] API key rotation procedures documented

### Compliance Checklist
- [ ] GDPR compliance implemented
- [ ] Indian Personal Data Protection Bill compliance
- [ ] HIPAA readiness for medical documents
- [ ] Data retention policies configured
- [ ] User consent management
- [ ] Right to deletion implemented
- [ ] Data portability features
- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] Cookie policy implemented

## Production Checklist

### Infrastructure
- [ ] Supabase Pro plan activated
- [ ] Custom domain configured
- [ ] SSL certificates installed
- [ ] CDN configured for global performance
- [ ] Database connection pooling enabled
- [ ] Read replicas configured for analytics
- [ ] Backup strategy implemented and tested
- [ ] Disaster recovery plan documented

### Security
- [ ] All environment variables secured
- [ ] API keys rotated and secured
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] Security headers implemented
- [ ] Vulnerability scanning completed
- [ ] Penetration testing performed
- [ ] Security incident response plan ready

### Monitoring
- [ ] Application performance monitoring (APM) configured
- [ ] Error tracking (Sentry) implemented
- [ ] Log aggregation set up
- [ ] Alerting rules configured
- [ ] Dashboard for key metrics created
- [ ] On-call rotation established
- [ ] Incident response procedures documented

### Business Continuity
- [ ] Multi-region deployment considered
- [ ] Failover procedures tested
- [ ] Data backup and recovery tested
- [ ] Service level agreements (SLAs) defined
- [ ] Customer communication plan for outages
- [ ] Capacity planning for growth
- [ ] Cost monitoring and optimization

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Function Timeout
```javascript
// Increase timeout in function
export const config = {
  timeout: 300 // 5 minutes for heavy processing
}

// Implement async processing for heavy tasks
const processLargeDocument = async (documentId: string) => {
  // Queue for background processing
  await supabaseClient
    .from('processing_queue')
    .insert({
      document_id: documentId,
      status: 'queued',
      priority: 'normal'
    })
  
  return { status: 'queued', message: 'Document queued for processing' }
}
```

#### 2. Storage Quota Issues
```javascript
// Implement storage cleanup
const cleanupStorage = async (userId: string) => {
  // Remove failed uploads
  const { data: failedUploads } = await supabaseClient
    .from('documents')
    .select('file_path')
    .eq('user_id', userId)
    .eq('status', 'failed')
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  
  for (const doc of failedUploads || []) {
    await supabaseClient.storage
      .from('documents')
      .remove([doc.file_path])
  }
}
```

#### 3. AI Service Degradation
```javascript
// Implement fallback AI providers
const getAIResponse = async (prompt: string) => {
  try {
    // Try OpenAI first
    return await getOpenAIResponse(prompt)
  } catch (error) {
    console.log('OpenAI failed, trying Anthropic:', error)
    try {
      return await getAnthropicResponse(prompt)
    } catch (fallbackError) {
      console.log('All AI services failed, using fallback:', fallbackError)
      return getFallbackResponse(prompt)
    }
  }
}
```

### Debug Commands
```bash
# View function logs
supabase functions logs ai-chat --follow

# Check database status
supabase status

# Test database connection
supabase db ping

# View real-time connections
supabase realtime logs

# Check storage usage
supabase storage ls documents --recursive

# Test specific function
curl -X POST http://localhost:54321/functions/v1/health-check
```

## Cost Optimization

### 1. Database Optimization
```sql
-- Archive old data
CREATE TABLE documents_archive AS 
SELECT * FROM documents 
WHERE created_at < now() - interval '2 years';

DELETE FROM documents 
WHERE created_at < now() - interval '2 years';

-- Optimize indexes
DROP INDEX IF EXISTS unused_index_name;
CREATE INDEX CONCURRENTLY idx_optimized ON table_name(column) WHERE condition;
```

### 2. Storage Optimization
```javascript
// Implement intelligent compression
const compressDocument = async (filePath: string) => {
  const { data: file } = await supabaseClient.storage
    .from('documents')
    .download(filePath)
  
  if (file && file.size > 5 * 1024 * 1024) { // 5MB threshold
    const compressed = await compressFile(file)
    
    await supabaseClient.storage
      .from('documents')
      .update(filePath, compressed)
  }
}
```

### 3. AI Cost Management
```javascript
// Implement smart AI usage
const optimizeAIUsage = async (query: string, userTier: string) => {
  // Use cheaper models for simple queries
  if (query.length < 50 && userTier === 'free') {
    return await getGPT35Response(query)
  }
  
  // Use premium models for complex queries
  return await getGPT4Response(query)
}
```

## Support and Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Monitor error rates and performance metrics
- [ ] Check system health dashboard
- [ ] Review critical alerts
- [ ] Monitor storage and compute usage

#### Weekly
- [ ] Review user feedback and support tickets
- [ ] Analyze usage patterns and trends
- [ ] Update security patches
- [ ] Review and optimize slow queries

#### Monthly
- [ ] Comprehensive security audit
- [ ] Performance optimization review
- [ ] Cost analysis and optimization
- [ ] Backup and recovery testing
- [ ] Capacity planning review

#### Quarterly
- [ ] Full security penetration testing
- [ ] Disaster recovery drill
- [ ] Compliance audit
- [ ] Architecture review for scaling
- [ ] Third-party service evaluation

This deployment guide ensures a production-ready, secure, and scalable DocuVault AI backend that can handle millions of users while maintaining high performance and reliability.