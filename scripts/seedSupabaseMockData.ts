// docu-vault-essence/scripts/seedSupabaseMockData.ts
// This script automates seeding mock data for Supabase/Postgres backend for document management app
// Usage: Run with `npx tsx scripts/seedSupabaseMockData.ts` after configuring your Supabase connection

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL="https://your-project.supabase.co"
const SUPABASE_KEY="your-service-role-key"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function ensureTagsColumn() {
  // Add 'tags' column if missing
  await supabase.rpc('add_tags_column_if_missing');
}

async function seedCategories() {
  const categories = [
    { id: 1, name: 'Finance' },
    { id: 2, name: 'Health' },
    { id: 3, name: 'Education' },
    { id: 4, name: 'Personal' },
  ];
  await supabase.from('categories').upsert(categories);
}

async function seedDocuments() {
  const documents = [
    {
      id: 101,
      name: 'Tax Report 2024',
      file_url: 'https://example.com/docs/tax2024.pdf',
      category_id: 1,
      tags: ['tax', 'report', 'finance'],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 102,
      name: 'Medical Prescription',
      file_url: 'https://example.com/docs/prescription.jpg',
      category_id: 2,
      tags: ['prescription', 'health'],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 103,
      name: 'Degree Certificate',
      file_url: 'https://example.com/docs/degree.pdf',
      category_id: 3,
      tags: ['degree', 'education'],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Personal category mock files
    {
      id: 104,
      name: 'Passport Scan',
      file_url: 'https://example.com/docs/passport_scan.pdf',
      category_id: 4,
      tags: ['passport', 'personal', 'id'],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 105,
      name: 'Personal Photo',
      file_url: 'https://example.com/docs/personal_photo.jpg',
      category_id: 4,
      tags: ['photo', 'personal'],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 106,
      name: 'Resume',
      file_url: 'https://example.com/docs/resume.pdf',
      category_id: 4,
      tags: ['resume', 'personal', 'career'],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  await supabase.from('documents').upsert(documents);
}

async function seedSmartTags() {
  const smartTags = [
    { id: 1, document_id: 101, tag: 'tax' },
    { id: 2, document_id: 101, tag: 'finance' },
    { id: 3, document_id: 102, tag: 'prescription' },
    { id: 4, document_id: 102, tag: 'health' },
    { id: 5, document_id: 103, tag: 'degree' },
    { id: 6, document_id: 103, tag: 'education' },
  ];
  await supabase.from('smart_tags').upsert(smartTags);
}

async function seedDocumentVersions() {
  const versions = [
    { id: 1, document_id: 101, file_url: 'https://example.com/docs/tax2024_v1.pdf', version: 1, created_at: new Date().toISOString() },
    { id: 2, document_id: 101, file_url: 'https://example.com/docs/tax2024_v2.pdf', version: 2, created_at: new Date().toISOString() },
    { id: 3, document_id: 102, file_url: 'https://example.com/docs/prescription_v1.jpg', version: 1, created_at: new Date().toISOString() },
    { id: 4, document_id: 103, file_url: 'https://example.com/docs/degree_v1.pdf', version: 1, created_at: new Date().toISOString() },
  ];
  await supabase.from('document_versions').upsert(versions);
}

async function seedTimelineEvents() {
  const events = [
    { id: 1, document_id: 101, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 2, document_id: 101, event_type: 'versioned', description: 'Version 2 added', timestamp: new Date().toISOString() },
    { id: 3, document_id: 102, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
    { id: 4, document_id: 103, event_type: 'uploaded', description: 'Document uploaded', timestamp: new Date().toISOString() },
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
