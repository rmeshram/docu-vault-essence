# DocuVault AI - Deployment Guide

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18+ installed
3. **Supabase CLI**: Install globally
4. **Git**: For version control

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
# Via Supabase Dashboard or CLI
supabase projects create docuvault-ai --org-id your-org-id
```

### 4. Initialize Local Development
```bash
supabase init
supabase start
```

## Database Setup

### 1. Run Migrations
```bash
# Apply core schema
supabase db push

# Or run specific migration
supabase migration up
```

### 2. Enable Extensions
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 3. Set Up Storage Buckets
```bash
# Create storage buckets via Supabase Dashboard or SQL
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('documents', 'documents', false),
  ('thumbnails', 'thumbnails', false),
  ('avatars', 'avatars', true);
```

## Environment Variables

### 1. Supabase Environment Variables
```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend URL for redirects
FRONTEND_URL=https://your-app.com

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Google Services
GOOGLE_VISION_API_KEY=your-vision-key
GOOGLE_TRANSLATE_API_KEY=your-translate-key

# Payment Providers
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
RAZORPAY_KEY_ID=your-razorpay-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Notification Services
FIREBASE_SERVER_KEY=your-firebase-key
SENDGRID_API_KEY=your-sendgrid-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### 2. Set Environment Variables in Supabase
```bash
# Via Supabase CLI
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set GOOGLE_VISION_API_KEY=your-key
supabase secrets set STRIPE_SECRET_KEY=your-key

# Or via Dashboard: Settings > API > Environment Variables
```

## Deploy Edge Functions

### 1. Deploy All Functions
```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy ai-chat
supabase functions deploy document-ocr
supabase functions deploy document-upload
supabase functions deploy analytics-engine
supabase functions deploy reminder-engine
supabase functions deploy family-vault
supabase functions deploy translation-service
supabase functions deploy subscription-manager
supabase functions deploy search-engine
```

### 2. Test Functions
```bash
# Test locally
supabase functions serve

# Test specific function
curl -X POST http://localhost:54321/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"conversationId": "test", "message": "Hello"}'
```

## Production Deployment

### 1. Upgrade to Supabase Pro
- Go to Supabase Dashboard > Settings > Billing
- Upgrade to Pro plan for production features
- Enable additional compute resources

### 2. Configure Custom Domain
```bash
# Via Supabase Dashboard
# Settings > API > Custom Domain
# Add your domain and configure DNS
```

### 3. Set Up CDN
- Configure CloudFront or similar CDN
- Point to Supabase Storage for file delivery
- Enable compression and caching

### 4. Database Optimization
```sql
-- Optimize for production
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Create additional indexes for performance
CREATE INDEX CONCURRENTLY idx_documents_ai_summary_gin 
  ON documents USING gin(to_tsvector('english', ai_summary));

CREATE INDEX CONCURRENTLY idx_chat_messages_created_at_desc 
  ON chat_messages(created_at DESC);
```

## Security Configuration

### 1. Configure RLS Policies
```sql
-- Ensure all tables have proper RLS policies
-- Review and test access controls
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
```

### 2. Set Up API Rate Limiting
```javascript
// In Edge Functions
const rateLimiter = new Map();

function checkRateLimit(userId, limit = 100) {
  const now = Date.now();
  const windowStart = now - (60 * 60 * 1000); // 1 hour window
  
  if (!rateLimiter.has(userId)) {
    rateLimiter.set(userId, []);
  }
  
  const requests = rateLimiter.get(userId);
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= limit) {
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
}
```

### 3. Configure CORS
```javascript
// In each Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-app.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
}
```

## Monitoring Setup

### 1. Enable Logging
```bash
# View function logs
supabase functions logs ai-chat

# View database logs
supabase logs db
```

### 2. Set Up Alerts
```javascript
// Create monitoring function
CREATE OR REPLACE FUNCTION monitor_system_health()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for failed documents
  IF (SELECT COUNT(*) FROM documents WHERE processing_status = 'failed') > 10 THEN
    -- Send alert
    PERFORM pg_notify('system_alert', 'High number of failed document processing');
  END IF;
  
  -- Check storage usage
  IF (SELECT AVG(storage_used::float / storage_limit) FROM users WHERE subscription_tier != 'business') > 0.8 THEN
    PERFORM pg_notify('system_alert', 'High storage usage detected');
  END IF;
END;
$$;

-- Schedule monitoring (use pg_cron extension)
SELECT cron.schedule('system-health-check', '*/5 * * * *', 'SELECT monitor_system_health();');
```

### 3. Performance Monitoring
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
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Backup and Recovery

### 1. Automated Backups
- Supabase Pro includes automated daily backups
- Configure backup retention policy
- Test backup restoration process

### 2. Point-in-Time Recovery
```bash
# Restore to specific timestamp
supabase db restore --timestamp "2024-03-15 10:30:00"
```

### 3. Data Export
```bash
# Export specific tables
pg_dump -h your-db-host -U postgres -t documents > documents_backup.sql

# Export with data
pg_dump -h your-db-host -U postgres --data-only -t users > users_data.sql
```

## Scaling Considerations

### 1. Database Scaling
- Monitor connection pool usage
- Implement read replicas for analytics queries
- Use connection pooling (PgBouncer)
- Partition large tables by date

### 2. Storage Scaling
- Implement lifecycle policies for old documents
- Use compression for archived files
- Consider cold storage for rarely accessed files

### 3. Function Scaling
- Monitor function execution times
- Implement caching for expensive operations
- Use async processing for heavy tasks
- Consider function warming for critical paths

## CI/CD Pipeline

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Supabase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Supabase CLI
        run: npm install -g supabase
        
      - name: Deploy migrations
        run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      - name: Deploy functions
        run: supabase functions deploy --no-verify-jwt
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 2. Environment-Specific Deployments
```bash
# Development
supabase link --project-ref your-dev-project
supabase db push

# Staging
supabase link --project-ref your-staging-project
supabase db push

# Production
supabase link --project-ref your-prod-project
supabase db push
```

## Health Checks

### 1. API Health Check
```javascript
// Create health check endpoint
export const healthCheck = async () => {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    ai_services: await checkAIServices(),
    external_apis: await checkExternalAPIs()
  }
  
  return {
    status: Object.values(checks).every(check => check.status === 'healthy') ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  }
}
```

### 2. Database Health
```sql
-- Check database connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Check table health
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

## Troubleshooting

### Common Issues

1. **Function Timeout**
   - Increase function timeout in Supabase Dashboard
   - Optimize function code for performance
   - Use async processing for heavy operations

2. **Storage Quota Exceeded**
   - Monitor storage usage
   - Implement cleanup policies
   - Upgrade storage limits

3. **Rate Limiting**
   - Implement exponential backoff
   - Use caching to reduce API calls
   - Optimize query patterns

4. **Database Performance**
   - Add missing indexes
   - Optimize complex queries
   - Use EXPLAIN ANALYZE for query planning

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
```

## Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed and tested
- [ ] Storage buckets created with proper policies
- [ ] RLS policies tested and verified
- [ ] Rate limiting implemented
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Documentation updated
- [ ] Team access configured
- [ ] Compliance requirements met

## Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Review error logs and performance metrics
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and optimize database performance
4. **Annually**: Security audit and compliance review

### Monitoring Dashboards
- Set up Grafana/DataDog dashboards
- Monitor key business metrics
- Set up alerting for critical issues
- Track user engagement and feature usage

This deployment guide ensures a production-ready, scalable, and secure DocuVault AI backend on Supabase.