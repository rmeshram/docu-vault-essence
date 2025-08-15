/*
  # DocuVault AI - Core Database Schema

  1. New Tables
    - `users` - Extended user profiles with subscription tiers
    - `documents` - Core document storage with metadata
    - `document_versions` - Version control for documents
    - `document_relationships` - AI-powered document linking
    - `document_embeddings` - Vector embeddings for AI search
    - `chat_conversations` - AI chat conversations
    - `chat_messages` - Individual chat messages
    - `reminders` - Smart reminders and notifications
    - `family_vaults` - Family sharing and collaboration
    - `family_members` - Family vault membership
    - `professionals` - Verified professional marketplace
    - `professional_services` - Services offered by professionals
    - `user_subscriptions` - Subscription management
    - `analytics_data` - User analytics and insights
    - `audit_logs` - Security and compliance logging

  2. Security
    - Enable RLS on all tables
    - Comprehensive access policies
    - Audit trail for compliance

  3. Extensions
    - Enable vector extension for AI embeddings
    - Enable uuid extension for unique IDs
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'family_plus', 'business');
CREATE TYPE document_category AS ENUM ('Identity', 'Financial', 'Insurance', 'Medical', 'Legal', 'Personal', 'Business', 'Tax', 'Education');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE family_role AS ENUM ('owner', 'admin', 'member', 'viewer', 'emergency');
CREATE TYPE professional_type AS ENUM ('doctor', 'lawyer', 'ca', 'financial_advisor', 'insurance_agent');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  phone text,
  full_name text,
  display_name text,
  avatar_url text,
  language_preference text DEFAULT 'en',
  timezone text DEFAULT 'Asia/Kolkata',
  subscription_tier subscription_tier DEFAULT 'free',
  storage_used bigint DEFAULT 0,
  storage_limit bigint DEFAULT 1073741824, -- 1GB for free tier
  ai_queries_used integer DEFAULT 0,
  ai_queries_limit integer DEFAULT 50,
  mfa_enabled boolean DEFAULT false,
  biometric_enabled boolean DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_vault_id uuid,
  name text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  mime_type text,
  category document_category,
  subcategory text,
  extracted_text text,
  ai_summary text,
  ai_confidence numeric(5,2),
  language_detected text,
  page_count integer,
  thumbnail_url text,
  is_encrypted boolean DEFAULT true,
  encryption_key_id text,
  is_verified boolean DEFAULT false,
  verification_method text,
  version_number integer DEFAULT 1,
  parent_document_id uuid REFERENCES documents(id),
  upload_method text DEFAULT 'manual',
  upload_source text,
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  ai_tags text[] DEFAULT '{}',
  processing_status text DEFAULT 'pending',
  processing_error text,
  last_accessed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document versions for version control
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  changes_description text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Document relationships for AI-powered linking
CREATE TABLE IF NOT EXISTS document_relationships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  target_document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  confidence_score numeric(5,2),
  ai_generated boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_document_id, target_document_id, relationship_type)
);

-- Document embeddings for vector search
CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI embedding dimension
  content_hash text NOT NULL,
  model_version text DEFAULT 'text-embedding-ada-002',
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id)
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text DEFAULT 'New Conversation',
  language text DEFAULT 'en',
  context_document_ids uuid[] DEFAULT '{}',
  conversation_metadata jsonb DEFAULT '{}',
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_user_message boolean DEFAULT true,
  message_type text DEFAULT 'text', -- text, voice, image
  language text DEFAULT 'en',
  confidence_score numeric(5,2),
  related_document_ids uuid[] DEFAULT '{}',
  ai_model text,
  processing_time_ms integer,
  tokens_used integer,
  message_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Smart reminders
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
  currency text DEFAULT 'INR',
  action_url text,
  is_completed boolean DEFAULT false,
  is_auto_generated boolean DEFAULT false,
  auto_generation_rule jsonb,
  notification_sent boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Family vaults for sharing
CREATE TABLE IF NOT EXISTS family_vaults (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_limit bigint DEFAULT 5368709120, -- 5GB default
  storage_used bigint DEFAULT 0,
  member_limit integer DEFAULT 5,
  vault_settings jsonb DEFAULT '{}',
  emergency_access_enabled boolean DEFAULT false,
  emergency_contacts jsonb DEFAULT '[]',
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
  permissions jsonb DEFAULT '{"can_view": true, "can_upload": false, "can_edit": false, "can_delete": false, "can_share": false}',
  invitation_token text,
  invitation_expires_at timestamptz,
  joined_at timestamptz,
  invited_by uuid REFERENCES users(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Professional marketplace
CREATE TABLE IF NOT EXISTS professionals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_type professional_type NOT NULL,
  license_number text,
  verification_status verification_status DEFAULT 'pending',
  verification_documents jsonb DEFAULT '[]',
  profile_data jsonb NOT NULL DEFAULT '{}',
  specializations text[] DEFAULT '{}',
  languages text[] DEFAULT '{"en"}',
  experience_years integer,
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  consultation_fee numeric(10,2),
  currency text DEFAULT 'INR',
  availability_schedule jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Professional services
CREATE TABLE IF NOT EXISTS professional_services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  service_description text,
  service_category text,
  price numeric(10,2),
  currency text DEFAULT 'INR',
  duration_minutes integer,
  is_available boolean DEFAULT true,
  service_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  status text DEFAULT 'active',
  stripe_subscription_id text,
  razorpay_subscription_id text,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  payment_method jsonb,
  billing_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analytics data
CREATE TABLE IF NOT EXISTS analytics_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  metric_category text NOT NULL,
  metric_value numeric,
  metric_data jsonb DEFAULT '{}',
  time_period text, -- daily, weekly, monthly, yearly
  date_recorded date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- AI insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  title text NOT NULL,
  description text,
  related_document_ids uuid[] DEFAULT '{}',
  priority urgency_level DEFAULT 'medium',
  confidence_score numeric(5,2),
  action_items jsonb DEFAULT '[]',
  savings_potential text,
  risk_level text,
  expires_at timestamptz,
  is_acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Document shares for secure sharing
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  shared_with_email text,
  share_token text UNIQUE,
  permission_level text DEFAULT 'view', -- view, edit, download
  expires_at timestamptz,
  access_count integer DEFAULT 0,
  max_access_count integer,
  password_protected boolean DEFAULT false,
  password_hash text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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
  notification_schedule jsonb DEFAULT '{"start_time": "09:00", "end_time": "21:00", "timezone": "Asia/Kolkata"}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_family_vault ON documents(family_vault_id);
CREATE INDEX IF NOT EXISTS idx_documents_text_search ON documents USING gin(to_tsvector('english', name || ' ' || COALESCE(extracted_text, '')));

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON reminders(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date) WHERE NOT is_completed;

CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON analytics_data(user_id, date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = documents.user_id
    )
    OR
    -- Family vault access
    (family_vault_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.vault_id = documents.family_vault_id
      AND u.auth_user_id = auth.uid()
      AND fm.status = 'active'
      AND (fm.permissions->>'can_view')::boolean = true
    ))
  );

CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = documents.user_id
    )
  );

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = documents.user_id
    )
    OR
    -- Family vault edit access
    (family_vault_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.vault_id = documents.family_vault_id
      AND u.auth_user_id = auth.uid()
      AND fm.status = 'active'
      AND (fm.permissions->>'can_edit')::boolean = true
    ))
  );

CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = documents.user_id
    )
    OR
    -- Family vault delete access
    (family_vault_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.vault_id = documents.family_vault_id
      AND u.auth_user_id = auth.uid()
      AND fm.status = 'active'
      AND (fm.permissions->>'can_delete')::boolean = true
    ))
  );

-- RLS Policies for chat
CREATE POLICY "Users can manage own conversations" ON chat_conversations
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = chat_conversations.user_id
    )
  );

CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = chat_messages.user_id
    )
  );

-- RLS Policies for reminders
CREATE POLICY "Users can manage own reminders" ON reminders
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = reminders.user_id
    )
  );

-- RLS Policies for family vaults
CREATE POLICY "Vault owners can manage vaults" ON family_vaults
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = family_vaults.owner_id
    )
  );

CREATE POLICY "Family members can view their memberships" ON family_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = family_members.user_id
    )
    OR
    auth.uid() IN (
      SELECT u.auth_user_id FROM users u
      JOIN family_vaults fv ON fv.owner_id = u.id
      WHERE fv.id = family_members.vault_id
    )
  );

-- RLS Policies for professionals
CREATE POLICY "Professionals can manage own profile" ON professionals
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = professionals.user_id
    )
  );

CREATE POLICY "Anyone can view verified professionals" ON professionals
  FOR SELECT USING (verification_status = 'verified' AND is_active = true);

-- RLS Policies for analytics
CREATE POLICY "Users can view own analytics" ON analytics_data
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = analytics_data.user_id
    )
  );

-- RLS Policies for AI insights
CREATE POLICY "Users can view own insights" ON ai_insights
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = ai_insights.user_id
    )
  );

-- RLS Policies for document shares
CREATE POLICY "Users can manage their document shares" ON document_shares
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = document_shares.shared_by
    )
    OR
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = document_shares.shared_with_user_id
    )
    OR
    -- Document owner can see shares
    EXISTS (
      SELECT 1 FROM documents d
      JOIN users u ON u.id = d.user_id
      WHERE d.id = document_shares.document_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Functions for updated_at triggers
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
CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_shares_updated_at BEFORE UPDATE ON document_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  
  -- Create default notification preferences
  INSERT INTO notification_preferences (user_id)
  SELECT id FROM users WHERE auth_user_id = NEW.id;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users 
    SET storage_used = storage_used + NEW.file_size
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users 
    SET storage_used = storage_used - OLD.file_size
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for storage usage tracking
CREATE TRIGGER update_user_storage_on_document_change
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_storage_usage();

-- Function to auto-generate reminders from document analysis
CREATE OR REPLACE FUNCTION generate_auto_reminders()
RETURNS TRIGGER AS $$
DECLARE
  reminder_data jsonb;
  reminder_date timestamptz;
  reminder_title text;
BEGIN
  -- Only process if AI summary is updated and contains date information
  IF NEW.ai_summary IS NOT NULL AND NEW.ai_summary != OLD.ai_summary THEN
    -- Extract potential dates and create reminders
    -- This is a simplified version - in production, use more sophisticated date extraction
    
    IF NEW.category = 'Insurance' AND NEW.ai_summary ILIKE '%expir%' THEN
      reminder_title := 'Insurance Policy Review: ' || NEW.name;
      reminder_date := now() + interval '30 days'; -- Default reminder
      
      INSERT INTO reminders (
        user_id, document_id, title, description, reminder_date, 
        category, urgency, is_auto_generated, auto_generation_rule
      ) VALUES (
        NEW.user_id, NEW.id, reminder_title,
        'AI detected this insurance document may need attention',
        reminder_date, NEW.category, 'medium', true,
        '{"trigger": "insurance_expiry", "confidence": 0.8}'::jsonb
      );
    END IF;
    
    IF NEW.category = 'Tax' AND NEW.ai_summary ILIKE '%deadline%' THEN
      reminder_title := 'Tax Document Action: ' || NEW.name;
      reminder_date := now() + interval '15 days';
      
      INSERT INTO reminders (
        user_id, document_id, title, description, reminder_date,
        category, urgency, is_auto_generated, auto_generation_rule
      ) VALUES (
        NEW.user_id, NEW.id, reminder_title,
        'AI detected tax-related deadline in this document',
        reminder_date, NEW.category, 'high', true,
        '{"trigger": "tax_deadline", "confidence": 0.9}'::jsonb
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-reminder generation
CREATE TRIGGER auto_generate_reminders_on_ai_analysis
  AFTER UPDATE OF ai_summary ON documents
  FOR EACH ROW EXECUTE FUNCTION generate_auto_reminders();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('documents', 'documents', false),
  ('thumbnails', 'thumbnails', false),
  ('avatars', 'avatars', true),
  ('temp-uploads', 'temp-uploads', false);

-- Storage policies
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatar policies
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Thumbnail policies
CREATE POLICY "Users can view own thumbnails" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Temp upload policies
CREATE POLICY "Users can manage temp uploads" ON storage.objects
  FOR ALL USING (
    bucket_id = 'temp-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );