/*
  # DocuVault AI - Core Database Schema

  1. New Tables
    - `profiles` - Extended user profiles with subscription tiers
    - `documents` - Core document storage with metadata
    - `document_tags` - Flexible tagging system
    - `document_relationships` - Document connections and relationships
    - `chat_conversations` - AI chat conversation management
    - `chat_messages` - Individual chat messages with context
    - `reminders` - Smart reminders and notifications
    - `ai_insights` - AI-generated insights and recommendations
    - `family_vaults` - Family sharing and collaboration
    - `family_members` - Family vault membership management
    - `document_shares` - Document sharing and permissions
    - `professional_services` - Marketplace for verified professionals
    - `user_activity` - Audit trail and analytics
    - `categories` - Custom document categories
    - `smart_tags` - AI-generated smart tags

  2. Security
    - Enable RLS on all tables
    - User-specific access policies
    - Family vault access controls
    - Professional service verification

  3. Features
    - Multi-language support
    - Version control for documents
    - Real-time collaboration
    - AI-powered insights
    - Subscription tier management
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'family_plus', 'business');
CREATE TYPE document_category AS ENUM ('Identity', 'Financial', 'Insurance', 'Medical', 'Legal', 'Personal', 'Business', 'Tax', 'Personal');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE family_role AS ENUM ('owner', 'admin', 'member', 'viewer', 'emergency');
CREATE TYPE family_status AS ENUM ('active', 'pending', 'suspended');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,
  language_preference text DEFAULT 'en',
  tier subscription_tier DEFAULT 'free',
  total_storage_used bigint DEFAULT 0,
  monthly_uploads integer DEFAULT 0,
  ai_queries_used integer DEFAULT 0,
  ai_queries_limit integer DEFAULT 50,
  dark_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  size bigint NOT NULL,
  file_type text,
  category document_category,
  storage_path text,
  thumbnail_url text,
  extracted_text text,
  ai_summary text,
  ai_confidence numeric(5,2),
  language_detected text,
  pages integer,
  is_encrypted boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  version integer DEFAULT 1,
  parent_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  upload_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document tags for flexible categorization
CREATE TABLE IF NOT EXISTS document_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  is_ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Document relationships for AI-powered connections
CREATE TABLE IF NOT EXISTS document_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id_1 uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  document_id_2 uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  relationship_type text NOT NULL, -- 'related', 'duplicate', 'version', 'reference'
  confidence_score numeric(5,2),
  embedding vector(1536), -- For AI similarity matching
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id_1, document_id_2, relationship_type)
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages with document context
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_user_message boolean DEFAULT true,
  related_document_ids uuid[],
  message_metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Smart reminders and notifications
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  reminder_date timestamptz NOT NULL,
  category document_category,
  urgency urgency_level DEFAULT 'medium',
  amount text,
  related_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  is_completed boolean DEFAULT false,
  is_auto_generated boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL, -- 'risk', 'opportunity', 'duplicate', 'missing', 'trend'
  title text NOT NULL,
  description text,
  related_document_ids uuid[],
  priority urgency_level DEFAULT 'medium',
  amount text,
  savings_potential text,
  action_required text,
  is_acknowledged boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Family vaults for sharing
CREATE TABLE IF NOT EXISTS family_vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  storage_limit bigint DEFAULT 5368709120, -- 5GB in bytes
  storage_used bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Family vault members
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid REFERENCES family_vaults(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  role family_role DEFAULT 'member',
  status family_status DEFAULT 'pending',
  permissions jsonb DEFAULT '{}',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document sharing
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  shared_with_email text,
  permission_level text DEFAULT 'view', -- 'view', 'edit', 'admin'
  share_token text UNIQUE,
  is_public boolean DEFAULT false,
  expires_at timestamptz,
  access_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Professional services marketplace
CREATE TABLE IF NOT EXISTS professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL, -- 'doctor', 'lawyer', 'ca', 'consultant'
  description text,
  provider_name text,
  price_amount numeric(10,2),
  price_currency text DEFAULT 'INR',
  original_price numeric(10,2),
  savings_text text,
  duration text,
  rating numeric(3,2),
  review_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User activity for analytics and audit
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL, -- 'upload', 'view', 'share', 'chat', 'reminder'
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Custom categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  document_count integer DEFAULT 0,
  auto_rules jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Smart tags for AI-powered organization
CREATE TABLE IF NOT EXISTS smart_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text,
  ai_query text,
  document_count integer DEFAULT 0,
  is_system_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id_date ON reminders(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_vault_id ON family_members(vault_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_documents_text_search ON documents USING gin(to_tsvector('english', name || ' ' || COALESCE(extracted_text, '') || ' ' || COALESCE(ai_summary, '')));

-- Vector similarity index for document relationships
CREATE INDEX IF NOT EXISTS idx_document_relationships_embedding ON document_relationships USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Documents: Users can access their own documents + family shared documents
CREATE POLICY "Users can read own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM document_shares ds
      WHERE ds.document_id = documents.id
      AND (ds.shared_with_user_id = auth.uid() OR ds.is_public = true)
      AND (ds.expires_at IS NULL OR ds.expires_at > now())
    )
  );

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Document tags: Users can manage tags for accessible documents
CREATE POLICY "Users can read document tags"
  ON document_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_tags.document_id
      AND (d.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM document_shares ds
        WHERE ds.document_id = d.id
        AND ds.shared_with_user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can insert document tags"
  ON document_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_tags.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Chat conversations: Users can only access their own conversations
CREATE POLICY "Users can read own conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Chat messages: Users can access messages in their conversations
CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Reminders: Users can only access their own reminders
CREATE POLICY "Users can read own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI insights: Users can only access their own insights
CREATE POLICY "Users can read own insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON ai_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Family vaults: Users can access vaults they own or are members of
CREATE POLICY "Users can read accessible family vaults"
  ON family_vaults FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.vault_id = family_vaults.id
      AND fm.user_id = auth.uid()
      AND fm.status = 'active'
    )
  );

CREATE POLICY "Users can insert own family vaults"
  ON family_vaults FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Family members: Users can access family vault memberships
CREATE POLICY "Users can read family memberships"
  ON family_members FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM family_vaults fv
      WHERE fv.id = family_members.vault_id
      AND fv.owner_id = auth.uid()
    )
  );

-- Document shares: Users can access shares they created or received
CREATE POLICY "Users can read document shares"
  ON document_shares FOR SELECT
  TO authenticated
  USING (
    auth.uid() = shared_by OR
    auth.uid() = shared_with_user_id OR
    is_public = true
  );

-- User activity: Users can only read their own activity
CREATE POLICY "Users can read own activity"
  ON user_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON user_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Categories: Users can manage their own categories
CREATE POLICY "Users can read own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Smart tags: Users can manage their own smart tags
CREATE POLICY "Users can read own smart tags"
  ON smart_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own smart tags"
  ON smart_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smart tags"
  ON smart_tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Professional services: Public read access
CREATE POLICY "Anyone can read active professional services"
  ON professional_services FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update document counts
CREATE OR REPLACE FUNCTION update_document_counts()
RETURNS trigger AS $$
BEGIN
  -- Update category document count
  IF TG_OP = 'INSERT' THEN
    UPDATE categories 
    SET document_count = document_count + 1
    WHERE user_id = NEW.user_id AND name = NEW.category::text;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories 
    SET document_count = GREATEST(document_count - 1, 0)
    WHERE user_id = OLD.user_id AND name = OLD.category::text;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for document count updates
CREATE TRIGGER update_document_counts_trigger
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_document_counts();

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET total_storage_used = total_storage_used + NEW.size
    WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET total_storage_used = GREATEST(total_storage_used - OLD.size, 0)
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for storage usage updates
CREATE TRIGGER update_storage_usage_trigger
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_storage_usage();