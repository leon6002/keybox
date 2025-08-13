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
CREATE TABLE IF NOT EXISTS ciphers (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    organizationId TEXT,
    
    -- Cipher metadata
    type INTEGER NOT NULL DEFAULT 0,
    folderId TEXT,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    reprompt INTEGER NOT NULL DEFAULT 0,
    
    -- Encrypted fields (protected with KB| prefix)
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    notes TEXT,
    key TEXT,
    
    -- Attachments metadata
    attachments TEXT,
    
    -- Timestamps
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT,
    revisionDate TEXT NOT NULL,
    
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);

-- Folders table for organizing ciphers
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    
    -- Encrypted fields
    name TEXT NOT NULL,
    
    -- Timestamps
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);

-- Collections table for organization-level grouping
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    organizationId TEXT,
    
    -- Encrypted fields
    name TEXT NOT NULL,
    
    -- Access control
    readOnly BOOLEAN NOT NULL DEFAULT FALSE,
    hidePasswords BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

-- Organizations table for team/business features
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    businessName TEXT,
    
    -- Billing
    planType INTEGER NOT NULL DEFAULT 0,
    seats INTEGER NOT NULL DEFAULT 1,
    maxCollections INTEGER NOT NULL DEFAULT 2,
    maxStorageGb INTEGER NOT NULL DEFAULT 1,
    
    -- Settings
    useGroups BOOLEAN NOT NULL DEFAULT FALSE,
    useDirectory BOOLEAN NOT NULL DEFAULT FALSE,
    useEvents BOOLEAN NOT NULL DEFAULT FALSE,
    useTotp BOOLEAN NOT NULL DEFAULT FALSE,
    use2fa BOOLEAN NOT NULL DEFAULT FALSE,
    useApi BOOLEAN NOT NULL DEFAULT FALSE,
    selfHost BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

-- Devices table for tracking user devices
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    
    -- Device info
    name TEXT NOT NULL,
    type INTEGER NOT NULL DEFAULT 0,
    identifier TEXT UNIQUE NOT NULL,
    
    -- Push notifications
    pushToken TEXT,
    
    -- Timestamps
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastSeenAt TEXT NOT NULL,
    
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);

-- Security events table for audit logging
CREATE TABLE IF NOT EXISTS securityEvents (
    id TEXT PRIMARY KEY,
    userId TEXT,
    organizationId TEXT,
    
    -- Event details
    type TEXT NOT NULL,
    details TEXT NOT NULL,
    
    -- Context
    ipAddress TEXT,
    userAgent TEXT,
    deviceId TEXT,
    
    -- Timestamp
    timestamp TEXT NOT NULL
);

-- Backups table for tracking backup files
CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    
    -- Backup metadata
    filename TEXT NOT NULL,
    filePath TEXT NOT NULL,
    backupType TEXT NOT NULL CHECK (backupType IN ('auto', 'manual')),
    versionName TEXT,
    fileSize INTEGER NOT NULL,
    
    -- Encryption info
    isEncrypted BOOLEAN NOT NULL DEFAULT TRUE,
    encryptionMethod TEXT,
    
    -- Timestamps
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);

-- Create indexes for performance optimization

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_createdAt ON users (createdAt);
CREATE INDEX IF NOT EXISTS idx_users_lastLoginAt ON users (lastLoginAt);
CREATE INDEX IF NOT EXISTS idx_users_isActive ON users (isActive);

-- Ciphers indexes
CREATE INDEX IF NOT EXISTS idx_ciphers_userId ON ciphers (userId);
CREATE INDEX IF NOT EXISTS idx_ciphers_organizationId ON ciphers (organizationId);
CREATE INDEX IF NOT EXISTS idx_ciphers_folderId ON ciphers (folderId);
CREATE INDEX IF NOT EXISTS idx_ciphers_type ON ciphers (type);
CREATE INDEX IF NOT EXISTS idx_ciphers_favorite ON ciphers (favorite);
CREATE INDEX IF NOT EXISTS idx_ciphers_deletedAt ON ciphers (deletedAt);
CREATE INDEX IF NOT EXISTS idx_ciphers_revisionDate ON ciphers (revisionDate);
CREATE INDEX IF NOT EXISTS idx_ciphers_userId_type ON ciphers (userId, type);
CREATE INDEX IF NOT EXISTS idx_ciphers_userId_favorite ON ciphers (userId, favorite);
CREATE INDEX IF NOT EXISTS idx_ciphers_userId_deletedAt ON ciphers (userId, deletedAt);

-- Folders indexes
CREATE INDEX IF NOT EXISTS idx_folders_userId ON folders (userId);
CREATE INDEX IF NOT EXISTS idx_folders_createdAt ON folders (createdAt);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_organizationId ON collections (organizationId);
CREATE INDEX IF NOT EXISTS idx_collections_createdAt ON collections (createdAt);

-- Devices indexes
CREATE INDEX IF NOT EXISTS idx_devices_userId ON devices (userId);
CREATE INDEX IF NOT EXISTS idx_devices_identifier ON devices (identifier);
CREATE INDEX IF NOT EXISTS idx_devices_lastSeenAt ON devices (lastSeenAt);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_securityEvents_userId ON securityEvents (userId);
CREATE INDEX IF NOT EXISTS idx_securityEvents_organizationId ON securityEvents (organizationId);
CREATE INDEX IF NOT EXISTS idx_securityEvents_type ON securityEvents (type);
CREATE INDEX IF NOT EXISTS idx_securityEvents_timestamp ON securityEvents (timestamp);
CREATE INDEX IF NOT EXISTS idx_securityEvents_userId_timestamp ON securityEvents (userId, timestamp);

-- Backups indexes
CREATE INDEX IF NOT EXISTS idx_backups_userId ON backups (userId);
CREATE INDEX IF NOT EXISTS idx_backups_backupType ON backups (backupType);
CREATE INDEX IF NOT EXISTS idx_backups_createdAt ON backups (createdAt);
CREATE INDEX IF NOT EXISTS idx_backups_userId_createdAt ON backups (userId, createdAt);

-- Insert migration record
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    appliedAt TEXT NOT NULL
);

INSERT OR IGNORE INTO migrations (version, description, appliedAt) 
VALUES ('001', 'Initial encrypted schema with Bitwarden-style security', datetime('now'));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_users_updatedAt 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_ciphers_updatedAt 
    AFTER UPDATE ON ciphers
    FOR EACH ROW
    BEGIN
        UPDATE ciphers SET updatedAt = datetime('now'), revisionDate = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_folders_updatedAt 
    AFTER UPDATE ON folders
    FOR EACH ROW
    BEGIN
        UPDATE folders SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_collections_updatedAt 
    AFTER UPDATE ON collections
    FOR EACH ROW
    BEGIN
        UPDATE collections SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_organizations_updatedAt 
    AFTER UPDATE ON organizations
    FOR EACH ROW
    BEGIN
        UPDATE organizations SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_devices_updatedAt 
    AFTER UPDATE ON devices
    FOR EACH ROW
    BEGIN
        UPDATE devices SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_backups_updatedAt 
    AFTER UPDATE ON backups
    FOR EACH ROW
    BEGIN
        UPDATE backups SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;
