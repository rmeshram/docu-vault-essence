-- Create integrations table for external service connections
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own integrations" 
ON public.integrations 
FOR ALL 
USING (auth.uid() = user_id);

-- Create document_embeddings table for vector search
CREATE TABLE public.document_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  embedding VECTOR(1536),
  content_hash TEXT NOT NULL,
  model_version TEXT DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access embeddings for their documents" 
ON public.document_embeddings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM documents 
  WHERE documents.id = document_embeddings.document_id 
  AND documents.user_id = auth.uid()
));

-- Create document_relationships table for duplicate detection
CREATE TABLE public.document_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id_1 UUID NOT NULL,
  document_id_2 UUID NOT NULL,
  relationship_type TEXT NOT NULL,
  confidence_score NUMERIC(5,2),
  ai_detected BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access relationships for their documents" 
ON public.document_relationships 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM documents 
  WHERE (documents.id = document_relationships.document_id_1 OR documents.id = document_relationships.document_id_2)
  AND documents.user_id = auth.uid()
));

-- Create timeline_events table if not exists
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'timeline_events' AND policyname = 'Users can manage their timeline events') THEN
        CREATE POLICY "Users can manage their timeline events" 
        ON public.timeline_events 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Update updated_at trigger for integrations
CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();