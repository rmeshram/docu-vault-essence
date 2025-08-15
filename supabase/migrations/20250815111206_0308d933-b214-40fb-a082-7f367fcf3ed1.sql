-- Create ENUM types first
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS professional_type CASCADE;
DROP TYPE IF EXISTS relationship_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS family_role CASCADE;
DROP TYPE IF EXISTS family_status CASCADE;

CREATE TYPE user_role AS ENUM ('user', 'family_admin', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'family_plus', 'business');
CREATE TYPE document_status AS ENUM ('uploading', 'processing', 'completed', 'error');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE professional_type AS ENUM ('ca', 'lawyer', 'financial_advisor', 'insurance_agent', 'tax_consultant');
CREATE TYPE relationship_type AS ENUM ('similar', 'related', 'duplicate', 'version');
CREATE TYPE notification_type AS ENUM ('reminder', 'expiry', 'sharing', 'payment', 'system');
CREATE TYPE family_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE family_status AS ENUM ('pending', 'accepted', 'rejected', 'suspended');

-- Also use the existing document_category and urgency_level from the current schema