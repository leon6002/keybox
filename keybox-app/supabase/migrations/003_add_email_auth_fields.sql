-- Add email authentication fields to keybox_users table
-- This migration adds support for email/password authentication alongside Google OAuth

-- Add email verification fields
ALTER TABLE keybox_users 
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Make master_password_hash optional for email users who haven't set up encryption yet
ALTER TABLE keybox_users 
ALTER COLUMN master_password_hash DROP NOT NULL;

-- Make kdf_salt optional for email users who haven't set up encryption yet
ALTER TABLE keybox_users 
ALTER COLUMN kdf_salt DROP NOT NULL;

-- Make user_key optional for email users who haven't set up encryption yet
ALTER TABLE keybox_users 
ALTER COLUMN user_key DROP NOT NULL;

-- Add indexes for email verification
CREATE INDEX IF NOT EXISTS idx_keybox_users_verification_code ON keybox_users (verification_code);
CREATE INDEX IF NOT EXISTS idx_keybox_users_verification_expires_at ON keybox_users (verification_expires_at);
CREATE INDEX IF NOT EXISTS idx_keybox_users_email_verified ON keybox_users (email_verified);

-- Add a function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    UPDATE keybox_users 
    SET verification_code = NULL, 
        verification_expires_at = NULL
    WHERE verification_expires_at < NOW() 
    AND verification_code IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired codes (run every hour)
-- Note: This requires pg_cron extension which may not be available in all Supabase plans
-- You can also run this manually or via a cron job from your application
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes();');

-- Add comments for documentation
COMMENT ON COLUMN keybox_users.verification_code IS 'Email verification code for new registrations';
COMMENT ON COLUMN keybox_users.verification_expires_at IS 'Expiration timestamp for verification code';
COMMENT ON COLUMN keybox_users.password_hash IS 'Hashed password for email authentication (separate from master password)';
COMMENT ON COLUMN keybox_users.master_password_hash IS 'Master password hash for vault encryption (optional until encryption setup)';
COMMENT ON COLUMN keybox_users.email_verified IS 'Whether the user has verified their email address';

-- Update the trigger to also update revision_date for ciphers
CREATE OR REPLACE FUNCTION update_cipher_revision_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.revision_date = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Replace the existing revision_date trigger with the new function
DROP TRIGGER IF EXISTS update_keybox_ciphers_revision_date ON keybox_ciphers;
CREATE TRIGGER update_keybox_ciphers_revision_date 
    BEFORE UPDATE ON keybox_ciphers 
    FOR EACH ROW EXECUTE FUNCTION update_cipher_revision_date();
