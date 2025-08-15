-- Create users in public.users table to match existing seed data
-- This ensures that document uploads can reference the correct user_id

-- Insert users that correspond to the auth.users in our seed data
INSERT INTO public.users (id, auth_user_id, email, full_name, display_name) VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John Doe', 'John'),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', 'Jane Smith', 'Jane'),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'raj.patel@example.com', 'Raj Patel', 'Raj'),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'priya.sharma@example.com', 'Priya Sharma', 'Priya'),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'amit.kumar@example.com', 'Amit Kumar', 'Amit')
ON CONFLICT (id) DO NOTHING;

-- Also add them to the auth.users table for authentication (for development)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'raj.patel@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'priya.sharma@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'amit.kumar@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
