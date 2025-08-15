-- Fix documents table schema by adding missing columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS path TEXT;

-- Update documents table columns to match the upload hook expectations
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_tags TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shared_with_family BOOLEAN DEFAULT false;