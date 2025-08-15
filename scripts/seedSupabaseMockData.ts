// docu-vault-essence/scripts/seedSupabaseMockData.ts
// This script automates seeding mock data for Supabase/Postgres backend for document management app
// Usage: Run with `npx tsx scripts/seedSupabaseMockData.ts` after configuring your Supabase connection

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbwyocwpyxncnwmywama.supabase.co'
const SUPABASE_KEY= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid3lvY3dweXhuY253bXl3YW1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA2NTY1NiwiZXhwIjoyMDcwNjQxNjU2fQ.QLnXIa_VyxsPp_BsHGq4jJBAAPOjZH9LfriuaywZo_M"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


async function ensureTagsColumn() {
  // Add 'tags' column if missing
  await supabase.rpc('add_tags_column_if_missing');
}

async function seedCategories() {
  // Categories table requires UUID, user_id, name, description, icon, color, etc.
  const userId = '00000000-0000-0000-0000-000000000000'; // Replace with a real user UUID
  const categories = [
    { name: 'Finance', user_id: userId, description: 'Finance docs', icon: '💸', color: '#22d3ee' },
    { name: 'Health', user_id: userId, description: 'Health docs', icon: '🩺', color: '#f43f5e' },
    { name: 'Education', user_id: userId, description: 'Education docs', icon: '🎓', color: '#6366f1' },
    { name: 'Personal', user_id: userId, description: 'Personal docs', icon: '👤', color: '#f59e42' },
  ];
  await supabase.from('categories').insert(categories);
}

async function seedDocuments() {
  // Documents table requires UUID, user_id, name, size, category (enum), storage_path, version, created_at, updated_at
  const userId = '00000000-0000-0000-0000-000000000000'; // Replace with a real user UUID
  const documents = [
    {
      name: 'Tax Report 2024',
      user_id: userId,
      size: 102400,
      category: 'Financial',
      storage_path: '/docs/tax2024.pdf',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Medical Prescription',
      user_id: userId,
      size: 20480,
      category: 'Medical',
      storage_path: '/docs/prescription.jpg',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Degree Certificate',
      user_id: userId,
      size: 40960,
      category: 'Education',
      storage_path: '/docs/degree.pdf',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Passport Scan',
      user_id: userId,
      size: 30720,
      category: 'Identity',
      storage_path: '/docs/passport_scan.pdf',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Personal Photo',
      user_id: userId,
      size: 51200,
      category: 'Personal',
      storage_path: '/docs/personal_photo.jpg',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Resume',
      user_id: userId,
      size: 25600,
      category: 'Personal',
      storage_path: '/docs/resume.pdf',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Bank Statement',
      user_id: userId,
      size: 102400,
      category: 'Financial',
      storage_path: '/docs/bank_statement.pdf',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Vaccination Card',
      user_id: userId,
      size: 20480,
      category: 'Medical',
      storage_path: '/docs/vaccination_card.jpg',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Transcript',
      user_id: userId,
      size: 40960,
      category: 'Education',
      storage_path: '/docs/transcript.pdf',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Personal Letter',
      user_id: userId,
      size: 30720,
      category: 'Personal',
      storage_path: '/docs/personal_letter.pdf',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Fitness Report',
      user_id: userId,
      size: 51200,
      category: 'Medical',
      storage_path: '/docs/fitness_report.pdf',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'Scholarship Award',
      user_id: userId,
      size: 25600,
      category: 'Education',
      storage_path: '/docs/scholarship_award.pdf',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  await supabase.from('documents').insert(documents);
}

async function seedSmartTags() {
  const smartTags = [
    { id: 1, document_id: 101, tag: 'tax' },
    { id: 2, document_id: 101, tag: 'finance' },
    { id: 3, document_id: 102, tag: 'prescription' },
    { id: 4, document_id: 102, tag: 'health' },
    { id: 5, document_id: 103, tag: 'degree' },
    { id: 6, document_id: 103, tag: 'education' },
    { id: 7, document_id: 107, tag: 'bank' },
    { id: 8, document_id: 107, tag: 'statement' },
    { id: 9, document_id: 108, tag: 'vaccination' },
    { id: 10, document_id: 108, tag: 'card' },
    { id: 11, document_id: 109, tag: 'transcript' },
    { id: 12, document_id: 110, tag: 'letter' },
    { id: 13, document_id: 111, tag: 'fitness' },
    { id: 14, document_id: 112, tag: 'scholarship' },
  ];
  await supabase.from('smart_tags').upsert(smartTags);
}

async function seedDocumentVersions() {
  const versions = [
    { id: 1, document_id: 101, file_url: 'https://example.com/docs/tax2024_v1.pdf', version: 1, created_at: new Date().toISOString() },
    { id: 2, document_id: 101, file_url: 'https://example.com/docs/tax2024_v2.pdf', version: 2, created_at: new Date().toISOString() },
    { id: 3, document_id: 102, file_url: 'https://example.com/docs/prescription_v1.jpg', version: 1, created_at: new Date().toISOString() },
    { id: 4, document_id: 103, file_url: 'https://example.com/docs/degree_v1.pdf', version: 1, created_at: new Date().toISOString() },
    { id: 5, document_id: 107, file_url: 'https://example.com/docs/bank_statement_v1.pdf', version: 1, created_at: new Date().toISOString() },
    { id: 6, document_id: 108, file_url: 'https://example.com/docs/vaccination_card_v1.jpg', version: 1, created_at: new Date().toISOString() },
    { id: 7, document_id: 109, file_url: 'https://example.com/docs/transcript_v1.pdf', version: 1, created_at: new Date().toISOString() },
    { id: 8, document_id: 110, file_url: 'https://example.com/docs/personal_letter_v1.pdf', version: 1, created_at: new Date().toISOString() },
    { id: 9, document_id: 111, file_url: 'https://example.com/docs/fitness_report_v1.pdf', version: 1, created_at: new Date().toISOString() },
    { id: 10, document_id: 112, file_url: 'https://example.com/docs/scholarship_award_v1.pdf', version: 1, created_at: new Date().toISOString() },
  ];
  await supabase.from('document_versions').upsert(versions);
}

async function seedTimelineEvents() {
  const events = [
    { id: 1, document_id: 101, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 2, document_id: 101, event_type: 'versioned', description: 'Version 2 added', timestamp: new Date().toISOString() },
    { id: 3, document_id: 102, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 4, document_id: 103, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 5, document_id: 107, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 6, document_id: 108, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 7, document_id: 109, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 8, document_id: 110, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 9, document_id: 111, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 10, document_id: 112, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
  ];
  await supabase.from('timeline_events').upsert(events);
}

async function main() {
  await ensureTagsColumn();
  await seedCategories();
  await seedDocuments();
  await seedSmartTags();
  await seedDocumentVersions();
  await seedTimelineEvents();
  console.log('Supabase mock data seeded successfully!');
}

main().catch(console.error);
