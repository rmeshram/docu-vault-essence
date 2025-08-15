-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_documents_by_similarity(
  query_embedding vector(1536),
  user_id uuid,
  similarity_threshold float DEFAULT 0.7,
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  ai_summary text,
  file_type text,
  created_at timestamptz,
  similarity float
) 
LANGUAGE sql
AS $$
  SELECT 
    d.id,
    d.name,
    d.category::text,
    d.ai_summary,
    d.file_type,
    d.created_at,
    1 - (de.embedding <=> query_embedding) as similarity
  FROM documents d
  JOIN document_embeddings de ON de.document_id = d.id
  WHERE d.user_id = search_documents_by_similarity.user_id
    AND 1 - (de.embedding <=> query_embedding) > similarity_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT limit_count;
$$;

-- Full text search function
CREATE OR REPLACE FUNCTION search_documents_fulltext(
  search_query text,
  user_id uuid,
  category_filter text DEFAULT NULL,
  limit_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  ai_summary text,
  extracted_text text,
  file_type text,
  created_at timestamptz,
  rank float
)
LANGUAGE sql
AS $$
  SELECT 
    d.id,
    d.name,
    d.category::text,
    d.ai_summary,
    d.extracted_text,
    d.file_type,
    d.created_at,
    ts_rank(
      to_tsvector('english', d.name || ' ' || COALESCE(d.ai_summary, '') || ' ' || COALESCE(d.extracted_text, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM documents d
  WHERE d.user_id = search_documents_fulltext.user_id
    AND to_tsvector('english', d.name || ' ' || COALESCE(d.ai_summary, '') || ' ' || COALESCE(d.extracted_text, ''))
        @@ plainto_tsquery('english', search_query)
    AND (category_filter IS NULL OR d.category::text = category_filter)
  ORDER BY rank DESC
  LIMIT limit_count;
$$;

-- Get document analytics
CREATE OR REPLACE FUNCTION get_document_analytics(
  user_id uuid,
  time_period text DEFAULT 'monthly'
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  start_date timestamptz;
BEGIN
  -- Calculate start date based on period
  CASE time_period
    WHEN 'daily' THEN start_date := now() - interval '1 day';
    WHEN 'weekly' THEN start_date := now() - interval '1 week';
    WHEN 'monthly' THEN start_date := now() - interval '1 month';
    WHEN 'yearly' THEN start_date := now() - interval '1 year';
    ELSE start_date := now() - interval '1 month';
  END CASE;

  SELECT json_build_object(
    'total_documents', COUNT(*),
    'total_size_bytes', COALESCE(SUM(file_size), 0),
    'categories', json_agg(DISTINCT category),
    'recent_uploads', COUNT(*) FILTER (WHERE created_at >= start_date),
    'avg_file_size', COALESCE(AVG(file_size), 0),
    'category_breakdown', (
      SELECT json_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*) as count
        FROM documents
        WHERE documents.user_id = get_document_analytics.user_id
        GROUP BY category
      ) cat_counts
    )
  ) INTO result
  FROM documents
  WHERE documents.user_id = get_document_analytics.user_id;

  RETURN result;
END;
$$;

-- Auto-generate reminders from document content
CREATE OR REPLACE FUNCTION extract_dates_and_create_reminders(
  document_id uuid,
  extracted_text text,
  ai_summary text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  doc_record documents%ROWTYPE;
  reminder_date timestamptz;
  reminder_title text;
  reminder_description text;
BEGIN
  -- Get document details
  SELECT * INTO doc_record FROM documents WHERE id = document_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Insurance expiry detection
  IF doc_record.category = 'Insurance' AND (
    ai_summary ILIKE '%expir%' OR 
    ai_summary ILIKE '%renew%' OR
    extracted_text ILIKE '%valid till%' OR
    extracted_text ILIKE '%expires on%'
  ) THEN
    -- Extract potential expiry date (simplified regex)
    -- In production, use more sophisticated date extraction
    reminder_date := now() + interval '30 days';
    reminder_title := 'Insurance Policy Review: ' || doc_record.name;
    reminder_description := 'AI detected potential expiry information in this insurance document';
    
    INSERT INTO reminders (
      user_id, document_id, title, description, reminder_date,
      category, urgency, is_auto_generated, auto_generation_rule
    ) VALUES (
      doc_record.user_id, document_id, reminder_title, reminder_description,
      reminder_date, doc_record.category, 'medium', true,
      '{"trigger": "insurance_expiry", "confidence": 0.8}'::jsonb
    );
  END IF;

  -- Tax deadline detection
  IF doc_record.category = 'Tax' AND (
    ai_summary ILIKE '%deadline%' OR
    ai_summary ILIKE '%due date%' OR
    extracted_text ILIKE '%31st march%' OR
    extracted_text ILIKE '%july 31%'
  ) THEN
    reminder_date := now() + interval '15 days';
    reminder_title := 'Tax Filing Reminder: ' || doc_record.name;
    reminder_description := 'AI detected tax deadline information in this document';
    
    INSERT INTO reminders (
      user_id, document_id, title, description, reminder_date,
      category, urgency, is_auto_generated, auto_generation_rule
    ) VALUES (
      doc_record.user_id, document_id, reminder_title, reminder_description,
      reminder_date, doc_record.category, 'high', true,
      '{"trigger": "tax_deadline", "confidence": 0.9}'::jsonb
    );
  END IF;

  -- Medical appointment detection
  IF doc_record.category = 'Medical' AND (
    ai_summary ILIKE '%appointment%' OR
    ai_summary ILIKE '%follow up%' OR
    ai_summary ILIKE '%next visit%'
  ) THEN
    reminder_date := now() + interval '7 days';
    reminder_title := 'Medical Follow-up: ' || doc_record.name;
    reminder_description := 'AI detected medical appointment information';
    
    INSERT INTO reminders (
      user_id, document_id, title, description, reminder_date,
      category, urgency, is_auto_generated, auto_generation_rule
    ) VALUES (
      doc_record.user_id, document_id, reminder_title, reminder_description,
      reminder_date, doc_record.category, 'medium', true,
      '{"trigger": "medical_appointment", "confidence": 0.7}'::jsonb
    );
  END IF;
END;
$$;

-- Function to find duplicate documents
CREATE OR REPLACE FUNCTION find_duplicate_documents(
  user_id uuid,
  file_name text,
  file_size bigint,
  content_hash text DEFAULT NULL
)
RETURNS TABLE (
  document_id uuid,
  similarity_score float,
  duplicate_type text
)
LANGUAGE sql
AS $$
  SELECT 
    d.id as document_id,
    CASE 
      WHEN d.name = file_name AND d.file_size = find_duplicate_documents.file_size THEN 1.0
      WHEN d.name = file_name THEN 0.8
      WHEN d.file_size = find_duplicate_documents.file_size THEN 0.6
      ELSE 0.4
    END as similarity_score,
    CASE 
      WHEN d.name = file_name AND d.file_size = find_duplicate_documents.file_size THEN 'exact'
      WHEN d.name = file_name THEN 'name_match'
      WHEN d.file_size = find_duplicate_documents.file_size THEN 'size_match'
      ELSE 'potential'
    END as duplicate_type
  FROM documents d
  WHERE d.user_id = find_duplicate_documents.user_id
    AND (
      d.name = file_name OR
      d.file_size = find_duplicate_documents.file_size OR
      (content_hash IS NOT NULL AND d.metadata->>'content_hash' = content_hash)
    )
  ORDER BY similarity_score DESC;
$$;