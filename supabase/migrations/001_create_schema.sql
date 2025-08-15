-- Initial schema for DocuVault AI

-- Profiles table
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  path text,
  size bigint,
  mime_type text,
  status text default 'uploaded',
  processing_stage text,
  processing_error text,
  category text,
  tags text[],
  confidence numeric,
  ai_summary text,
  extracted_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat messages
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid references auth.users(id) on delete cascade,
  message text not null,
  is_user_message boolean default true,
  ai_model text,
  confidence_score numeric,
  related_document_ids uuid[],
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_documents_created_at on documents(created_at desc);

-- Basic RLS examples (enable and policies)
-- Enable row level security on documents
alter table documents enable row level security;

-- Policy: allow users to insert their own documents
create policy "insert_own_documents" on documents
  for insert
  with check (auth.uid() = user_id);

-- Policy: allow users to select their documents
create policy "select_own_documents" on documents
  for select
  using (auth.uid() = user_id);

-- Policy: allow updates by owner
create policy "update_own_documents" on documents
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Profiles RLS
alter table profiles enable row level security;
create policy "profiles_owner" on profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
