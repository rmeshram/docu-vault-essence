-- DocuVault AI - Complete Database Schema
-- Creates comprehensive database structure for document management with AI features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data consistency
CREATE TYPE public.document_category AS ENUM (
  'Identity', 'Financial', 'Insurance', 'Medical', 'Legal', 'Personal', 'Business', 'Tax'
);

CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high');

CREATE TYPE public.family_role AS ENUM ('owner', 'admin', 'member', 'viewer', 'emergency');

CREATE TYPE public.family_status AS ENUM ('active', 'pending', 'suspended');

-- User Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  language_preference TEXT DEFAULT 'English',
  tier TEXT DEFAULT 'Free',
  total_storage_used BIGINT DEFAULT 0,
  monthly_uploads INTEGER DEFAULT 0,
  ai_queries_used INTEGER DEFAULT 0,
  ai_queries_limit INTEGER DEFAULT 50,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Documents Table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  file_type TEXT,
  category public.document_category,
  storage_path TEXT,
  thumbnail_url TEXT,
  extracted_text TEXT,
  ai_summary TEXT,
  ai_confidence NUMERIC(5,2),
  language_detected TEXT,
  pages INTEGER,
  is_encrypted BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES public.documents(id),
  upload_method TEXT DEFAULT 'file',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Document Tags Table
CREATE TABLE public.document_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

-- Categories Table (user-defined categories)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  auto_rules JSONB, -- Rules for auto-categorization
  document_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Smart Tags Table
CREATE TABLE public.smart_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ai_query TEXT, -- AI query that defines this tag
  document_count INTEGER DEFAULT 0,
  color TEXT DEFAULT '#7C3AED',
  is_system_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.smart_tags ENABLE ROW LEVEL SECURITY;

-- AI Insights Table
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'risk', 'opportunity', 'duplicate', 'family', etc.
  title TEXT NOT NULL,
  description TEXT,
  related_document_ids UUID[], -- Array of document IDs
  priority public.urgency_level DEFAULT 'medium',
  amount TEXT, -- For financial insights
  savings_potential TEXT,
  action_required TEXT,
  is_acknowledged BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Reminders Table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category public.document_category,
  urgency public.urgency_level DEFAULT 'medium',
  amount TEXT,
  related_document_id UUID REFERENCES public.documents(id),
  is_completed BOOLEAN DEFAULT false,
  is_auto_generated BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Chat Conversations Table
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Chat Messages Table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_user_message BOOLEAN DEFAULT true,
  related_document_ids UUID[], -- Documents referenced in response
  message_metadata JSONB, -- Additional data like attachments, charts, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Family Vaults Table
CREATE TABLE public.family_vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_limit BIGINT DEFAULT 53687091200, -- 50GB in bytes
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.family_vaults ENABLE ROW LEVEL SECURITY;

-- Family Members Table
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES public.family_vaults(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- For pending invites
  role public.family_role DEFAULT 'member',
  status public.family_status DEFAULT 'pending',
  permissions JSONB DEFAULT '{"can_view": true, "can_upload": false, "can_edit": false, "can_delete": false}',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Document Shares Table (for sharing documents with family/external)
CREATE TABLE public.document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  permission_level TEXT DEFAULT 'view', -- 'view', 'edit', 'download'
  expires_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE, -- For public sharing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- Professional Services Table
CREATE TABLE public.professional_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price_amount NUMERIC(10,2),
  price_currency TEXT DEFAULT 'INR',
  original_price NUMERIC(10,2),
  rating NUMERIC(3,2),
  review_count INTEGER DEFAULT 0,
  duration TEXT,
  savings_text TEXT,
  provider_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

-- User Activity Log
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'upload', 'ai_query', 'share', 'view', etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX idx_document_tags_document_id ON public.document_tags(document_id);
CREATE INDEX idx_document_tags_tag ON public.document_tags(tag);
CREATE INDEX idx_reminders_user_id_date ON public.reminders(user_id, reminder_date);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_ai_insights_user_priority ON public.ai_insights(user_id, priority, created_at DESC);

-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Document tags policies
CREATE POLICY "Users can manage tags for their documents" ON public.document_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_tags.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Categories policies
CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Smart tags policies
CREATE POLICY "Users can manage their own smart tags" ON public.smart_tags
  FOR ALL USING (auth.uid() = user_id);

-- AI insights policies
CREATE POLICY "Users can view their own insights" ON public.ai_insights
  FOR ALL USING (auth.uid() = user_id);

-- Reminders policies
CREATE POLICY "Users can manage their own reminders" ON public.reminders
  FOR ALL USING (auth.uid() = user_id);

-- Chat conversations policies
CREATE POLICY "Users can manage their own conversations" ON public.chat_conversations
  FOR ALL USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can manage their own chat messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- Family vaults policies
CREATE POLICY "Vault owners can manage their vaults" ON public.family_vaults
  FOR ALL USING (auth.uid() = owner_id);

-- Family members policies
CREATE POLICY "Family members can view their memberships" ON public.family_members
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.family_vaults 
      WHERE family_vaults.id = family_members.vault_id 
      AND family_vaults.owner_id = auth.uid()
    )
  );

-- Document shares policies
CREATE POLICY "Users can manage their document shares" ON public.document_shares
  FOR ALL USING (
    auth.uid() = shared_by OR 
    auth.uid() = shared_with_user_id OR
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_shares.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Professional services (public read)
CREATE POLICY "Anyone can view professional services" ON public.professional_services
  FOR SELECT USING (is_active = true);

-- User activity policies
CREATE POLICY "Users can view their own activity" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert user activity" ON public.user_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smart_tags_updated_at
  BEFORE UPDATE ON public.smart_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_vaults_updated_at
  BEFORE UPDATE ON public.family_vaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members;

-- Set replica identity for real-time updates
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.reminders REPLICA IDENTITY FULL;
ALTER TABLE public.ai_insights REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;

-- Insert sample professional services
INSERT INTO public.professional_services (name, description, category, price_amount, original_price, rating, review_count, duration, savings_text, provider_name) VALUES
('Tax Consultation', 'Get your documents reviewed by certified CAs', 'Financial', 2499, 4999, 4.8, 1247, '60 min video call', 'Save ₹50,000+ in taxes', 'TaxPro CA Services'),
('Legal Document Review', 'Property, contracts, and legal papers verified', 'Legal', 3999, 7999, 4.9, 892, '90 min consultation', 'Avoid costly mistakes', 'LegalShield India'),
('Insurance Optimization', 'Compare and optimize your insurance portfolio', 'Insurance', 1999, 3999, 4.7, 2156, '45 min analysis', 'Save ₹25,000+ annually', 'InsureWise Advisors');