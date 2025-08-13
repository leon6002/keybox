# KeyBox Database Migration Guide

This guide will help you migrate your KeyBox project to use the new encrypted database schema based on Bitwarden's security architecture.

## 🚀 Quick Start

### Step 1: Run the Migration Script

```bash
cd keybox-app
node scripts/run-migrations.js
```

This will display the SQL migrations that need to be run in your Supabase database.

### Step 2: Apply Migrations in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor** (left sidebar)
4. Copy and paste the SQL from the migration script output
5. Run each migration in order:
   - First: `001_create_encrypted_schema.sql`
   - Second: `002_create_rls_policies.sql`

### Step 3: Verify the Setup

After running the migrations, verify that:
- All tables are created
- Row Level Security (RLS) is enabled
- Indexes are in place
- Functions and triggers are working

## 📋 What Gets Created

### 🗄️ Database Tables

| Table | Purpose | Encryption |
|-------|---------|------------|
| `keybox_users` | User accounts and authentication | ✅ Master password hash, user keys |
| `keybox_ciphers` | Password entries | ✅ All sensitive data encrypted |
| `keybox_folders` | Organization folders | ✅ Folder names encrypted |
| `keybox_collections` | Team collections | ✅ Collection names encrypted |
| `keybox_organizations` | Business accounts | ❌ Metadata only |
| `keybox_devices` | User devices | ❌ Device info only |
| `keybox_security_events` | Security audit log | ❌ Audit data |
| `keybox_backups` | Backup tracking (enhanced) | ✅ Backup metadata |

### 🔐 Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Field-level Encryption**: Sensitive fields use `KB|` prefix protection
- **Automatic Timestamps**: Created/updated timestamps with triggers
- **Security Logging**: Comprehensive audit trail
- **Failed Login Tracking**: Automatic account locking
- **Soft Delete**: Password entries can be recovered

### 📊 Utility Functions

- `log_security_event()` - Log security events
- `get_user_stats()` - Get user dashboard statistics
- `soft_delete_cipher()` - Soft delete password entries
- `restore_cipher()` - Restore deleted entries
- `cleanup_old_security_events()` - Clean up old audit logs
- `increment_failed_login_attempts()` - Track failed logins
- `reset_failed_login_attempts()` - Reset after successful login

## 🔧 Configuration

### Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Configuration

1. **Enable RLS**: All tables have Row Level Security enabled
2. **Authentication**: Configure your auth providers in Supabase dashboard
3. **Storage**: The existing `backups` bucket will continue to work
4. **API**: The anon key has proper permissions for the new schema

## 🧪 Testing the Migration

### 1. Test Database Connection

```typescript
import { supabase } from '@/lib/supabase';

// Test basic connection
const { data, error } = await supabase
  .from('keybox_users')
  .select('count')
  .limit(1);

console.log('Database connection:', error ? 'Failed' : 'Success');
```

### 2. Test User Creation

```typescript
import { SupabaseDatabaseConnection } from '@/lib/database/supabaseAdapter';

const db = new SupabaseDatabaseConnection({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

// Test user creation (this will be handled by your auth service)
```

### 3. Test Encryption

```typescript
import { SecurityServiceFactory } from '@/lib/security';

// Initialize security services
await SecurityServiceFactory.initializeServices();

// Test encryption
const cryptoService = SecurityServiceFactory.getCryptoService();
const testData = 'sensitive password data';
const key = cryptoService.generateKey();
const encrypted = await cryptoService.encrypt(testData, key);
const decrypted = await cryptoService.decrypt(encrypted, key);

console.log('Encryption test:', decrypted === testData ? 'Passed' : 'Failed');
```

## 🔄 Migration from Existing Data

If you have existing password data, you'll need to:

1. **Export existing data** using your current backup system
2. **Create a migration script** to convert old format to new encrypted format
3. **Import data** using the new security services

Example migration script structure:

```typescript
// scripts/migrate-existing-data.ts
import { SecurityServiceFactory } from '@/lib/security';
import { SupabaseDatabaseConnection } from '@/lib/database/supabaseAdapter';

async function migrateExistingData() {
  // 1. Load old data
  const oldData = await loadOldPasswordData();
  
  // 2. Initialize security services
  await SecurityServiceFactory.initializeServices();
  
  // 3. Create user and get keys
  const userKey = await createUserWithMasterPassword('user@example.com', 'master-password');
  
  // 4. Encrypt and store each password entry
  const vaultService = SecurityServiceFactory.getVaultService();
  
  for (const oldEntry of oldData) {
    const newEntry = convertOldToNewFormat(oldEntry);
    const encryptedCipher = await vaultService.encryptCipher(newEntry, userKey);
    await db.createCipher(encryptedCipher);
  }
}
```

## 🛡️ Security Considerations

### Data Protection

- All sensitive data is encrypted before storage
- Encryption keys are derived from user master passwords
- Database fields use prefixed protection (`KB|encrypted_data`)
- No plaintext passwords are ever stored

### Access Control

- Row Level Security ensures data isolation
- Users can only access their own data
- Admin functions require service key
- API access is controlled by Supabase policies

### Audit Trail

- All security events are logged
- Failed login attempts are tracked
- Password changes are recorded
- Data access is monitored

## 🚨 Troubleshooting

### Common Issues

1. **Migration fails with permission error**
   - Make sure you're using the correct Supabase project
   - Check that your API keys are valid
   - Verify you have admin access to the project

2. **RLS policies block data access**
   - Ensure user is properly authenticated
   - Check that `auth.uid()` returns the correct user ID
   - Verify RLS policies match your authentication setup

3. **Encryption/decryption errors**
   - Check that security services are properly initialized
   - Verify master password is correct
   - Ensure encryption keys are properly derived

4. **Performance issues**
   - Check that all indexes are created
   - Monitor query performance in Supabase dashboard
   - Consider adding additional indexes for your specific use case

### Getting Help

1. Check the console for detailed error messages
2. Review Supabase logs in the dashboard
3. Test individual components in isolation
4. Verify environment variables are correct

## 📚 Next Steps

After successful migration:

1. **Update your application code** to use the new security services
2. **Test all functionality** with encrypted data
3. **Set up monitoring** for security events
4. **Configure backup schedules** for encrypted data
5. **Train users** on any new security features

## 🎉 Success!

Once migration is complete, your KeyBox application will have:

- ✅ Enterprise-grade encryption
- ✅ Zero-knowledge architecture
- ✅ Comprehensive security audit trail
- ✅ Bitwarden-level security standards
- ✅ Scalable multi-user support
- ✅ Secure backup and recovery

Your password manager now provides the same level of security as leading commercial solutions!
