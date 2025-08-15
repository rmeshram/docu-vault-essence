/*
  # Enhanced DocuVault AI Database Schema

  1. Core Tables
    - Enhanced users table with subscription and biometric support
    - Documents with advanced metadata and version control
    - Document relationships and embeddings for AI features
    - Chat system with conversation management
    - Advanced reminders with smart automation
    - Family vaults with role-based permissions
    - Professional marketplace integration
    - Analytics and audit logging

  2. Security Features
    - Row Level Security (RLS) on all tables
    - Comprehensive audit logging
    - Encrypted storage references
    - Role-based access control

  3. AI/ML Features
    - Vector embeddings for semantic search
    - Document relationship mapping
    - Smart categorization support
    - Multi-language content support

  4. Business Features
    - Subscription management
    - Payment tracking
    - Professional marketplace
    - Family sharing and collaboration
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'family_plus', 'business');
CREATE TYPE document_status AS ENUM ('uploading', 'processing', 'completed', 'failed', 'archived');
CREATE TYPE processing_stage AS ENUM ('upload', 'ocr', 'ai_analysis', 'categorization', 'embedding', 'completed');
CREATE TYPE reminder_type AS ENUM ('deadline', 'renewal', 'review', 'action_required', 'custom');
CREATE TYPE notification_type AS ENUM ('reminder', 'document_shared', 'family_invite', 'system_alert', 'ai_insight');
CREATE TYPE professional_type AS ENUM ('doctor', 'lawyer', 'chartered_accountant', 'financial_advisor', 'insurance_agent');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');

-- Enhanced users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  phone text,
  full_name text,
  display_name text,
  avatar_url text,
  
  -- Subscription and limits
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  storage_used bigint DEFAULT 0,
  storage_limit bigint DEFAULT 1073741824, -- 1GB for free tier
  ai_queries_used integer DEFAULT 0,
  ai_queries_limit integer DEFAULT 50,
  monthly_uploads integer DEFAULT 0,
  monthly_upload_limit integer DEFAULT 100,
  
  -- Security and preferences
  mfa_enabled boolean DEFAULT false,
  biometric_enabled boolean DEFAULT false,
  biometric_token text,
  language_preference text DEFAULT 'en',
  timezone text DEFAULT 'Asia/Kolkata',
  dark_mode boolean DEFAULT false,
  notification_preferences jsonb DEFAULT '{"email": true, "push": true, "sms": false}',
  
  -- Compliance and verification
  kyc_status verification_status DEFAULT 'pending',
  kyc_documents jsonb,
  data_retention_days integer DEFAULT 2555, -- 7 years
  privacy_settings jsonb DEFAULT '{"analytics": true, "marketing": false}',
  
  -- Metadata
  last_login_at timestamptz,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_vault_id uuid,
  
  -- File information
  name text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  mime_type text,
  file_hash text, -- SHA-256 hash for integrity
  
  -- Document classification
  category document_category,
  subcategory text,
  document_type text, -- passport, aadhaar, insurance_policy, etc.
  
  -- Processing status
  status document_status DEFAULT 'uploading',
  processing_stage processing_stage DEFAULT 'upload',
  processing_error text,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  
  -- OCR and AI results
  extracted_text text,
  extracted_text_confidence numeric(5,2),
  ai_summary text,
  ai_confidence numeric(5,2),
  language_detected text,
  
  -- Document metadata
  metadata jsonb DEFAULT '{}', -- pages, dimensions, creation_date, etc.
  ai_tags text[],
  custom_tags text[],
  
  -- Version control
  version_number integer DEFAULT 1,
  parent_document_id uuid REFERENCES documents(id),
  is_latest_version boolean DEFAULT true,
  
  -- Security and access
  encryption_key_id text,
  is_encrypted boolean DEFAULT true,
  access_level text DEFAULT 'private', -- private, family, shared, public
  
  -- Upload tracking
  upload_method text DEFAULT 'manual', -- manual, camera, email, whatsapp, api
  upload_source text DEFAULT 'web', -- web, mobile, api
  upload_ip inet,
  upload_user_agent text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  accessed_at timestamptz DEFAULT now()
);

-- Document embeddings for AI search
CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI ada-002 embedding size
  content_hash text NOT NULL,
  model_version text DEFAULT 'text-embedding-ada-002',
  created_at timestamptz DEFAULT now()
);

-- Document relationships
CREATE TABLE IF NOT EXISTS document_relationships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id_1 uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_id_2 uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relationship_type text NOT NULL, -- duplicate, version, related, parent_child
  confidence_score numeric(5,2),
  ai_detected boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enhanced chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text DEFAULT 'New Conversation',
  language text DEFAULT 'en',
  context_document_ids uuid[],
  conversation_type text DEFAULT 'general', -- general, document_analysis, support
  metadata jsonb DEFAULT '{}',
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Message content
  message text NOT NULL,
  is_user_message boolean DEFAULT true,
  language text DEFAULT 'en',
  
  -- AI metadata
  ai_model text,
  confidence_score numeric(5,2),
  processing_time_ms integer,
  tokens_used integer,
  
  -- Context and attachments
  related_document_ids uuid[],
  message_type text DEFAULT 'text', -- text, voice, image
  voice_audio_url text,
  voice_duration_seconds integer,
  
  -- Message metadata
  message_metadata jsonb DEFAULT '{}',
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Enhanced reminders system
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  family_vault_id uuid,
  
  -- Reminder details
  title text NOT NULL,
  description text,
  reminder_type reminder_type DEFAULT 'custom',
  reminder_date timestamptz NOT NULL,
  
  -- Classification
  category document_category,
  urgency urgency_level DEFAULT 'medium',
  priority integer DEFAULT 5, -- 1-10 scale
  
  -- Financial information
  amount text,
  currency text DEFAULT 'INR',
  
  -- Automation and AI
  is_auto_generated boolean DEFAULT false,
  auto_generation_rule jsonb,
  ai_suggested boolean DEFAULT false,
  ai_confidence numeric(5,2),
  
  -- Status and completion
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  completion_notes text,
  
  -- Recurrence
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb, -- daily, weekly, monthly, yearly with specific rules
  next_occurrence_date timestamptz,
  
  -- Notifications
  notification_settings jsonb DEFAULT '{"email": true, "push": true, "sms": false}',
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamptz,
  
  -- External integrations
  calendar_event_id text,
  external_task_id text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced family vaults
CREATE TABLE IF NOT EXISTS family_vaults (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Storage and limits
  storage_used bigint DEFAULT 0,
  storage_limit bigint DEFAULT 53687091200, -- 50GB default
  member_limit integer DEFAULT 5,
  
  -- Features and settings
  emergency_access_enabled boolean DEFAULT true,
  auto_backup_enabled boolean DEFAULT true,
  encryption_level text DEFAULT 'standard', -- standard, enhanced, zero_knowledge
  
  -- Collaboration features
  collaborative_notes_enabled boolean DEFAULT true,
  version_control_enabled boolean DEFAULT true,
  audit_logging_enabled boolean DEFAULT true,
  
  -- Metadata
  vault_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Family vault members
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id uuid NOT NULL REFERENCES family_vaults(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text, -- For pending invitations
  
  -- Role and permissions
  role family_role DEFAULT 'member',
  status family_status DEFAULT 'pending',
  permissions jsonb DEFAULT '{"can_view": true, "can_upload": false, "can_edit": false, "can_delete": false, "can_share": false, "can_invite": false}',
  
  -- Emergency access
  emergency_contact boolean DEFAULT false,
  emergency_access_level text DEFAULT 'view_only',
  
  -- Invitation management
  invitation_token text UNIQUE,
  invitation_expires_at timestamptz,
  invited_by uuid REFERENCES users(id),
  joined_at timestamptz,
  
  -- Activity tracking
  last_access_at timestamptz,
  access_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Professional marketplace
CREATE TABLE IF NOT EXISTS professionals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  -- Professional details
  professional_type professional_type NOT NULL,
  license_number text NOT NULL,
  license_expiry_date date,
  specialization text[],
  experience_years integer,
  
  -- Verification
  verification_status verification_status DEFAULT 'pending',
  verification_documents jsonb,
  verified_at timestamptz,
  verified_by uuid REFERENCES users(id),
  
  -- Profile information
  business_name text,
  business_address jsonb,
  contact_details jsonb,
  bio text,
  languages_spoken text[],
  
  -- Ratings and reviews
  average_rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_consultations integer DEFAULT 0,
  
  -- Pricing and availability
  consultation_fee numeric(10,2),
  currency text DEFAULT 'INR',
  availability_schedule jsonb,
  is_available boolean DEFAULT true,
  
  -- Platform metrics
  response_time_hours numeric(4,2),
  completion_rate numeric(5,2),
  client_satisfaction numeric(3,2),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Professional services and templates
CREATE TABLE IF NOT EXISTS professional_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  
  -- Template details
  name text NOT NULL,
  description text,
  category text NOT NULL,
  template_type text NOT NULL, -- checklist, form, guide, document
  
  -- Content
  template_content jsonb NOT NULL,
  required_documents text[],
  estimated_time_minutes integer,
  
  -- Pricing
  price numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'INR',
  
  -- Usage and ratings
  usage_count integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0,
  
  -- Metadata
  tags text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Consultation bookings
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  
  -- Consultation details
  title text NOT NULL,
  description text,
  consultation_type text DEFAULT 'general', -- general, document_review, advisory
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  
  -- Status and payment
  status text DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  payment_status text DEFAULT 'pending', -- pending, paid, refunded
  amount numeric(10,2),
  currency text DEFAULT 'INR',
  
  -- Meeting details
  meeting_url text,
  meeting_notes text,
  shared_documents uuid[],
  
  -- Ratings and feedback
  user_rating integer, -- 1-5 stars
  user_feedback text,
  professional_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced analytics tables
CREATE TABLE IF NOT EXISTS analytics_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metric details
  metric_type text NOT NULL, -- document_upload, ai_usage, storage_usage, etc.
  metric_category text NOT NULL, -- usage, performance, engagement, revenue
  metric_value numeric NOT NULL,
  metric_unit text DEFAULT 'count',
  
  -- Dimensions
  metric_data jsonb DEFAULT '{}',
  time_period text NOT NULL, -- daily, weekly, monthly, yearly
  date_recorded date NOT NULL,
  
  -- Aggregation support
  is_aggregated boolean DEFAULT false,
  aggregation_level text, -- user, family, system
  
  created_at timestamptz DEFAULT now()
);

-- User activity and audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action details
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  
  -- Change tracking
  old_values jsonb,
  new_values jsonb,
  
  -- Context
  ip_address inet,
  user_agent text,
  session_id text,
  
  -- Risk assessment
  risk_level text DEFAULT 'low', -- low, medium, high, critical
  flagged_for_review boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  
  -- Targeting and delivery
  delivery_channels text[] DEFAULT ARRAY['push'], -- push, email, sms
  scheduled_for timestamptz DEFAULT now(),
  
  -- Status tracking
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  
  -- Action and context
  action_url text,
  action_data jsonb,
  related_resource_type text,
  related_resource_id uuid,
  
  -- Metadata
  priority integer DEFAULT 5, -- 1-10 scale
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now()
);

-- Document sharing and permissions
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Sharing target
  shared_with_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  shared_with_email text,
  shared_with_family_vault uuid REFERENCES family_vaults(id) ON DELETE CASCADE,
  
  -- Permissions and access
  permission_level text DEFAULT 'view', -- view, comment, edit, download
  access_restrictions jsonb DEFAULT '{}', -- time limits, download limits, etc.
  
  -- Security
  share_token text UNIQUE,
  password_protected boolean DEFAULT false,
  password_hash text,
  
  -- Tracking
  access_count integer DEFAULT 0,
  last_accessed_at timestamptz,
  expires_at timestamptz,
  
  -- Status
  is_active boolean DEFAULT true,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES users(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Insight details
  insight_type text NOT NULL, -- risk, opportunity, optimization, compliance
  title text NOT NULL,
  description text,
  confidence_score numeric(5,2),
  
  -- Priority and urgency
  priority urgency_level DEFAULT 'medium',
  urgency_score integer DEFAULT 5, -- 1-10 scale
  
  -- Financial impact
  potential_savings numeric(12,2),
  potential_cost numeric(12,2),
  currency text DEFAULT 'INR',
  
  -- Action items
  recommended_actions jsonb,
  action_deadline timestamptz,
  
  -- Context
  related_document_ids uuid[],
  related_categories text[],
  
  -- User interaction
  is_acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  user_feedback text,
  user_rating integer, -- 1-5 stars for insight quality
  
  -- Metadata
  ai_model text,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription management
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Subscription details
  tier subscription_tier NOT NULL,
  status text DEFAULT 'active', -- active, canceled, expired, suspended
  
  -- Billing periods
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  
  -- Payment integration
  stripe_subscription_id text,
  razorpay_subscription_id text,
  payment_method_id text,
  
  -- Pricing
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'INR',
  billing_cycle text DEFAULT 'monthly', -- monthly, yearly
  
  -- Trial and discounts
  trial_start timestamptz,
  trial_end timestamptz,
  discount_code text,
  discount_amount numeric(10,2),
  
  -- Cancellation
  canceled_at timestamptz,
  cancellation_reason text,
  cancel_at_period_end boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id),
  
  -- Transaction details
  transaction_type text NOT NULL, -- subscription, consultation, marketplace
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'INR',
  
  -- Payment provider details
  provider text NOT NULL, -- stripe, razorpay
  provider_transaction_id text NOT NULL,
  provider_payment_method text,
  
  -- Status
  status text DEFAULT 'pending', -- pending, completed, failed, refunded
  failure_reason text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  processed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- System configuration
CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  config_type text DEFAULT 'general', -- general, feature_flag, pricing, limits
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_family_vault ON documents(family_vault_id) WHERE family_vault_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_text_search ON documents USING gin(to_tsvector('english', name || ' ' || COALESCE(extracted_text, '') || ' ' || COALESCE(ai_summary, '')));

CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON reminders(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(reminder_date) WHERE is_completed = false;

CREATE INDEX IF NOT EXISTS idx_family_members_vault ON family_members(vault_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics_data(user_id, date_recorded);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_data(metric_type, date_recorded);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    id IN (
      SELECT document_id FROM document_shares 
      WHERE shared_with_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
    )
    OR
    family_vault_id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    family_vault_id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
      AND (permissions->>'can_edit')::boolean = true
    )
  );

CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    family_vault_id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
      AND (permissions->>'can_delete')::boolean = true
    )
  );

-- RLS Policies for document embeddings
CREATE POLICY "Users can access embeddings for their documents" ON document_embeddings
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- RLS Policies for chat
CREATE POLICY "Users can manage own conversations" ON chat_conversations
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS Policies for reminders
CREATE POLICY "Users can manage own reminders" ON reminders
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    family_vault_id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
    )
  );

-- RLS Policies for family vaults
CREATE POLICY "Vault owners can manage their vaults" ON family_vaults
  FOR ALL USING (owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Family members can view their vaults" ON family_vaults
  FOR SELECT USING (
    id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
    )
  );

-- RLS Policies for family members
CREATE POLICY "Family members can view their memberships" ON family_members
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    vault_id IN (
      SELECT id FROM family_vaults 
      WHERE owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Vault owners and admins can manage members" ON family_members
  FOR ALL USING (
    vault_id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for professionals
CREATE POLICY "Professionals can manage own profile" ON professionals
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Anyone can view verified professionals" ON professionals
  FOR SELECT USING (verification_status = 'verified' AND is_available = true);

-- RLS Policies for analytics
CREATE POLICY "Users can view own analytics" ON analytics_data
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can insert analytics" ON analytics_data
  FOR INSERT WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS Policies for audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS Policies for AI insights
CREATE POLICY "Users can view own insights" ON ai_insights
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_vaults_updated_at BEFORE UPDATE ON family_vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_user_id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION search_documents_by_similarity(
  query_embedding vector(1536),
  user_id uuid,
  similarity_threshold float DEFAULT 0.7,
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  category document_category,
  ai_summary text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.category,
    d.ai_summary,
    1 - (de.embedding <=> query_embedding) as similarity
  FROM documents d
  JOIN document_embeddings de ON d.id = de.document_id
  WHERE d.user_id = search_documents_by_similarity.user_id
    AND 1 - (de.embedding <=> query_embedding) > similarity_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid uuid)
RETURNS TABLE (
  total_size bigint,
  document_count bigint,
  by_category jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(d.file_size), 0) as total_size,
    COUNT(d.id) as document_count,
    jsonb_object_agg(
      COALESCE(d.category::text, 'uncategorized'), 
      json_build_object(
        'count', COUNT(*),
        'size', COALESCE(SUM(d.file_size), 0)
      )
    ) as by_category
  FROM documents d
  WHERE d.user_id = user_uuid
    AND d.status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate AI insights
CREATE OR REPLACE FUNCTION generate_ai_insights_for_user(user_uuid uuid)
RETURNS void AS $$
DECLARE
  doc_count integer;
  storage_usage bigint;
  missing_categories text[];
  expiring_docs integer;
BEGIN
  -- Get document statistics
  SELECT COUNT(*), COALESCE(SUM(file_size), 0)
  INTO doc_count, storage_usage
  FROM documents 
  WHERE user_id = user_uuid AND status = 'completed';

  -- Check for missing important document categories
  SELECT ARRAY(
    SELECT unnest(ARRAY['Identity', 'Financial', 'Insurance', 'Medical'])
    EXCEPT
    SELECT DISTINCT category::text
    FROM documents 
    WHERE user_id = user_uuid AND category IS NOT NULL
  ) INTO missing_categories;

  -- Insert insights for missing categories
  IF array_length(missing_categories, 1) > 0 THEN
    INSERT INTO ai_insights (
      user_id, insight_type, title, description, priority,
      recommended_actions, related_categories
    ) VALUES (
      user_uuid,
      'compliance',
      'Missing Important Document Categories',
      format('Consider uploading %s documents for complete protection and compliance.', array_to_string(missing_categories, ', ')),
      'medium',
      jsonb_build_array('Upload missing documents', 'Set up document reminders', 'Enable auto-categorization'),
      missing_categories
    );
  END IF;

  -- Storage optimization insight
  IF storage_usage > 0 THEN
    INSERT INTO ai_insights (
      user_id, insight_type, title, description, priority,
      potential_savings, recommended_actions
    ) VALUES (
      user_uuid,
      'optimization',
      'Storage Usage Analysis',
      format('You are using %s of storage across %s documents. AI found optimization opportunities.', 
        pg_size_pretty(storage_usage), doc_count),
      'low',
      storage_usage * 0.2, -- Potential 20% savings
      jsonb_build_array('Compress large files', 'Archive old documents', 'Remove duplicates')
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
  ('subscription_tiers', '{
    "free": {"storage_gb": 1, "ai_queries": 50, "family_members": 0, "price": 0},
    "premium": {"storage_gb": 50, "ai_queries": 500, "family_members": 0, "price": 149},
    "family_plus": {"storage_gb": 200, "ai_queries": 1000, "family_members": 5, "price": 249},
    "business": {"storage_gb": 1000, "ai_queries": 5000, "family_members": 20, "price": 999}
  }', 'pricing', 'Subscription tier configurations'),
  
  ('ai_models', '{
    "chat": {"primary": "gpt-4", "fallback": "gpt-3.5-turbo"},
    "summarization": {"primary": "gpt-4", "fallback": "claude-3-sonnet"},
    "categorization": {"primary": "gpt-3.5-turbo", "fallback": "huggingface"},
    "ocr": {"primary": "google_vision", "fallback": "tesseract"}
  }', 'feature_flag', 'AI model configurations'),
  
  ('supported_languages', '[
    "en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur", "sa", "ne"
  ]', 'general', 'Supported languages for translation and OCR'),
  
  ('file_upload_limits', '{
    "max_file_size_mb": 50,
    "allowed_types": ["pdf", "jpg", "jpeg", "png", "doc", "docx", "txt"],
    "max_files_per_batch": 20,
    "max_daily_uploads": {"free": 10, "premium": 100, "family_plus": 200, "business": 1000}
  }', 'limits', 'File upload restrictions and limits')
ON CONFLICT (config_key) DO NOTHING;