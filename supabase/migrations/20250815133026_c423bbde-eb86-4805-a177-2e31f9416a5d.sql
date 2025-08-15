-- Fix documents table schema to match upload requirements
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add missing columns for better document management
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS download_url TEXT;

-- Create document_versions table for version history
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  changes_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS for document_versions
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Create policy for document_versions
CREATE POLICY "Users can manage versions of their documents" 
ON document_versions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_versions.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Create timeline_events table
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for timeline_events
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policy for timeline_events
CREATE POLICY "Users can view their own timeline events" 
ON timeline_events 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_document_id ON timeline_events(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Insert mock categories
INSERT INTO categories (id, user_id, name, description, icon, color, document_count) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', (SELECT auth.uid()), 'Financial', 'Bank statements, tax returns, invoices', 'DollarSign', '#10B981', 8),
  ('550e8400-e29b-41d4-a716-446655440002', (SELECT auth.uid()), 'Legal', 'Contracts, agreements, legal papers', 'Scale', '#3B82F6', 5),
  ('550e8400-e29b-41d4-a716-446655440003', (SELECT auth.uid()), 'Personal', 'ID cards, passports, certificates', 'User', '#8B5CF6', 12),
  ('550e8400-e29b-41d4-a716-446655440004', (SELECT auth.uid()), 'Medical Records', 'Health reports, prescriptions, insurance', 'Heart', '#EF4444', 6),
  ('550e8400-e29b-41d4-a716-446655440005', (SELECT auth.uid()), 'Insurance', 'Insurance policies and claims', 'Shield', '#F59E0B', 4),
  ('550e8400-e29b-41d4-a716-446655440006', (SELECT auth.uid()), 'Property', 'Real estate, property papers', 'Home', '#06B6D4', 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  document_count = EXCLUDED.document_count;

-- InseINSERT INTO documents (id, user_id, name, category, mime_type, size, tags, file_url, download_url, ai_summary, extracted_text, status, created_at, updated_at) VALUES
  -- Financial Documents
  ('660e8400-e29b-41d4-a716-446655440001', (SELECT auth.uid()), 'Bank Statement - January 2024', 'Financial', 'application/pdf', 2048576, '["bank", "statement", "2024", "january"]'::jsonb, 'https://example.com/files/bank-statement-jan-2024.pdf', 'https://example.com/download/bank-statement-jan-2024.pdf', 'Bank statement showing transactions for January 2024 with ending balance of $5,240.', 'BANK STATEMENT January 2024 Beginning Balance: $4,890 Ending Balance: $5,240', 'completed', now() - interval '30 days', now() - interval '30 days'),
  ('660e8400-e29b-41d4-a716-446655440002', (SELECT auth.uid()), 'Tax Return 2023', 'Financial', 'application/pdf', 1536000, '["tax", "return", "2023", "income"]'::jsonb, 'https://example.com/files/tax-return-2023.pdf', 'https://example.com/download/tax-return-2023.pdf', 'Complete tax return for 2023 showing total income of $75,000 and tax owed of $8,200.', 'FORM 1040 Tax Year 2023 Total Income: $75,000 Tax Owed: $8,200', 'completed', now() - interval '60 days', now() - interval '60 days'),
  ('660e8400-e29b-41d4-a716-446655440003', (SELECT auth.uid()), 'Investment Portfolio Summary', 'Financial', 'application/pdf', 1024000, '["investment", "portfolio", "stocks", "bonds"]'::jsonb, 'https://example.com/files/investment-summary.pdf', 'https://example.com/download/investment-summary.pdf', 'Investment portfolio summary showing total value of $125,000 across stocks and bonds.', 'INVESTMENT SUMMARY Total Portfolio Value: $125,000 Stocks: 60% Bonds: 40%', 'completed', now() - interval '15 days', now() - interval '15 days'),
  
  -- Legal
  ('660e8400-e29b-41d4-a716-446655440004', (SELECT auth.uid()), 'Employment Contract', 'Legal', 'application/pdf', 800000, '["employment", "contract", "agreement", "salary"]'::jsonb, 'https://example.com/files/employment-contract.pdf', 'https://example.com/download/employment-contract.pdf', 'Employment contract with ABC Corp starting salary $80,000 annually.', 'EMPLOYMENT AGREEMENT ABC Corporation Salary: $80,000 per year Start Date: January 15, 2024', 'completed', now() - interval '45 days', now() - interval '45 days'),
  ('660e8400-e29b-41d4-a716-446655440005', (SELECT auth.uid()), 'Rental Agreement', 'Legal', 'application/pdf', 1200000, '["rental", "lease", "apartment", "monthly"]'::jsonb, 'https://example.com/files/rental-agreement.pdf', 'https://example.com/download/rental-agreement.pdf', 'Rental agreement for 2-bedroom apartment at $2,400 per month.', 'RENTAL LEASE AGREEMENT Property: 123 Main St, Apt 4B Monthly Rent: $2,400', 'completed', now() - interval '90 days', now() - interval '90 days'),
  
  -- Personal
  ('660e8400-e29b-41d4-a716-446655440006', (SELECT auth.uid()), 'Passport Copy', 'Personal', 'image/jpeg', 512000, '["passport", "travel", "identity", "official"]'::jsonb, 'https://example.com/files/passport-copy.jpg', 'https://example.com/download/passport-copy.jpg', 'Digital copy of passport valid until 2029 for international travel.', 'PASSPORT USA Valid Until: 2029-06-15 Passport Number: 123456789', 'completed', now() - interval '20 days', now() - interval '20 days'),
  ('660e8400-e29b-41d4-a716-446655440007', (SELECT auth.uid()), 'Birth Certificate', 'Personal', 'application/pdf', 600000, '["birth", "certificate", "official", "document"]'::jsonb, 'https://example.com/files/birth-certificate.pdf', 'https://example.com/download/birth-certificate.pdf', 'Official birth certificate issued by state registry.', 'CERTIFICATE OF BIRTH State of California Date of Birth: 1990-05-15', 'completed', now() - interval '25 days', now() - interval '25 days'),
  
  -- Medical
  ('660e8400-e29b-41d4-a716-446655440008', (SELECT auth.uid()), 'Annual Health Checkup', 'Medical', 'application/pdf', 700000, '["health", "checkup", "medical", "report"]'::jsonb, 'https://example.com/files/health-checkup.pdf', 'https://example.com/download/health-checkup.pdf', 'Annual health checkup report showing good overall health with minor recommendations.', 'HEALTH REPORT Overall Health: Good Blood Pressure: 120/80 Cholesterol: Normal', 'completed', now() - interval '10 days', now() - interval '10 days'),
  ('660e8400-e29b-41d4-a716-446655440009', (SELECT auth.uid()), 'Prescription Record', 'Medical', 'application/pdf', 300000, '["prescription", "medication", "doctor", "pharmacy"]'::jsonb, 'https://example.com/files/prescription.pdf', 'https://example.com/download/prescription.pdf', 'Prescription for blood pressure medication, 30-day supply.', 'PRESCRIPTION Medication: Lisinopril 10mg Quantity: 30 tablets', 'completed', now() - interval '5 days', now() - interval '5 days'),
  
  -- Insurance
  ('660e8400-e29b-41d4-a716-446655440010', (SELECT auth.uid()), 'Auto Insurance Policy', 'Insurance', 'application/pdf', 900000, '["auto", "insurance", "policy", "coverage"]'::jsonb, 'https://example.com/files/auto-insurance.pdf', 'https://example.com/download/auto-insurance.pdf', 'Auto insurance policy with comprehensive coverage, $500 deductible.', 'AUTO INSURANCE POLICY Coverage: Comprehensive Deductible: $500 Premium: $1,200/year', 'completed', now() - interval '35 days', now() - interval '35 days'),
  
  -- Property
  ('660e8400-e29b-41d4-a716-446655440011', (SELECT auth.uid()), 'House Deed', 'Property', 'application/pdf', 1100000, '["deed", "property", "house", "ownership"]'::jsonb, 'https://example.com/files/house-deed.pdf', 'https://example.com/download/house-deed.pdf', 'Property deed for 3-bedroom house at 456 Oak Street purchased for $350,000.', 'PROPERTY DEED Address: 456 Oak Street Purchase Price: $350,000 Date: 2022-03-15', 'completed', now() - interval '50 days', now() - interval '50 days')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  file_url = EXCLUDED.file_url,
  download_url = EXCLUDED.download_url,
  ai_summary = EXCLUDED.ai_summary,
  extracted_text = EXCLUDED.extracted_text,
  status = EXCLUDED.status;

-- Insert smart tags
INSERT INTO smart_tags (id, user_id, name, description, color, document_count, ai_query, is_system_generated) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', (SELECT auth.uid()), 'High Priority', 'Documents requiring immediate attention', '#EF4444', 5, 'urgent OR priority OR deadline OR important', true),
  ('770e8400-e29b-41d4-a716-446655440002', (SELECT auth.uid()), 'Tax Related', 'All tax and IRS related documents', '#F59E0B', 8, 'tax OR IRS OR 1040 OR deduction OR income', true),
  ('770e8400-e29b-41d4-a716-446655440003', (SELECT auth.uid()), 'Financial Planning', 'Investment and financial planning docs', '#10B981', 6, 'investment OR retirement OR portfolio OR financial planning', true),
  ('770e8400-e29b-41d4-a716-446655440004', (SELECT auth.uid()), 'Legal Contracts', 'All contractual agreements', '#3B82F6', 4, 'contract OR agreement OR terms OR conditions', true),
  ('770e8400-e29b-41d4-a716-446655440005', (SELECT auth.uid()), 'Medical History', 'Health and medical related documents', '#EC4899', 7, 'medical OR health OR doctor OR prescription OR diagnosis', true),
  ('770e8400-e29b-41d4-a716-446655440006', (SELECT auth.uid()), 'Property Records', 'Real estate and property documents', '#06B6D4', 3, 'property OR deed OR mortgage OR real estate', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  document_count = EXCLUDED.document_count;

-- Insert document versions
INSERT INTO document_versions (id, document_id, version_number, file_url, file_size, changes_description, created_by) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 1, 'https://example.com/files/bank-statement-jan-2024-v1.pdf', 2048576, 'Initial upload', (SELECT auth.uid())),
  ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 2, 'https://example.com/files/bank-statement-jan-2024-v2.pdf', 2100000, 'Updated with corrected balance', (SELECT auth.uid())),
  ('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 1, 'https://example.com/files/tax-return-2023-v1.pdf', 1536000, 'Initial tax return submission', (SELECT auth.uid())),
  ('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 1, 'https://example.com/files/employment-contract-v1.pdf', 800000, 'Original contract', (SELECT auth.uid())),
  ('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440004', 2, 'https://example.com/files/employment-contract-v2.pdf', 850000, 'Updated with salary adjustment', (SELECT auth.uid())),
  ('880e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 1, 'https://example.com/files/passport-copy-v1.jpg', 512000, 'Initial passport scan', (SELECT auth.uid())),
  ('880e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440008', 1, 'https://example.com/files/health-checkup-v1.pdf', 700000, 'Annual checkup results', (SELECT auth.uid()));

-- Insert timeline events
INSERT INTO timeline_events (id, user_id, document_id, event_type, title, description, metadata) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440001', 'upload', 'Document Uploaded', 'Bank Statement - January 2024 has been uploaded', '{"file_size": 2048576, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440002', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440001', 'ai_analysis', 'AI Analysis Completed', 'AI successfully analyzed and categorized the document', '{"confidence": 0.95, "category": "Financial"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440003', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440001', 'tag_added', 'Tags Added', 'Added tags: bank, statement, 2024, january', '{"tags": ["bank", "statement", "2024", "january"]}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440004', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440002', 'upload', 'Document Uploaded', 'Tax Return 2023 has been uploaded', '{"file_size": 1536000, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440005', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440002', 'ai_analysis', 'AI Analysis Completed', 'Document automatically categorized as Financial', '{"confidence": 0.98, "category": "Financial"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440006', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440003', 'upload', 'Document Uploaded', 'Investment Portfolio Summary uploaded', '{"file_size": 1024000, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440007', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440004', 'upload', 'Document Uploaded', 'Employment Contract uploaded', '{"file_size": 800000, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440008', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440004', 'version_created', 'New Version Created', 'Version 2 created with salary adjustment', '{"version": 2, "changes": "Updated with salary adjustment"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440009', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440005', 'upload', 'Document Uploaded', 'Rental Agreement uploaded', '{"file_size": 1200000, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440010', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440006', 'upload', 'Document Uploaded', 'Passport Copy uploaded', '{"file_size": 512000, "file_type": "image/jpeg"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440011', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440007', 'upload', 'Document Uploaded', 'Birth Certificate uploaded', '{"file_size": 600000, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440012', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440008', 'upload', 'Document Uploaded', 'Annual Health Checkup uploaded', '{"file_size": 700000, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440013', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440008', 'ai_analysis', 'AI Analysis Completed', 'Medical document categorized successfully', '{"confidence": 0.92, "category": "Medical"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440014', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440009', 'upload', 'Document Uploaded', 'Prescription Record uploaded', '{"file_size": 300000, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440015', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440010', 'upload', 'Document Uploaded', 'Auto Insurance Policy uploaded', '{"file_size": 900000, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440016', (SELECT auth.uid()), '660e8400-e29b-41d4-a716-446655440011', 'upload', 'Document Uploaded', 'House Deed uploaded', '{"file_size": 1100000, "file_type": "application/pdf"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440017', (SELECT auth.uid()), NULL, 'system', 'AI Insights Generated', 'New financial insights available based on recent uploads', '{"insights_count": 3, "type": "financial_analysis"}'::jsonb),
  ('990e8400-e29b-41d4-a716-446655440018', (SELECT auth.uid()), NULL, 'system', 'Smart Tags Updated', 'Smart tag suggestions updated based on document analysis', '{"new_tags": 5, "suggested_tags": 12}'::jsonb);