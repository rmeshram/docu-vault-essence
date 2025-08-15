-- Fix document_category enum to match the data being used
DROP TYPE IF EXISTS document_category CASCADE;
CREATE TYPE document_category AS ENUM (
  'Financial', 'Medical', 'Legal', 'Insurance', 'Education', 'Personal', 'Identity', 'Property'
);

-- Update documents table to use the new enum
ALTER TABLE documents 
ALTER COLUMN category TYPE document_category 
USING category::text::document_category;

-- Fix categories table to ensure consistency
UPDATE categories SET name = 'Financial' WHERE name = 'Financial Documents';
UPDATE categories SET name = 'Medical' WHERE name = 'Medical Records';
UPDATE categories SET name = 'Legal' WHERE name = 'Legal Documents';
UPDATE categories SET name = 'Insurance' WHERE name = 'Insurance';
UPDATE categories SET name = 'Personal' WHERE name = 'Personal';
UPDATE categories SET name = 'Property' WHERE name = 'Property Documents';

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

-- Create RLS policies for comments
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

-- Create RLS policies for notifications
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

-- Create RLS policies for emergency_access
CREATE POLICY "Users can manage their emergency access" ON public.emergency_access
FOR ALL USING (auth.uid() = user_id);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_document_id ON comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_emergency_access_user_id ON emergency_access(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_access_token ON emergency_access(access_token);

-- Update document_versions table to ensure consistency
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

-- Create RLS policies for document_versions
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

-- Create indexes for document_versions
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON document_versions(created_by);