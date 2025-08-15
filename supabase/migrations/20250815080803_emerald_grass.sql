/*
  # DocuVault AI - Core Database Schema

  1. Core Tables
    - `users` - Extended user profiles with subscription and preferences
    - `documents` - Document metadata with AI analysis results
    - `document_embeddings` - Vector embeddings for semantic search
    - `document_relationships` - Document connections and relationships
    - `document_versions` - Version control and history tracking
    - `chat_conversations` - AI chat conversation management
    - `chat_messages` - Individual chat messages with context
    - `reminders` - Smart reminders and notifications
    - `family_vaults` - Family document sharing vaults
    - `family_members` - Family vault membership and permissions
    - `document_shares` - Document sharing and access control
    - `ai_insights` - AI-generated insights and recommendations
    - `user_subscriptions` - Subscription management and billing
    - `professional_services` - Marketplace for verified professionals
    - `audit_logs` - Security and compliance audit trail
    - `analytics_data` - User analytics and usage metrics
    - `notification_preferences` - User notification settings

  2. Security
    - Enable RLS on all tables
    - Comprehensive access control policies
    - Audit logging for compliance
    - Data encryption and privacy controls

  3. Performance
    - Optimized indexes for common queries
    - Vector search capabilities
    - Real-time subscriptions
    - Efficient data relationships
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE document_category AS ENUM (
  'Identity', 'Financial', 'Insurance', 'Medical', 'Legal', 
  'Personal', 'Business', 'Tax', 'Education', 'Personal'
);

CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE family_role AS ENUM ('owner', 'admin', 'member', 'viewer', 'emergency');
CREATE TYPE family_status AS ENUM ('active', 'pending', 'suspended');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'family_plus', 'business');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  display_name text,
  phone text,
  avatar_url text,
  language_preference text DEFAULT 'English',
  subscription_tier subscription_tier DEFAULT 'free',
  storage_used bigint DEFAULT 0,
  storage_limit bigint DEFAULT 1073741824, -- 1GB for free tier
  ai_queries_used integer DEFAULT 0,
  ai_queries_limit integer DEFAULT 50,
  monthly_uploads integer DEFAULT 0,
  biometric_enabled boolean DEFAULT false,
  mfa_enabled boolean DEFAULT false,
  dark_mode boolean DEFAULT false,
  emergency_contacts jsonb DEFAULT '[]',
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Family vaults for document sharing
CREATE TABLE IF NOT EXISTS family_vaults (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_limit integer DEFAULT 5,
  storage_limit bigint DEFAULT 53687091200, -- 50GB default
  storage_used bigint DEFAULT 0,
  emergency_access_enabled boolean DEFAULT true,
  vault_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Family vault members
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id uuid NOT NULL REFERENCES family_vaults(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text,
  role family_role DEFAULT 'member',
  status family_status DEFAULT 'pending',
  permissions jsonb DEFAULT '{"can_edit": false, "can_view": true, "can_delete": false, "can_upload": false, "can_share": false, "can_invite": false}',
  invitation_token text UNIQUE,
  invitation_expires_at timestamptz,
  invited_by uuid REFERENCES users(id),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents table with comprehensive metadata
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_vault_id uuid REFERENCES family_vaults(id) ON DELETE SET NULL,
  name text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text,
  mime_type text,
  category document_category,
  thumbnail_url text,
  extracted_text text,
  ai_summary text,
  ai_confidence numeric(5,2),
  language_detected text,
  pages integer,
  is_encrypted boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  version_number integer DEFAULT 1,
  parent_document_id uuid REFERENCES documents(id),
  upload_method text DEFAULT 'manual',
  upload_source text DEFAULT 'web',
  processing_status processing_status DEFAULT 'pending',
  processing_error text,
  ai_tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document embeddings for vector search
CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI ada-002 dimension
  content_hash text NOT NULL,
  model_version text DEFAULT 'text-embedding-ada-002',
  created_at timestamptz DEFAULT now()
);

-- Document relationships and connections
CREATE TABLE IF NOT EXISTS document_relationships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id_1 uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_id_2 uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relationship_type text NOT NULL, -- 'duplicate', 'version', 'related', 'parent-child'
  confidence_score numeric(5,2),
  ai_detected boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id_1, document_id_2, relationship_type)
);

-- Document versions for version control
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  changes_summary text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Document tags for organization
CREATE TABLE IF NOT EXISTS document_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag text NOT NULL,
  is_ai_generated boolean DEFAULT false,
  confidence_score numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text DEFAULT 'New Conversation',
  conversation_type text DEFAULT 'general', -- 'general', 'document_analysis', 'tax_help'
  language text DEFAULT 'en',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages with AI context
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_user_message boolean DEFAULT true,
  language text DEFAULT 'en',
  confidence_score numeric(5,2),
  related_document_ids uuid[] DEFAULT '{}',
  ai_model text,
  processing_time_ms integer,
  tokens_used integer,
  message_type text DEFAULT 'text', -- 'text', 'voice', 'image'
  message_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Smart reminders and notifications
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  reminder_date timestamptz NOT NULL,
  category document_category,
  urgency urgency_level DEFAULT 'medium',
  amount text,
  action_url text,
  is_completed boolean DEFAULT false,
  is_auto_generated boolean DEFAULT false,
  notification_sent boolean DEFAULT false,
  completed_at timestamptz,
  snooze_until timestamptz,
  recurrence_rule text, -- RRULE format for recurring reminders
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document sharing and access control
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  shared_with_email text,
  permission_level text DEFAULT 'view', -- 'view', 'edit', 'download'
  expires_at timestamptz,
  access_count integer DEFAULT 0,
  is_public boolean DEFAULT false,
  share_token text UNIQUE,
  password_protected boolean DEFAULT false,
  password_hash text,
  download_enabled boolean DEFAULT true,
  watermark_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type text NOT NULL, -- 'risk', 'opportunity', 'duplicate', 'missing', 'expiry'
  title text NOT NULL,
  description text,
  related_document_ids uuid[] DEFAULT '{}',
  priority urgency_level DEFAULT 'medium',
  amount text,
  savings_potential text,
  action_required text,
  action_url text,
  is_acknowledged boolean DEFAULT false,
  expires_at timestamptz,
  confidence_score numeric(5,2),
  ai_model text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User subscriptions and billing
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  status text DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'unpaid'
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  stripe_subscription_id text UNIQUE,
  razorpay_subscription_id text UNIQUE,
  payment_method jsonb,
  billing_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Professional services marketplace
CREATE TABLE IF NOT EXISTS professional_services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type text NOT NULL, -- 'tax_consultation', 'legal_review', 'medical_analysis'
  title text NOT NULL,
  description text,
  category text,
  price_amount numeric(10,2),
  price_currency text DEFAULT 'INR',
  duration_minutes integer,
  is_active boolean DEFAULT true,
  verification_status text DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verification_documents jsonb DEFAULT '{}',
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  availability_schedule jsonb DEFAULT '{}',
  service_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Professional service bookings
CREATE TABLE IF NOT EXISTS service_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id uuid NOT NULL REFERENCES professional_services(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  status text DEFAULT 'scheduled', -- 'scheduled', 'completed', 'canceled', 'no_show'
  meeting_url text,
  notes text,
  documents_shared uuid[] DEFAULT '{}',
  payment_amount numeric(10,2),
  payment_status text DEFAULT 'pending',
  rating integer,
  review text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User activity and audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip_address inet,
  user_agent text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Analytics and metrics
CREATE TABLE IF NOT EXISTS analytics_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  metric_category text NOT NULL,
  metric_value numeric NOT NULL,
  metric_data jsonb DEFAULT '{}',
  time_period text NOT NULL, -- 'daily', 'weekly', 'monthly'
  date_recorded date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  reminder_notifications boolean DEFAULT true,
  family_notifications boolean DEFAULT true,
  marketing_notifications boolean DEFAULT false,
  notification_schedule jsonb DEFAULT '{"start_hour": 9, "end_hour": 21, "timezone": "Asia/Kolkata"}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_family_vault ON documents(family_vault_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);

CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON reminders(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(reminder_date) WHERE NOT is_completed;

CREATE INDEX IF NOT EXISTS idx_family_members_vault ON family_members(vault_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);

CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_document ON document_shares(document_id);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_priority ON ai_insights(user_id, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_unacknowledged ON ai_insights(user_id) WHERE NOT is_acknowledged;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics_data(user_id, date_recorded DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_documents_text_search ON documents USING gin(to_tsvector('english', name || ' ' || COALESCE(ai_summary, '') || ' ' || COALESCE(extracted_text, '')));

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- RLS Policies for Documents
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = documents.user_id
    )
    OR 
    -- Family vault access
    family_vault_id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = documents.user_id
    )
    OR
    -- Family vault edit permission
    (family_vault_id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
      AND (permissions->>'can_edit')::boolean = true
    ))
  );

CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = documents.user_id
    )
    OR
    -- Family vault delete permission
    (family_vault_id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
      AND (permissions->>'can_delete')::boolean = true
    ))
  );

-- RLS Policies for Family Vaults
CREATE POLICY "Vault owners can manage their vaults" ON family_vaults
  FOR ALL USING (
    owner_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Family members can view their vaults" ON family_vaults
  FOR SELECT USING (
    id IN (
      SELECT vault_id FROM family_members 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      AND status = 'active'
    )
  );

-- RLS Policies for Family Members
CREATE POLICY "Family members can view their memberships" ON family_members
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    vault_id IN (
      SELECT id FROM family_vaults 
      WHERE owner_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Vault owners can manage members" ON family_members
  FOR ALL USING (
    vault_id IN (
      SELECT id FROM family_vaults 
      WHERE owner_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- RLS Policies for Chat
CREATE POLICY "Users can manage their own conversations" ON chat_conversations
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage their own chat messages" ON chat_messages
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- RLS Policies for Reminders
CREATE POLICY "Users can manage their own reminders" ON reminders
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- RLS Policies for AI Insights
CREATE POLICY "Users can view their own insights" ON ai_insights
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- RLS Policies for Document Shares
CREATE POLICY "Users can manage their document shares" ON document_shares
  FOR ALL USING (
    shared_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    shared_with_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    document_id IN (
      SELECT id FROM documents 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- RLS Policies for other tables
CREATE POLICY "Users can view own embeddings" ON document_embeddings
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can view own document relationships" ON document_relationships
  FOR SELECT USING (
    document_id_1 IN (
      SELECT id FROM documents 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
    OR
    document_id_2 IN (
      SELECT id FROM documents 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can view own analytics" ON analytics_data
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- Professional services policies
CREATE POLICY "Anyone can view active professional services" ON professional_services
  FOR SELECT USING (is_active = true AND verification_status = 'verified');

CREATE POLICY "Professionals can manage their services" ON professional_services
  FOR ALL USING (
    professional_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can view their bookings" ON service_bookings
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    professional_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

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
CREATE TRIGGER update_family_vaults_updated_at BEFORE UPDATE ON family_vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_shares_updated_at BEFORE UPDATE ON document_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professional_services_updated_at BEFORE UPDATE ON professional_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON service_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_user_id, full_name, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Create default notification preferences
  INSERT INTO notification_preferences (user_id)
  VALUES ((SELECT id FROM users WHERE auth_user_id = NEW.id));
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
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

-- Function to get document insights
CREATE OR REPLACE FUNCTION get_document_insights(doc_id uuid)
RETURNS jsonb AS $$
DECLARE
  doc_record documents%ROWTYPE;
  insights jsonb := '{}';
  related_count integer;
  version_count integer;
BEGIN
  SELECT * INTO doc_record FROM documents WHERE id = doc_id;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Document not found"}';
  END IF;
  
  -- Count related documents
  SELECT COUNT(*) INTO related_count
  FROM document_relationships
  WHERE document_id_1 = doc_id OR document_id_2 = doc_id;
  
  -- Count versions
  SELECT COUNT(*) INTO version_count
  FROM document_versions
  WHERE document_id = doc_id;
  
  insights := jsonb_build_object(
    'document_id', doc_id,
    'category', doc_record.category,
    'ai_confidence', doc_record.ai_confidence,
    'related_documents_count', related_count,
    'version_count', version_count,
    'processing_status', doc_record.processing_status,
    'language_detected', doc_record.language_detected,
    'file_size_mb', ROUND(doc_record.file_size / 1024.0 / 1024.0, 2),
    'created_at', doc_record.created_at
  );
  
  RETURN insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(user_uuid uuid, additional_bytes bigint)
RETURNS boolean AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  SELECT * INTO user_record FROM users WHERE auth_user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN (user_record.storage_used + additional_bytes) <= user_record.storage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage(user_uuid uuid, bytes_delta bigint)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET storage_used = storage_used + bytes_delta,
      updated_at = now()
  WHERE auth_user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS void AS $$
BEGIN
  DELETE FROM document_shares 
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage buckets (run this in Supabase Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('documents', 'documents', false),
--   ('thumbnails', 'thumbnails', false),
--   ('avatars', 'avatars', true);

-- Storage policies (run after creating buckets)
-- CREATE POLICY "Users can upload their own documents" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own documents" ON storage.objects
--   FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update their own documents" ON storage.objects
--   FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own documents" ON storage.objects
--   FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);