-- Create all tables from scratch in proper order
-- Drop all existing tables first
DROP TABLE IF EXISTS public.document_relationships CASCADE;
DROP TABLE IF EXISTS public.summaries CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.marketplace_templates CASCADE;
DROP TABLE IF EXISTS public.compliance_reports CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;
DROP TABLE IF EXISTS public.professionals CASCADE;
DROP TABLE IF EXISTS public.family_members CASCADE;
DROP TABLE IF EXISTS public.family_vaults CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.document_shares CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create helper functions first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create users table first (independent)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    tier subscription_tier DEFAULT 'free',
    language_preference TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    mfa_enabled BOOLEAN DEFAULT false,
    biometric_token TEXT,
    last_login_at TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create family vaults (references users)
CREATE TABLE public.family_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE,
    storage_limit BIGINT DEFAULT 107374182400,
    storage_used BIGINT DEFAULT 0,
    member_limit INTEGER DEFAULT 10,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create documents table (references users and family_vaults)
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    family_id UUID REFERENCES public.family_vaults(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    original_filename TEXT,
    file_path TEXT,
    file_type TEXT,
    file_size BIGINT,
    category document_category,
    status document_status DEFAULT 'uploading',
    is_encrypted BOOLEAN DEFAULT true,
    encryption_key_id TEXT,
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    extracted_text TEXT,
    ocr_confidence DECIMAL(5,2),
    ai_summary TEXT,
    ai_tags TEXT[],
    vector_embedding VECTOR(1536),
    language_detected TEXT,
    page_count INTEGER,
    thumbnail_url TEXT,
    expiry_date DATE,
    is_sensitive BOOLEAN DEFAULT false,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create all other tables
CREATE TABLE public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID REFERENCES public.family_vaults(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT,
    role family_role DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    status family_status DEFAULT 'pending',
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(vault_id, user_id),
    UNIQUE(vault_id, email)
);

CREATE TABLE public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type professional_type NOT NULL,
    verified BOOLEAN DEFAULT false,
    license_number TEXT,
    experience_years INTEGER,
    specializations TEXT[],
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    currency TEXT DEFAULT 'INR',
    profile_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    verification_documents JSONB,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.marketplace_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    template_data JSONB NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.document_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id1 UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    doc_id2 UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    relationship_type relationship_type NOT NULL,
    similarity_score DECIMAL(5,4),
    confidence DECIMAL(5,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(doc_id1, doc_id2, relationship_type)
);

CREATE TABLE public.summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    summary_text TEXT NOT NULL,
    key_info JSONB DEFAULT '{}',
    language TEXT DEFAULT 'en',
    ai_model TEXT,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'New Conversation',
    context_document_ids UUID[] DEFAULT '{}',
    messages JSONB DEFAULT '[]',
    total_tokens INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    period TEXT NOT NULL,
    metrics JSONB NOT NULL,
    insights JSONB DEFAULT '{}',
    generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    tier subscription_tier NOT NULL,
    storage_limit BIGINT NOT NULL,
    features JSONB DEFAULT '{}',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT true,
    stripe_subscription_id TEXT,
    razorpay_subscription_id TEXT,
    payment_status payment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT,
    gateway TEXT,
    gateway_transaction_id TEXT,
    status payment_status DEFAULT 'pending',
    gateway_response JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    document_ids UUID[] DEFAULT '{}',
    report_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    generated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    shared_with_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    shared_with_email TEXT,
    share_token TEXT UNIQUE,
    permission_level TEXT DEFAULT 'view',
    expires_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    password_protected BOOLEAN DEFAULT false,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_family_id ON public.documents(family_id);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_reminders_user_event ON public.reminders(user_id, event_date);
CREATE INDEX idx_analytics_user_type_period ON public.analytics(user_id, type, period);
CREATE INDEX idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at);