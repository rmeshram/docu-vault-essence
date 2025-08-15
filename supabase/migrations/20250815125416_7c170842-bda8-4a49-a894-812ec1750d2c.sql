-- Create storage bucket for documents if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage if not exist
DO $$
BEGIN
    -- Policy for viewing own documents
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can view their own documents' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Users can view their own documents"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Policy for uploading own documents
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can upload their own documents' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Users can upload their own documents"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Policy for updating own documents
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can update their own documents' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Users can update their own documents"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Policy for deleting own documents
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Users can delete their own documents' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Users can delete their own documents"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;