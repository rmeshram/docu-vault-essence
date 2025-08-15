-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create storage policies for document uploads
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for key tables
ALTER TABLE documents REPLICA IDENTITY FULL;
ALTER TABLE categories REPLICA IDENTITY FULL;
ALTER TABLE ai_insights REPLICA IDENTITY FULL;
ALTER TABLE reminders REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Create function to auto-categorize documents
CREATE OR REPLACE FUNCTION auto_categorize_document()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto assign category based on file type and name patterns
  IF NEW.category IS NULL THEN
    -- Insurance documents
    IF NEW.name ILIKE '%insurance%' OR NEW.name ILIKE '%policy%' OR NEW.name ILIKE '%claim%' THEN
      NEW.category = 'Insurance';
    -- Financial documents  
    ELSIF NEW.name ILIKE '%bank%' OR NEW.name ILIKE '%statement%' OR NEW.name ILIKE '%invoice%' OR NEW.name ILIKE '%receipt%' THEN
      NEW.category = 'Financial';
    -- Medical documents
    ELSIF NEW.name ILIKE '%medical%' OR NEW.name ILIKE '%health%' OR NEW.name ILIKE '%prescription%' OR NEW.name ILIKE '%lab%' THEN
      NEW.category = 'Medical';
    -- Legal documents
    ELSIF NEW.name ILIKE '%contract%' OR NEW.name ILIKE '%agreement%' OR NEW.name ILIKE '%legal%' OR NEW.name ILIKE '%will%' THEN
      NEW.category = 'Legal';
    -- Identity documents
    ELSIF NEW.name ILIKE '%id%' OR NEW.name ILIKE '%passport%' OR NEW.name ILIKE '%license%' OR NEW.name ILIKE '%certificate%' THEN
      NEW.category = 'Identity';
    -- Default to Personal
    ELSE
      NEW.category = 'Personal';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-categorization
CREATE TRIGGER auto_categorize_trigger
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION auto_categorize_document();

-- Create function to update category document counts
CREATE OR REPLACE FUNCTION update_category_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update category counts in categories table
  IF TG_OP = 'INSERT' THEN
    INSERT INTO categories (user_id, name, document_count, created_at, updated_at)
    VALUES (NEW.user_id, NEW.category::text, 1, NOW(), NOW())
    ON CONFLICT (user_id, name) 
    DO UPDATE SET 
      document_count = categories.document_count + 1,
      updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories 
    SET document_count = GREATEST(0, document_count - 1),
        updated_at = NOW()
    WHERE user_id = OLD.user_id AND name = OLD.category::text;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle category change
    IF OLD.category != NEW.category THEN
      -- Decrease old category count
      UPDATE categories 
      SET document_count = GREATEST(0, document_count - 1),
          updated_at = NOW()
      WHERE user_id = OLD.user_id AND name = OLD.category::text;
      
      -- Increase new category count
      INSERT INTO categories (user_id, name, document_count, created_at, updated_at)
      VALUES (NEW.user_id, NEW.category::text, 1, NOW(), NOW())
      ON CONFLICT (user_id, name) 
      DO UPDATE SET 
        document_count = categories.document_count + 1,
        updated_at = NOW();
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category count updates
CREATE TRIGGER update_category_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_category_counts();