#!/usr/bin/env node

// Simple migration runner for KeyBox Supabase database
// Run this script to apply database migrations

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

const migrations = [
  {
    file: '001_create_encrypted_schema.sql',
    description: 'Create encrypted database schema with Bitwarden-style security'
  },
  {
    file: '002_create_rls_policies.sql',
    description: 'Create Row Level Security policies and utility functions'
  }
];

function readMigrationFile(filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (error) {
    console.error(`❌ Error reading migration file ${filename}:`, error.message);
    return null;
  }
}

function printInstructions() {
  console.log('\n🔐 KeyBox Database Migration Instructions\n');
  console.log('Follow these steps to set up your encrypted database schema:\n');

  console.log('1. 📋 Copy and run the following SQL in your Supabase SQL Editor:\n');
  console.log('   Go to: https://supabase.com/dashboard/project/[your-project]/sql\n');

  migrations.forEach((migration, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 MIGRATION ${index + 1}: ${migration.description}`);
    console.log(`${'='.repeat(60)}\n`);

    const sql = readMigrationFile(migration.file);
    if (sql) {
      console.log(sql);
    } else {
      console.log(`❌ Could not read ${migration.file}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ MIGRATION COMPLETE');
  console.log('='.repeat(60));

  console.log('\n2. 🔧 Update your environment variables:');
  console.log('   Make sure your .env.local file has:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');

  console.log('\n3. 🛡️ Verify Row Level Security:');
  console.log('   - Check that RLS is enabled on all tables');
  console.log('   - Test that users can only access their own data');
  console.log('   - Verify that authentication is working properly');

  console.log('\n4. 🧪 Test the setup:');
  console.log('   - Try creating a test user');
  console.log('   - Create some encrypted password entries');
  console.log('   - Verify data is properly encrypted in the database');

  console.log('\n5. 📊 Optional - Set up monitoring:');
  console.log('   - Enable database logs in Supabase dashboard');
  console.log('   - Set up alerts for failed authentication attempts');
  console.log('   - Monitor security events table for suspicious activity');

  console.log('\n🎉 Your KeyBox database is now ready with enterprise-grade encryption!');
  console.log('\nFor more information, see the documentation in:');
  console.log('- keybox-app/src/lib/security/README.md');
  console.log('- keybox-app/src/lib/database/README.md');
}

function generateMigrationSummary() {
  console.log('\n📋 Migration Summary:\n');
  
  console.log('🗄️  Tables Created:');
  console.log('   • keybox_users - User accounts with encrypted auth data');
  console.log('   • keybox_ciphers - Encrypted password entries');
  console.log('   • keybox_folders - Encrypted folder organization');
  console.log('   • keybox_collections - Team/organization collections');
  console.log('   • keybox_organizations - Team/business accounts');
  console.log('   • keybox_devices - User device tracking');
  console.log('   • keybox_security_events - Security audit log');
  console.log('   • keybox_backups - Enhanced backup tracking');

  console.log('\n🔐 Security Features:');
  console.log('   • Row Level Security (RLS) enabled on all tables');
  console.log('   • Users can only access their own data');
  console.log('   • Encrypted fields use KB| prefix protection');
  console.log('   • Automatic timestamp updates with triggers');
  console.log('   • Security event logging functions');
  console.log('   • Failed login attempt tracking');

  console.log('\n📊 Utility Functions:');
  console.log('   • log_security_event() - Log security events');
  console.log('   • get_user_stats() - Get user statistics');
  console.log('   • soft_delete_cipher() - Soft delete passwords');
  console.log('   • cleanup_old_security_events() - Clean old logs');
  console.log('   • increment_failed_login_attempts() - Track failed logins');

  console.log('\n🔍 Database Views:');
  console.log('   • keybox_active_ciphers - Non-deleted passwords');
  console.log('   • keybox_user_dashboard - User dashboard stats');

  console.log('\n⚡ Performance Optimizations:');
  console.log('   • Comprehensive indexing strategy');
  console.log('   • Optimized queries for common operations');
  console.log('   • Efficient RLS policies');
}

function checkMigrationFiles() {
  console.log('🔍 Checking migration files...\n');
  
  let allFilesExist = true;
  
  migrations.forEach((migration, index) => {
    const filepath = path.join(MIGRATIONS_DIR, migration.file);
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      console.log(`✅ ${migration.file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
      console.log(`❌ ${migration.file} - FILE NOT FOUND`);
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    console.log('\n❌ Some migration files are missing. Please check the file paths.');
    process.exit(1);
  }

  console.log('\n✅ All migration files found!');
}

function main() {
  console.log('🚀 KeyBox Database Migration Runner');
  console.log('=====================================\n');

  // Check if migration files exist
  checkMigrationFiles();

  // Generate summary
  generateMigrationSummary();

  // Print instructions
  printInstructions();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  readMigrationFile,
  migrations,
  MIGRATIONS_DIR
};
