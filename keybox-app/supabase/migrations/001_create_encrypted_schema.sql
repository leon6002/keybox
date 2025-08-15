-- KeyBox Encrypted Database Schema for Supabase
-- Based on Bitwarden's security architecture with encrypted field protection
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with encrypted authentication data
CREATE TABLE IF NOT EXISTS keybox_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    
    -- Authentication fields (encrypted with data protection)
    master_password_hash TEXT NOT NULL,
    kdf_type INTEGER NOT NULL DEFAULT 0,
    kdf_iterations INTEGER NOT NULL DEFAULT 600000,
    kdf_memory INTEGER,
    kdf_parallelism INTEGER,
    kdf_salt TEXT NOT NULL,
    
    -- Key management (encrypted)
    user_key TEXT NOT NULL,
    private_key TEXT,
    public_key TEXT,
    
    -- Security settings
    security_settings JSONB NOT NULL DEFAULT '{}',
    
    -- Account management
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    last_password_change_at TIMESTAMPTZ,
    
    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ
);

-- Ciphers table for encrypted password entries
CREATE TABLE IF NOT EXISTS keybox_ciphers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES keybox_users(id) ON DELETE CASCADE,
    organization_id UUID,
    
    -- Cipher metadata
    type INTEGER NOT NULL DEFAULT 0,
    folder_id UUID,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    reprompt INTEGER NOT NULL DEFAULT 0,
    
    -- Encrypted fields (protected with KB| prefix)
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    notes TEXT,
    key TEXT,
    
    -- Attachments metadata
    attachments JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    revision_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Folders table for organizing ciphers
CREATE TABLE IF NOT EXISTS keybox_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES keybox_users(id) ON DELETE CASCADE,
    
    -- Encrypted fields
    name TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collections table for organization-level grouping
CREATE TABLE IF NOT EXISTS keybox_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    
    -- Encrypted fields
    name TEXT NOT NULL,
    
    -- Access control
    read_only BOOLEAN NOT NULL DEFAULT FALSE,
    hide_passwords BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations table for team/business features
CREATE TABLE IF NOT EXISTS keybox_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    business_name TEXT,
    
    -- Billing
    plan_type INTEGER NOT NULL DEFAULT 0,
    seats INTEGER NOT NULL DEFAULT 1,
    max_collections INTEGER NOT NULL DEFAULT 2,
    max_storage_gb INTEGER NOT NULL DEFAULT 1,
    
    -- Settings
    use_groups BOOLEAN NOT NULL DEFAULT FALSE,
    use_directory BOOLEAN NOT NULL DEFAULT FALSE,
    use_events BOOLEAN NOT NULL DEFAULT FALSE,
    use_totp BOOLEAN NOT NULL DEFAULT FALSE,
    use_2fa BOOLEAN NOT NULL DEFAULT FALSE,
    use_api BOOLEAN NOT NULL DEFAULT FALSE,
    self_host BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Devices table for tracking user devices
CREATE TABLE IF NOT EXISTS keybox_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES keybox_users(id) ON DELETE CASCADE,
    
    -- Device info
    name TEXT NOT NULL,
    type INTEGER NOT NULL DEFAULT 0,
    identifier TEXT UNIQUE NOT NULL,
    
    -- Push notifications
    push_token TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Security events table for audit logging
CREATE TABLE IF NOT EXISTS keybox_security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES keybox_users(id) ON DELETE CASCADE,
    organization_id UUID,
    
    -- Event details
    type TEXT NOT NULL,
    details JSONB NOT NULL,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    device_id UUID,
    
    -- Timestamp
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update the existing keybox_backups table to match new schema
-- (Keep existing data but add new columns if needed)
ALTER TABLE keybox_backups 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS encryption_method TEXT DEFAULT 'AES-GCM-256';

-- Create indexes for performance optimization

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_keybox_users_email ON keybox_users (email);
CREATE INDEX IF NOT EXISTS idx_keybox_users_created_at ON keybox_users (created_at);
CREATE INDEX IF NOT EXISTS idx_keybox_users_last_login_at ON keybox_users (last_login_at);
CREATE INDEX IF NOT EXISTS idx_keybox_users_is_active ON keybox_users (is_active);

-- Ciphers indexes
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_user_id ON keybox_ciphers (user_id);
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_organization_id ON keybox_ciphers (organization_id);
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_folder_id ON keybox_ciphers (folder_id);
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_type ON keybox_ciphers (type);
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_favorite ON keybox_ciphers (favorite);
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_deleted_at ON keybox_ciphers (deleted_at);
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_revision_date ON keybox_ciphers (revision_date);
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_user_id_type ON keybox_ciphers (user_id, type);
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_user_id_favorite ON keybox_ciphers (user_id, favorite);
CREATE INDEX IF NOT EXISTS idx_keybox_ciphers_user_id_deleted_at ON keybox_ciphers (user_id, deleted_at);

