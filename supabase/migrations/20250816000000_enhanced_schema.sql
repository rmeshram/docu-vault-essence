-- User profiles and subscription management
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'Free' CHECK (subscription_tier IN ('Free', 'Premium', 'Family Plus', 'Business')),
  storage_used_mb BIGINT DEFAULT 0,
  storage_limit_mb BIGINT DEFAULT 5000, -- 5GB for free tier
  ai_queries_used INTEGER DEFAULT 0,
  ai_queries_limit INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family vault management
CREATE TABLE IF NOT EXISTS public.family_vaults (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT DEFAULT 'Family Vault',
  total_storage_mb BIGINT DEFAULT 200000, -- 200GB for family
  used_storage_mb BIGINT DEFAULT 0,
  member_limit INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family members and permissions
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_vault_id UUID REFERENCES public.family_vaults(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'emergency')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  permissions JSONB DEFAULT '{
    "can_upload": true,
    "can_share": true,
    "can_edit": false,
    "can_delete": false,
    "can_invite": false
  }',
  storage_used_mb BIGINT DEFAULT 0,
  document_count INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ
);

-- Family invitations
CREATE TABLE IF NOT EXISTS public.family_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_vault_id UUID REFERENCES public.family_vaults(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  token UUID DEFAULT gen_random_uuid() UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document relationships and linking
CREATE TABLE IF NOT EXISTS public.document_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document1_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  document2_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  relationship_type TEXT CHECK (relationship_type IN ('parent-child', 'related', 'version', 'duplicate')),
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document1_id, document2_id, relationship_type)
);

-- Family activity log
CREATE TABLE IF NOT EXISTS public.family_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_vault_id UUID REFERENCES public.family_vaults(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT CHECK (activity_type IN ('upload', 'share', 'edit', 'delete', 'invite', 'join')),
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics and insights tracking
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  reminder_notifications BOOLEAN DEFAULT true,
  family_notifications BOOLEAN DEFAULT true,
  ai_insights_notifications BOOLEAN DEFAULT true,
  marketing_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription and billing
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT CHECK (tier IN ('Free', 'Premium', 'Family Plus', 'Business')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  payment_method JSONB,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Professional services marketplace
CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('ca', 'lawyer', 'doctor', 'insurance_agent', 'financial_advisor')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  specializations TEXT[],
  bio TEXT,
  experience_years INTEGER,
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  availability JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  verification_documents JSONB DEFAULT '[]',
  languages TEXT[] DEFAULT ARRAY['English', 'Hindi'],
  location JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Professional service bookings
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id),
  professional_id UUID REFERENCES public.professionals(id),
  service_type TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review and ratings for professionals
CREATE TABLE IF NOT EXISTS public.professional_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id),
  booking_id UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_priority ON public.ai_insights(priority);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON public.reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_family_members_vault ON public.family_members(family_vault_id);
CREATE INDEX IF NOT EXISTS idx_family_activities_vault ON public.family_activities(family_vault_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view/edit own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own family vaults" ON public.family_vaults
  FOR ALL USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (SELECT user_id FROM public.family_members WHERE family_vault_id = id)
  );

CREATE POLICY "Family members can view family data" ON public.family_members
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT owner_id FROM public.family_vaults WHERE id = family_vault_id
    )
  );

CREATE POLICY "Users can view own insights" ON public.ai_insights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reminders" ON public.reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own documents" ON public.documents
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT fm.user_id FROM public.family_members fm
      JOIN public.family_vaults fv ON fm.family_vault_id = fv.id
      WHERE fv.owner_id = documents.user_id
    )
  );

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_vaults_updated_at BEFORE UPDATE ON public.family_vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
