-- First, let's check the current documents table structure and fix the schema properly
-- Drop the old enum if it exists
DROP TYPE IF EXISTS document_category CASCADE;

-- Create the correct enum with values that match our data
CREATE TYPE document_category AS ENUM (
  'Financial', 'Medical', 'Legal', 'Insurance', 'Education', 'Personal', 'Identity', 'Property'
);

-- Update documents table structure - let's be safe and check existing structure first
-- Add category column if it doesn't exist, using the user-defined type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'category') THEN
        ALTER TABLE documents ADD COLUMN category document_category;
    END IF;
END $$;

-- Fix categories table to use consistent naming
UPDATE categories SET name = 'Financial' WHERE name LIKE '%Financial%';
UPDATE categories SET name = 'Medical' WHERE name LIKE '%Medical%';
UPDATE categories SET name = 'Legal' WHERE name LIKE '%Legal%';
UPDATE categories SET name = 'Insurance' WHERE name LIKE '%Insurance%';
UPDATE categories SET name = 'Personal' WHERE name LIKE '%Personal%';
UPDATE categories SET name = 'Property' WHERE name LIKE '%Property%';
UPDATE categories SET name = 'Education' WHERE name LIKE '%Education%';
UPDATE categories SET name = 'Identity' WHERE name LIKE '%Identity%';

-- Add missing columns to documents if they don't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_url TEXT;

-- Create comments table for document commenting feature
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on comments table
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comments (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view comments on their documents" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments on their documents" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Users can view comments on their documents" ON public.comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = comments.document_id 
    AND documents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments on their documents" ON public.comments
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = comments.document_id 
    AND documents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own comments" ON public.comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
FOR DELETE USING (auth.uid() = user_id);

-- Create notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Create emergency_access table
CREATE TABLE IF NOT EXISTS public.emergency_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trusted_contact_email TEXT NOT NULL,
  access_duration_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  access_token TEXT UNIQUE
);

-- Enable RLS on emergency_access table
ALTER TABLE public.emergency_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for emergency_access (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage their emergency access" ON public.emergency_access;

CREATE POLICY "Users can manage their emergency access" ON public.emergency_access
FOR ALL USING (auth.uid() = user_id);

-- Create document_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  change_description TEXT
);

-- Enable RLS on document_versions table
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_versions (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view versions of their documents" ON public.document_versions;
DROP POLICY IF EXISTS "Users can create versions of their documents" ON public.document_versions;

CREATE POLICY "Users can view versions of their documents" ON public.document_versions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_versions.document_id 
    AND documents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions of their documents" ON public.document_versions
FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_versions.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Add indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_comments_document_id ON comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_emergency_access_user_id ON emergency_access(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_access_token ON emergency_access(access_token);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON document_versions(created_by);