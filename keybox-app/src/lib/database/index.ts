// Database service initialization for KeyBox
// Connects the new security services to Supabase

import { supabase } from '../supabase';
import { SupabaseDatabaseConnection } from './supabaseAdapter';
import { EncryptedDatabaseService } from './databaseService';
import { SecurityServiceFactory } from '../security';

// Global database service instance
let databaseService: EncryptedDatabaseService | null = null;
let supabaseConnection: SupabaseDatabaseConnection | null = null;

// Initialize the database service
export async function initializeDatabaseService(): Promise<EncryptedDatabaseService> {
  if (databaseService) {
    return databaseService;
  }

  try {
    // Create Supabase connection adapter
    supabaseConnection = new SupabaseDatabaseConnection({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    });

    // Create encrypted database service
    databaseService = EncryptedDatabaseService.getInstance();
    
    // Initialize without master key initially (will be set after user login)
    await databaseService.initialize(supabaseConnection);

    console.log('✅ Database service initialized successfully');
    return databaseService;
  } catch (error) {
    console.error('❌ Failed to initialize database service:', error);
    throw error;
  }
}

// Get the database service instance
export function getDatabaseService(): EncryptedDatabaseService {
  if (!databaseService) {
    throw new Error('Database service not initialized. Call initializeDatabaseService() first.');
  }
  return databaseService;
}

// Get the Supabase connection
export function getSupabaseConnection(): SupabaseDatabaseConnection {
  if (!supabaseConnection) {
    throw new Error('Supabase connection not initialized. Call initializeDatabaseService() first.');
  }
  return supabaseConnection;
}

// Initialize database service with master key (after user login)
export async function initializeDatabaseWithMasterKey(masterKey: Uint8Array): Promise<void> {
  const dbService = getDatabaseService();
  const connection = getSupabaseConnection();
  
  // Re-initialize with master key for data protection
  await dbService.initialize(connection, masterKey);
  
  // Initialize security services with master key
  await SecurityServiceFactory.initializeServices(masterKey);
  
  console.log('✅ Database service initialized with master key');
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('keybox_users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }

    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
}

// Get database health status
export async function getDatabaseHealth(): Promise<{
  isHealthy: boolean;
  tables: string[];
  issues: string[];
}> {
  const issues: string[] = [];
  let tables: string[] = [];

  try {
    // Check if required tables exist
    const { data: tableData, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .like('table_name', 'keybox_%');

    if (tableError) {
      issues.push(`Failed to check tables: ${tableError.message}`);
    } else {
      tables = tableData?.map(t => t.table_name) || [];
      
      const requiredTables = [
        'keybox_users',
        'keybox_ciphers', 
        'keybox_folders',
        'keybox_security_events',
        'keybox_backups'
      ];

      const missingTables = requiredTables.filter(table => !tables.includes(table));
      if (missingTables.length > 0) {
        issues.push(`Missing tables: ${missingTables.join(', ')}`);
      }
    }

    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      issues.push(`Auth check failed: ${authError.message}`);
    }

  } catch (error) {
    issues.push(`Health check error: ${error.message}`);
  }

  return {
    isHealthy: issues.length === 0,
    tables,
    issues,
  };
}

// Export types for convenience
export type { 
  DatabaseUser, 
  DatabaseCipher, 
  DatabaseFolder 
} from './schema';

export { 
  SupabaseDatabaseConnection,
  EncryptedDatabaseService 
};
