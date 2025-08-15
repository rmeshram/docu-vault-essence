-- Mock Data for DocuVault Development
-- This file creates realistic test data for development and testing

-- Insert sample user profiles
INSERT INTO public.user_profiles (id, email, name, avatar_url, subscription_tier, storage_used_mb, ai_queries_used) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John Doe', 'https://i.pravatar.cc/150?img=1', 'Premium', 1250, 45),
  ('22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', 'Jane Smith', 'https://i.pravatar.cc/150?img=2', 'Family Plus', 3400, 120),
  ('33333333-3333-3333-3333-333333333333', 'raj.patel@example.com', 'Raj Patel', 'https://i.pravatar.cc/150?img=3', 'Free', 890, 25),
  ('44444444-4444-4444-4444-444444444444', 'priya.sharma@example.com', 'Priya Sharma', 'https://i.pravatar.cc/150?img=4', 'Business', 5600, 200),
  ('55555555-5555-5555-5555-555555555555', 'amit.kumar@example.com', 'Amit Kumar', 'https://i.pravatar.cc/150?img=5', 'Free', 340, 12)
ON CONFLICT (id) DO NOTHING;

-- Insert family vaults
INSERT INTO public.family_vaults (id, owner_id, name, used_storage_mb) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Smith Family Vault', 15600),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'Sharma Business Vault', 28900)
ON CONFLICT (id) DO NOTHING;

-- Insert family members
INSERT INTO public.family_members (family_vault_id, user_id, role, storage_used_mb, document_count) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'owner', 3400, 25),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin', 1250, 18),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member', 890, 12),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'owner', 5600, 42),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'member', 340, 8)
ON CONFLICT (family_vault_id, user_id) DO NOTHING;