-- Folders indexes
CREATE INDEX IF NOT EXISTS idx_keybox_folders_user_id ON keybox_folders (user_id);
CREATE INDEX IF NOT EXISTS idx_keybox_folders_created_at ON keybox_folders (created_at);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_keybox_collections_organization_id ON keybox_collections (organization_id);
CREATE INDEX IF NOT EXISTS idx_keybox_collections_created_at ON keybox_collections (created_at);

-- Devices indexes
CREATE INDEX IF NOT EXISTS idx_keybox_devices_user_id ON keybox_devices (user_id);
CREATE INDEX IF NOT EXISTS idx_keybox_devices_identifier ON keybox_devices (identifier);
CREATE INDEX IF NOT EXISTS idx_keybox_devices_last_seen_at ON keybox_devices (last_seen_at);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_keybox_security_events_user_id ON keybox_security_events (user_id);
CREATE INDEX IF NOT EXISTS idx_keybox_security_events_organization_id ON keybox_security_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_keybox_security_events_type ON keybox_security_events (type);
CREATE INDEX IF NOT EXISTS idx_keybox_security_events_timestamp ON keybox_security_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_keybox_security_events_user_id_timestamp ON keybox_security_events (user_id, timestamp);

-- Backups indexes (for existing table)
CREATE INDEX IF NOT EXISTS idx_keybox_backups_user_id_created_at ON keybox_backups (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_keybox_backups_backup_type ON keybox_backups (backup_type);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_keybox_users_updated_at 
    BEFORE UPDATE ON keybox_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keybox_ciphers_updated_at 
    BEFORE UPDATE ON keybox_ciphers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keybox_ciphers_revision_date 
    BEFORE UPDATE ON keybox_ciphers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keybox_folders_updated_at 
    BEFORE UPDATE ON keybox_folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keybox_collections_updated_at 
    BEFORE UPDATE ON keybox_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keybox_organizations_updated_at 
    BEFORE UPDATE ON keybox_organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keybox_devices_updated_at 
    BEFORE UPDATE ON keybox_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions table for payment management
CREATE TABLE IF NOT EXISTS keybox_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES keybox_users(id) ON DELETE CASCADE,

    -- Polar subscription details
    polar_customer_id TEXT,
    polar_subscription_id TEXT,
    polar_product_id TEXT,

    -- Subscription status
    status TEXT NOT NULL DEFAULT 'inactive', -- active, inactive, canceled, past_due
    plan_type TEXT NOT NULL DEFAULT 'free', -- free, pro, enterprise

    -- Billing details
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,

    -- Premium features
    premium_features JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Indexes
    UNIQUE(user_id)
);

-- Payment events table for audit trail
CREATE TABLE IF NOT EXISTS keybox_payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES keybox_users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES keybox_subscriptions(id) ON DELETE CASCADE,

    -- Event details
    event_type TEXT NOT NULL, -- order_created, order_paid, subscription_created, etc.
    polar_event_id TEXT,

    -- Event data
    event_data JSONB NOT NULL DEFAULT '{}',
    processed BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_keybox_subscriptions_user_id ON keybox_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_keybox_subscriptions_status ON keybox_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_keybox_subscriptions_polar_customer_id ON keybox_subscriptions (polar_customer_id);
CREATE INDEX IF NOT EXISTS idx_keybox_subscriptions_current_period_end ON keybox_subscriptions (current_period_end);

-- Payment events indexes
CREATE INDEX IF NOT EXISTS idx_keybox_payment_events_user_id ON keybox_payment_events (user_id);
CREATE INDEX IF NOT EXISTS idx_keybox_payment_events_subscription_id ON keybox_payment_events (subscription_id);
CREATE INDEX IF NOT EXISTS idx_keybox_payment_events_event_type ON keybox_payment_events (event_type);
CREATE INDEX IF NOT EXISTS idx_keybox_payment_events_created_at ON keybox_payment_events (created_at);

-- Subscription triggers
CREATE TRIGGER update_keybox_subscriptions_updated_at
    BEFORE UPDATE ON keybox_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE keybox_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE keybox_ciphers ENABLE ROW LEVEL SECURITY;
ALTER TABLE keybox_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE keybox_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE keybox_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE keybox_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE keybox_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE keybox_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE keybox_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keybox_payment_events ENABLE ROW LEVEL SECURITY;
