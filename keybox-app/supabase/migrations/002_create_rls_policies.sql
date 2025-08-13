-- Row Level Security (RLS) Policies for KeyBox
-- Ensures users can only access their own data
-- Run this AFTER the schema creation

-- Users table policies
-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON keybox_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON keybox_users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON keybox_users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Ciphers table policies
-- Users can manage their own ciphers
CREATE POLICY "Users can view own ciphers" ON keybox_ciphers
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own ciphers" ON keybox_ciphers
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own ciphers" ON keybox_ciphers
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own ciphers" ON keybox_ciphers
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Folders table policies
-- Users can manage their own folders
CREATE POLICY "Users can view own folders" ON keybox_folders
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own folders" ON keybox_folders
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own folders" ON keybox_folders
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own folders" ON keybox_folders
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Collections table policies (for future organization features)
-- For now, allow authenticated users to manage collections
CREATE POLICY "Authenticated users can view collections" ON keybox_collections
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage collections" ON keybox_collections
    FOR ALL USING (auth.role() = 'authenticated');

-- Organizations table policies (for future team features)
-- For now, allow authenticated users to view organizations
CREATE POLICY "Authenticated users can view organizations" ON keybox_organizations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Devices table policies
-- Users can manage their own devices
CREATE POLICY "Users can view own devices" ON keybox_devices
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own devices" ON keybox_devices
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own devices" ON keybox_devices
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own devices" ON keybox_devices
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Security events table policies
-- Users can view their own security events (read-only)
CREATE POLICY "Users can view own security events" ON keybox_security_events
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- System can insert security events for any user
CREATE POLICY "System can insert security events" ON keybox_security_events
    FOR INSERT WITH CHECK (true);

-- Backups table policies (update existing table)
-- Users can manage their own backups
CREATE POLICY "Users can view own backups" ON keybox_backups
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own backups" ON keybox_backups
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own backups" ON keybox_backups
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own backups" ON keybox_backups
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create a function to get the current user's ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    event_type TEXT,
    event_details JSONB DEFAULT '{}',
    target_user_id UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_str TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO keybox_security_events (
        user_id,
        type,
        details,
        ip_address,
        user_agent
    ) VALUES (
        COALESCE(target_user_id, auth.uid()),
        event_type,
        event_details,
        ip_addr,
        user_agent_str
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clean up old security events
CREATE OR REPLACE FUNCTION cleanup_old_security_events(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM keybox_security_events 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    user_id UUID;
    stats JSON;
BEGIN
    user_id := COALESCE(target_user_id, auth.uid());
    
    SELECT json_build_object(
        'total_ciphers', (
            SELECT COUNT(*) FROM keybox_ciphers 
            WHERE user_id = get_user_stats.user_id AND deleted_at IS NULL
        ),
        'favorite_ciphers', (
            SELECT COUNT(*) FROM keybox_ciphers 
            WHERE user_id = get_user_stats.user_id AND favorite = true AND deleted_at IS NULL
        ),
        'total_folders', (
            SELECT COUNT(*) FROM keybox_folders 
            WHERE user_id = get_user_stats.user_id
        ),
        'total_backups', (
            SELECT COUNT(*) FROM keybox_backups 
            WHERE user_id = get_user_stats.user_id
        ),
        'last_login', (
            SELECT last_login_at FROM keybox_users 
            WHERE id = get_user_stats.user_id
        ),
        'account_created', (
            SELECT created_at FROM keybox_users 
            WHERE id = get_user_stats.user_id
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to soft delete ciphers
CREATE OR REPLACE FUNCTION soft_delete_cipher(cipher_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE keybox_ciphers 
    SET deleted_at = NOW(), updated_at = NOW(), revision_date = NOW()
    WHERE id = cipher_id AND user_id = auth.uid() AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to restore soft deleted ciphers
CREATE OR REPLACE FUNCTION restore_cipher(cipher_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE keybox_ciphers 
    SET deleted_at = NULL, updated_at = NOW(), revision_date = NOW()
    WHERE id = cipher_id AND user_id = auth.uid() AND deleted_at IS NOT NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to permanently delete old soft-deleted ciphers
CREATE OR REPLACE FUNCTION cleanup_deleted_ciphers(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM keybox_ciphers 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND user_id = auth.uid();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update user last login
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS VOID AS $$
BEGIN
    UPDATE keybox_users 
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to increment failed login attempts
CREATE OR REPLACE FUNCTION increment_failed_login_attempts(user_email TEXT)
RETURNS VOID AS $$
DECLARE
    max_attempts INTEGER := 5;
    lockout_duration INTERVAL := '15 minutes';
BEGIN
    UPDATE keybox_users 
    SET 
        failed_login_attempts = failed_login_attempts + 1,
        is_locked = CASE 
            WHEN failed_login_attempts + 1 >= max_attempts THEN true 
            ELSE is_locked 
        END,
        locked_until = CASE 
            WHEN failed_login_attempts + 1 >= max_attempts THEN NOW() + lockout_duration
            ELSE locked_until 
        END,
        updated_at = NOW()
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to reset failed login attempts
CREATE OR REPLACE FUNCTION reset_failed_login_attempts()
RETURNS VOID AS $$
BEGIN
    UPDATE keybox_users 
    SET 
        failed_login_attempts = 0,
        is_locked = false,
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for active ciphers (non-deleted)
CREATE OR REPLACE VIEW keybox_active_ciphers AS
SELECT * FROM keybox_ciphers 
WHERE deleted_at IS NULL;

-- Create a view for user dashboard statistics
CREATE OR REPLACE VIEW keybox_user_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.created_at as account_created,
    u.last_login_at,
    (SELECT COUNT(*) FROM keybox_ciphers c WHERE c.user_id = u.id AND c.deleted_at IS NULL) as total_passwords,
    (SELECT COUNT(*) FROM keybox_ciphers c WHERE c.user_id = u.id AND c.favorite = true AND c.deleted_at IS NULL) as favorite_passwords,
    (SELECT COUNT(*) FROM keybox_folders f WHERE f.user_id = u.id) as total_folders,
    (SELECT COUNT(*) FROM keybox_backups b WHERE b.user_id = u.id) as total_backups,
    (SELECT MAX(revision_date) FROM keybox_ciphers c WHERE c.user_id = u.id) as last_password_update
FROM keybox_users u;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