-- Insert sample documents
INSERT INTO public.documents (id, user_id, name, category, file_type, size, ai_summary, is_verified, language_detected, version, tags, metadata) VALUES
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Aadhaar Card.pdf', 'Identity', 'pdf', 245760, 'Government issued identity card containing personal details and biometric information', true, 'English', 1, ARRAY['identity', 'government', 'official'], '{"ocr_confidence": 0.95, "pages": 1, "encrypted": true}'),
  ('d2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'PAN Card.pdf', 'Identity', 'pdf', 180240, 'Permanent Account Number card for income tax purposes', true, 'English', 1, ARRAY['tax', 'pan', 'income'], '{"ocr_confidence": 0.92, "pages": 1, "encrypted": true}'),
  ('d3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Property Agreement.pdf', 'Legal', 'pdf', 1048576, 'Property purchase agreement with terms, conditions, and legal clauses', false, 'English', 2, ARRAY['property', 'legal', 'agreement'], '{"ocr_confidence": 0.88, "pages": 15, "encrypted": true}'),
  ('d4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Medical Report - Annual Checkup.pdf', 'Medical', 'pdf', 524288, 'Comprehensive annual health checkup report with lab results and recommendations', true, 'English', 1, ARRAY['health', 'checkup', 'medical'], '{"ocr_confidence": 0.90, "pages": 8, "encrypted": true}'),
  ('d5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Insurance Policy - Health.pdf', 'Insurance', 'pdf', 786432, 'Health insurance policy document with coverage details and terms', true, 'English', 1, ARRAY['insurance', 'health', 'policy'], '{"ocr_confidence": 0.91, "pages": 12, "encrypted": true}'),
  ('d6666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Business License.pdf', 'Business', 'pdf', 327680, 'Official business registration and licensing document', true, 'English', 1, ARRAY['business', 'license', 'registration'], '{"ocr_confidence": 0.94, "pages": 3, "encrypted": true}'),
  ('d7777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'GST Certificate.pdf', 'Tax', 'pdf', 204800, 'Goods and Services Tax registration certificate', true, 'English', 1, ARRAY['gst', 'tax', 'business'], '{"ocr_confidence": 0.96, "pages": 2, "encrypted": true}'),
  ('d8888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'Vehicle Registration.pdf', 'Vehicle', 'pdf', 163840, 'Motor vehicle registration certificate with ownership details', true, 'English', 1, ARRAY['vehicle', 'registration', 'transport'], '{"ocr_confidence": 0.93, "pages": 1, "encrypted": true}'),
  ('d9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Bank Statement - January 2025.pdf', 'Financial', 'pdf', 450560, 'Monthly bank statement with transaction details and account summary', false, 'English', 1, ARRAY['bank', 'financial', 'statement'], '{"ocr_confidence": 0.89, "pages": 6, "encrypted": true}'),
  ('da111111-a111-a111-a111-a11111111111', '22222222-2222-2222-2222-222222222222', 'Passport.pdf', 'Identity', 'pdf', 409600, 'Indian passport with personal details and visa pages', true, 'English', 1, ARRAY['passport', 'identity', 'travel'], '{"ocr_confidence": 0.97, "pages": 4, "encrypted": true}')
ON CONFLICT (id) DO NOTHING;

-- Insert AI insights
INSERT INTO public.ai_insights (id, user_id, type, title, description, priority, category, confidence_score, action_items, savings_amount, metadata) VALUES
  ('i1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'expiry_alert', 'Document Expiry Alert', 'Your PAN card will expire in 6 months. Consider renewing it soon.', 'high', 'Identity', 0.92, ARRAY['Renew PAN card', 'Update address if needed'], 0, '{"expiry_date": "2025-08-15", "renewal_link": "https://incometaxindia.gov.in"}'),
  ('i2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'cost_saving', 'Insurance Premium Optimization', 'You could save ₹15,000 annually by switching to a better health insurance plan.', 'medium', 'Insurance', 0.85, ARRAY['Compare insurance plans', 'Contact insurance advisor'], 15000, '{"current_premium": 45000, "suggested_premium": 30000}'),
  ('i3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'tax_benefit', 'Tax Deduction Available', 'Your medical expenses qualify for tax deduction under Section 80D.', 'medium', 'Tax', 0.88, ARRAY['Collect medical receipts', 'Consult CA for filing'], 8500, '{"deduction_amount": 8500, "section": "80D"}'),
  ('i4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'compliance', 'GST Filing Due', 'Your GST return filing is due in 5 days. Avoid penalties by filing on time.', 'high', 'Business', 0.95, ARRAY['Prepare GST return', 'File before deadline'], 0, '{"due_date": "2025-08-20", "penalty_amount": 5000}'),
  ('i5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'renewal', 'Vehicle Insurance Renewal', 'Your vehicle insurance expires next month. Renew to avoid legal issues.', 'high', 'Vehicle', 0.90, ARRAY['Compare insurance quotes', 'Renew policy online'], 2500, '{"expiry_date": "2025-09-15", "renewal_discount": 2500}')
ON CONFLICT (id) DO NOTHING;

-- Insert reminders
INSERT INTO public.reminders (id, user_id, document_id, title, description, reminder_date, priority, status, reminder_type) VALUES
  ('r1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'PAN Card Renewal', 'PAN card expires in 6 months', '2025-09-15 09:00:00+00', 'high', 'pending', 'expiry'),
  ('r2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444', 'Annual Health Checkup', 'Schedule next annual health checkup', '2025-12-01 10:00:00+00', 'medium', 'pending', 'recurring'),
  ('r3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'd7777777-7777-7777-7777-777777777777', 'GST Filing Due', 'Monthly GST return filing deadline', '2025-08-20 16:00:00+00', 'high', 'pending', 'deadline'),
  ('r4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'd8888888-8888-8888-8888-888888888888', 'Vehicle Insurance Renewal', 'Renew vehicle insurance policy', '2025-09-10 12:00:00+00', 'high', 'pending', 'renewal'),
  ('r5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'd5555555-5555-5555-5555-555555555555', 'Insurance Premium Payment', 'Quarterly insurance premium due', '2025-10-01 14:00:00+00', 'medium', 'pending', 'payment')
ON CONFLICT (id) DO NOTHING;

-- Insert document relationships (versions, related docs)
INSERT INTO public.document_relationships (document1_id, document2_id, relationship_type, confidence_score) VALUES
  ('d3333333-3333-3333-3333-333333333333', 'd1111111-1111-1111-1111-111111111111', 'related', 0.75),
  ('d5555555-5555-5555-5555-555555555555', 'd4444444-4444-4444-4444-444444444444', 'related', 0.82),
  ('d6666666-6666-6666-6666-666666666666', 'd7777777-7777-7777-7777-777777777777', 'related', 0.90)
ON CONFLICT (document1_id, document2_id, relationship_type) DO NOTHING;

-- Insert family activities
INSERT INTO public.family_activities (family_vault_id, user_id, activity_type, document_id, description) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'upload', 'd3333333-3333-3333-3333-333333333333', 'Uploaded property agreement document'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'share', 'd1111111-1111-1111-1111-111111111111', 'Shared Aadhaar card with family members'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'upload', 'd6666666-6666-6666-6666-666666666666', 'Added business license to vault'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'join', null, 'Joined the Smith Family Vault'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'upload', 'd8888888-8888-8888-8888-888888888888', 'Uploaded vehicle registration document')
ON CONFLICT DO NOTHING;

-- Insert user analytics
INSERT INTO public.user_analytics (user_id, event_type, event_data, session_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'document_upload', '{"category": "Identity", "file_size": 245760, "processing_time": 2.3}', 'sess_001'),
  ('22222222-2222-2222-2222-222222222222', 'ai_chat_query', '{"query": "What documents do I need for home loan?", "response_time": 1.8}', 'sess_002'),
  ('33333333-3333-3333-3333-333333333333', 'document_search', '{"search_term": "insurance", "results_count": 3}', 'sess_003'),
  ('44444444-4444-4444-4444-444444444444', 'category_view', '{"category": "Business", "documents_viewed": 5}', 'sess_004'),
  ('55555555-5555-5555-5555-555555555555', 'reminder_created', '{"reminder_type": "renewal", "due_date": "2025-09-10"}', 'sess_005')
ON CONFLICT DO NOTHING;

-- Insert notification preferences
INSERT INTO public.notification_preferences (user_id, email_notifications, push_notifications, reminder_notifications, family_notifications, ai_insights_notifications) VALUES
  ('11111111-1111-1111-1111-111111111111', true, true, true, true, true),
  ('22222222-2222-2222-2222-222222222222', true, false, true, true, true),
  ('33333333-3333-3333-3333-333333333333', false, true, true, false, true),
  ('44444444-4444-4444-4444-444444444444', true, true, true, false, true),
  ('55555555-5555-5555-5555-555555555555', true, true, true, true, false)
ON CONFLICT (user_id) DO NOTHING;

-- Insert subscriptions
INSERT INTO public.subscriptions (user_id, tier, status, end_date, amount_paid) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Premium', 'active', '2025-12-31 23:59:59+00', 999.00),
  ('22222222-2222-2222-2222-222222222222', 'Family Plus', 'active', '2026-01-31 23:59:59+00', 1999.00),
  ('44444444-4444-4444-4444-444444444444', 'Business', 'active', '2025-11-30 23:59:59+00', 4999.00)
ON CONFLICT (user_id) DO NOTHING;

-- Insert professionals
INSERT INTO public.professionals (id, user_id, type, name, email, phone, license_number, specializations, bio, experience_years, rating, total_reviews, hourly_rate, languages) VALUES
  ('p1111111-1111-1111-1111-111111111111', null, 'ca', 'Rajesh Agarwal', 'rajesh.ca@example.com', '+91-9876543210', 'CA123456789', ARRAY['Tax Planning', 'GST Compliance', 'Audit'], 'Chartered Accountant with 15 years of experience in tax planning and compliance', 15, 4.8, 124, 2500.00, ARRAY['English', 'Hindi', 'Gujarati']),
  ('p2222222-2222-2222-2222-222222222222', null, 'lawyer', 'Advocate Priya Singh', 'priya.lawyer@example.com', '+91-9876543211', 'L987654321', ARRAY['Property Law', 'Family Law', 'Civil Litigation'], 'Senior advocate specializing in property and family law matters', 12, 4.6, 89, 3500.00, ARRAY['English', 'Hindi']),
  ('p3333333-3333-3333-3333-333333333333', null, 'doctor', 'Dr. Amit Sharma', 'dr.amit@example.com', '+91-9876543212', 'D456789123', ARRAY['General Medicine', 'Preventive Healthcare'], 'MBBS, MD General Medicine with focus on preventive healthcare', 8, 4.9, 156, 1500.00, ARRAY['English', 'Hindi']),
  ('p4444444-4444-4444-4444-444444444444', null, 'insurance_agent', 'Suresh Kumar', 'suresh.insurance@example.com', '+91-9876543213', 'I789123456', ARRAY['Life Insurance', 'Health Insurance', 'Motor Insurance'], 'Licensed insurance agent with expertise in all types of insurance products', 10, 4.5, 78, 1000.00, ARRAY['English', 'Hindi', 'Tamil']),
  ('p5555555-5555-5555-5555-555555555555', null, 'financial_advisor', 'Meera Joshi', 'meera.finance@example.com', '+91-9876543214', 'F321654987', ARRAY['Investment Planning', 'Retirement Planning', 'Mutual Funds'], 'Certified financial planner helping clients achieve their financial goals', 7, 4.7, 92, 2000.00, ARRAY['English', 'Hindi', 'Marathi'])
ON CONFLICT (id) DO NOTHING;

-- Insert service bookings
INSERT INTO public.service_bookings (client_id, professional_id, service_type, description, scheduled_at, status, amount) VALUES
  ('11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Tax Consultation', 'Need help with annual tax filing and planning', '2025-08-25 14:00:00+00', 'confirmed', 2500.00),
  ('22222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'Property Legal Review', 'Legal review of property purchase agreement', '2025-08-28 10:00:00+00', 'pending', 3500.00),
  ('33333333-3333-3333-3333-333333333333', 'p4444444-4444-4444-4444-444444444444', 'Insurance Planning', 'Review current insurance portfolio and suggest improvements', '2025-08-30 16:00:00+00', 'confirmed', 1000.00)
ON CONFLICT DO NOTHING;

-- Insert professional reviews
INSERT INTO public.professional_reviews (professional_id, client_id, rating, review_text, is_verified) VALUES
  ('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 5, 'Excellent service! Rajesh helped me save a lot on taxes and explained everything clearly.', true),
  ('p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 4, 'Very knowledgeable lawyer. Handled my property case professionally.', true),
  ('p3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 5, 'Dr. Amit is very thorough and caring. Great preventive healthcare advice.', true),
  ('p4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 4, 'Good insurance agent, helped me find the right policy at competitive rates.', true),
  ('p5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 5, 'Meera created an excellent financial plan for our family. Highly recommended!', true)
ON CONFLICT DO NOTHING;

-- Insert chat conversations (for AI chat history)
INSERT INTO public.chat_conversations (id, user_id, title, created_at) VALUES
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Document Organization Help', NOW() - INTERVAL '2 days'),
  ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Tax Planning Questions', NOW() - INTERVAL '1 day'),
  ('c3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Business Compliance Queries', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert chat messages
INSERT INTO public.chat_messages (conversation_id, sender_type, content, created_at) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'user', 'How should I organize my documents for better management?', NOW() - INTERVAL '2 days'),
  ('c1111111-1111-1111-1111-111111111111', 'ai', 'I recommend organizing your documents by category: Identity, Financial, Legal, Medical, etc. Based on your uploaded documents, I can see you have identity documents like Aadhaar and PAN cards. Would you like me to suggest a detailed organization structure?', NOW() - INTERVAL '2 days' + INTERVAL '30 seconds'),
  ('c2222222-2222-2222-2222-222222222222', 'user', 'What tax deductions am I eligible for this year?', NOW() - INTERVAL '1 day'),
  ('c2222222-2222-2222-2222-222222222222', 'ai', 'Based on your documents, you have medical expenses that qualify for Section 80D deductions. Your health insurance premiums can also be claimed. I estimate you could save around ₹15,000 in taxes. Would you like me to provide a detailed breakdown?', NOW() - INTERVAL '1 day' + INTERVAL '45 seconds'),
  ('c3333333-3333-3333-3333-333333333333', 'user', 'Do I need to file GST returns monthly?', NOW() - INTERVAL '3 hours'),
  ('c3333333-3333-3333-3333-333333333333', 'ai', 'Yes, based on your GST registration certificate, you need to file monthly returns. Your next filing is due on August 20th, 2025. I can help you prepare the necessary documents or connect you with a CA for assistance.', NOW() - INTERVAL '3 hours' + INTERVAL '1 minute')
ON CONFLICT DO NOTHING;

-- Update document counts and storage usage for users
UPDATE public.user_profiles SET 
  storage_used_mb = (
    SELECT COALESCE(SUM(size), 0) / 1024 / 1024 
    FROM public.documents 
    WHERE user_id = public.user_profiles.id
  );

-- Create some version history by inserting older versions
INSERT INTO public.documents (id, user_id, name, category, file_type, size, ai_summary, version, parent_document_id, created_at) VALUES
  ('dv111111-v111-v111-v111-v11111111111', '22222222-2222-2222-2222-222222222222', 'Property Agreement.pdf', 'Legal', 'pdf', 987654, 'Initial property agreement draft', 1, 'd3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- Insert some family invitations
INSERT INTO public.family_invitations (family_vault_id, invited_email, role, invited_by, expires_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'newmember@example.com', 'member', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '7 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'colleague@example.com', 'viewer', '44444444-4444-4444-4444-444444444444', NOW() + INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Create summary statistics for dashboard
-- This will be used by the analytics functions
INSERT INTO public.user_analytics (user_id, event_type, event_data) VALUES
  ('11111111-1111-1111-1111-111111111111', 'monthly_summary', '{"documents_uploaded": 3, "ai_queries": 45, "storage_used": 1250, "insights_generated": 8}'),
  ('22222222-2222-2222-2222-222222222222', 'monthly_summary', '{"documents_uploaded": 5, "ai_queries": 120, "storage_used": 3400, "insights_generated": 12}'),
  ('33333333-3333-3333-3333-333333333333', 'monthly_summary', '{"documents_uploaded": 2, "ai_queries": 25, "storage_used": 890, "insights_generated": 4}'),
  ('44444444-4444-4444-4444-444444444444', 'monthly_summary', '{"documents_uploaded": 8, "ai_queries": 200, "storage_used": 5600, "insights_generated": 15}'),
  ('55555555-5555-5555-5555-555555555555', 'monthly_summary', '{"documents_uploaded": 1, "ai_queries": 12, "storage_used": 340, "insights_generated": 2}')
ON CONFLICT DO NOTHING;

-- Add document content for search (mock OCR extracted text)
UPDATE public.documents SET extracted_text = 
  CASE id
    WHEN 'd1111111-1111-1111-1111-111111111111' THEN 'Aadhaar Permanent Account Number Card Government of India Name: John Doe Father Name: Robert Doe Date of Birth: 15/01/1990 Address: 123 Main Street, Mumbai, Maharashtra - 400001'
    WHEN 'd2222222-2222-2222-2222-222222222222' THEN 'Income Tax Department Government of India Permanent Account Number Card Name: John Doe Father Name: Robert Doe Date of Birth: 15/01/1990 PAN: ABCDE1234F'
    WHEN 'd3333333-3333-3333-3333-333333333333' THEN 'Property Sale Agreement This agreement is made between seller Jane Smith and buyer John Doe for property located at 456 Park Avenue, Mumbai. Sale consideration: Rs. 50,00,000'
    WHEN 'd4444444-4444-4444-4444-444444444444' THEN 'Medical Report Annual Health Checkup Patient: Jane Smith Age: 35 Years Blood Pressure: 120/80 mmHg Blood Sugar: 95 mg/dl Cholesterol: 180 mg/dl Overall Health: Good'
    WHEN 'd5555555-5555-5555-5555-555555555555' THEN 'Health Insurance Policy Policyholder: Raj Patel Policy Number: HEALTH123456 Sum Insured: Rs. 5,00,000 Premium: Rs. 15,000 per annum Coverage: Hospitalization, Pre-existing diseases'
    ELSE 'Document content extracted via OCR processing'
  END
WHERE extracted_text IS NULL OR extracted_text = '';
