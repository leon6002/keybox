// Supabase database adapter for KeyBox encrypted storage
// Implements the DatabaseConnection interface for Supabase

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseConnection } from './databaseService';
import { 
  DatabaseUser, 
  DatabaseCipher, 
  DatabaseFolder, 
  DatabaseSecurityEvent,
  DatabaseBackup 
} from './schema';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string; // For admin operations
}

export class SupabaseDatabaseConnection implements DatabaseConnection {
  private client: SupabaseClient;
  private adminClient?: SupabaseClient;

  constructor(config: SupabaseConfig) {
    this.client = createClient(config.url, config.anonKey);
    
    if (config.serviceKey) {
      this.adminClient = createClient(config.url, config.serviceKey);
    }
  }

  // Execute a query and return results
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      // For Supabase, we'll use the built-in query methods instead of raw SQL
      // This is a simplified implementation - in practice, you'd map SQL to Supabase operations
      throw new Error('Raw SQL queries not supported in Supabase adapter. Use specific methods instead.');
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  // Execute a command (INSERT, UPDATE, DELETE)
  async execute(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid?: number }> {
    try {
      // Similar to query, this would need to be mapped to Supabase operations
      throw new Error('Raw SQL execution not supported in Supabase adapter. Use specific methods instead.');
    } catch (error) {
      console.error('Execute error:', error);
      throw error;
    }
  }

  // Transaction support
  async transaction<T>(callback: (tx: DatabaseConnection) => Promise<T>): Promise<T> {
    // Supabase doesn't have explicit transaction support in the client
    // We'll simulate it by executing the callback with the same connection
    return await callback(this);
  }

  // Close connection
  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
    return Promise.resolve();
  }

  // Supabase-specific methods for encrypted operations

  // User operations
  async createUser(user: Omit<DatabaseUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseUser> {
    const { data, error } = await this.client
      .from('keybox_users')
      .insert({
        email: user.email,
        name: user.name,
        master_password_hash: user.masterPasswordHash,
        kdf_type: user.kdfType,
        kdf_iterations: user.kdfIterations,
        kdf_memory: user.kdfMemory,
        kdf_parallelism: user.kdfParallelism,
        kdf_salt: user.kdfSalt,
        user_key: user.userKey,
        private_key: user.privateKey,
        public_key: user.publicKey,
        security_settings: user.securitySettings,
        email_verified: user.emailVerified,
        two_factor_enabled: user.twoFactorEnabled,
        last_login_at: user.lastLoginAt,
        last_password_change_at: user.lastPasswordChangeAt,
        is_active: user.isActive,
        is_locked: user.isLocked,
        failed_login_attempts: user.failedLoginAttempts,
        locked_until: user.lockedUntil,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.mapSupabaseUserToDatabase(data);
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const { data, error } = await this.client
      .from('keybox_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return this.mapSupabaseUserToDatabase(data);
  }

  async updateUser(userId: string, updates: Partial<DatabaseUser>): Promise<void> {
    const supabaseUpdates = this.mapDatabaseUserToSupabase(updates);
    
    const { error } = await this.client
      .from('keybox_users')
      .update(supabaseUpdates)
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Cipher operations
  async createCipher(cipher: Omit<DatabaseCipher, 'id' | 'createdAt' | 'updatedAt' | 'revisionDate'>): Promise<DatabaseCipher> {
    const { data, error } = await this.client
      .from('keybox_ciphers')
      .insert({
        user_id: cipher.userId,
        organization_id: cipher.organizationId,
        type: cipher.type,
        folder_id: cipher.folderId,
        favorite: cipher.favorite,
        reprompt: cipher.reprompt,
        name: cipher.name,
        data: cipher.data,
        notes: cipher.notes,
        key: cipher.key,
        attachments: cipher.attachments,
        deleted_at: cipher.deletedAt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create cipher: ${error.message}`);
    }

    return this.mapSupabaseCipherToDatabase(data);
  }

  async getCiphersByUserId(userId: string, includeDeleted = false): Promise<DatabaseCipher[]> {
    let query = this.client
      .from('keybox_ciphers')
      .select('*')
      .eq('user_id', userId);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    query = query.order('revision_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get ciphers: ${error.message}`);
    }

    return (data || []).map(this.mapSupabaseCipherToDatabase);
  }

  async updateCipher(cipherId: string, updates: Partial<DatabaseCipher>): Promise<void> {
    const supabaseUpdates = this.mapDatabaseCipherToSupabase(updates);
    
    const { error } = await this.client
      .from('keybox_ciphers')
      .update(supabaseUpdates)
      .eq('id', cipherId);

    if (error) {
      throw new Error(`Failed to update cipher: ${error.message}`);
    }
  }

  async deleteCipher(cipherId: string, soft = true): Promise<void> {
    if (soft) {
      const { error } = await this.client
        .from('keybox_ciphers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', cipherId);

      if (error) {
        throw new Error(`Failed to soft delete cipher: ${error.message}`);
      }
    } else {
      const { error } = await this.client
        .from('keybox_ciphers')
        .delete()
        .eq('id', cipherId);

      if (error) {
        throw new Error(`Failed to delete cipher: ${error.message}`);
      }
    }
  }

  // Folder operations
  async createFolder(folder: Omit<DatabaseFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseFolder> {
    const { data, error } = await this.client
      .from('keybox_folders')
      .insert({
        user_id: folder.userId,
        name: folder.name,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }

    return this.mapSupabaseFolderToDatabase(data);
  }

  async getFoldersByUserId(userId: string): Promise<DatabaseFolder[]> {
    const { data, error } = await this.client
      .from('keybox_folders')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      throw new Error(`Failed to get folders: ${error.message}`);
    }

    return (data || []).map(this.mapSupabaseFolderToDatabase);
  }

  // Security event logging
  async logSecurityEvent(event: Omit<DatabaseSecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await this.client
      .from('keybox_security_events')
      .insert({
        user_id: event.userId,
        organization_id: event.organizationId,
        type: event.type,
        details: event.details,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        device_id: event.deviceId,
      });

    if (error) {
      throw new Error(`Failed to log security event: ${error.message}`);
    }
  }

  async getSecurityEvents(userId: string, limit = 100): Promise<DatabaseSecurityEvent[]> {
    const { data, error } = await this.client
      .from('keybox_security_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get security events: ${error.message}`);
    }

    return (data || []).map(this.mapSupabaseSecurityEventToDatabase);
  }

  // Utility methods for mapping between Supabase and Database formats
  private mapSupabaseUserToDatabase(supabaseUser: any): DatabaseUser {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.name,
      masterPasswordHash: supabaseUser.master_password_hash,
      kdfType: supabaseUser.kdf_type,
      kdfIterations: supabaseUser.kdf_iterations,
      kdfMemory: supabaseUser.kdf_memory,
      kdfParallelism: supabaseUser.kdf_parallelism,
      kdfSalt: supabaseUser.kdf_salt,
      userKey: supabaseUser.user_key,
      privateKey: supabaseUser.private_key,
      publicKey: supabaseUser.public_key,
      securitySettings: typeof supabaseUser.security_settings === 'string' 
        ? supabaseUser.security_settings 
        : JSON.stringify(supabaseUser.security_settings),
      emailVerified: supabaseUser.email_verified,
      twoFactorEnabled: supabaseUser.two_factor_enabled,
      createdAt: supabaseUser.created_at,
      updatedAt: supabaseUser.updated_at,
      lastLoginAt: supabaseUser.last_login_at,
      lastPasswordChangeAt: supabaseUser.last_password_change_at,
      isActive: supabaseUser.is_active,
      isLocked: supabaseUser.is_locked,
      failedLoginAttempts: supabaseUser.failed_login_attempts,
      lockedUntil: supabaseUser.locked_until,
    };
  }

  private mapDatabaseUserToSupabase(databaseUser: Partial<DatabaseUser>): any {
    const supabaseUser: any = {};
    
    if (databaseUser.email !== undefined) supabaseUser.email = databaseUser.email;
    if (databaseUser.name !== undefined) supabaseUser.name = databaseUser.name;
    if (databaseUser.masterPasswordHash !== undefined) supabaseUser.master_password_hash = databaseUser.masterPasswordHash;
    if (databaseUser.kdfType !== undefined) supabaseUser.kdf_type = databaseUser.kdfType;
    if (databaseUser.kdfIterations !== undefined) supabaseUser.kdf_iterations = databaseUser.kdfIterations;
    if (databaseUser.kdfMemory !== undefined) supabaseUser.kdf_memory = databaseUser.kdfMemory;
    if (databaseUser.kdfParallelism !== undefined) supabaseUser.kdf_parallelism = databaseUser.kdfParallelism;
    if (databaseUser.kdfSalt !== undefined) supabaseUser.kdf_salt = databaseUser.kdfSalt;
    if (databaseUser.userKey !== undefined) supabaseUser.user_key = databaseUser.userKey;
    if (databaseUser.privateKey !== undefined) supabaseUser.private_key = databaseUser.privateKey;
    if (databaseUser.publicKey !== undefined) supabaseUser.public_key = databaseUser.publicKey;
    if (databaseUser.securitySettings !== undefined) {
      supabaseUser.security_settings = typeof databaseUser.securitySettings === 'string' 
        ? JSON.parse(databaseUser.securitySettings) 
        : databaseUser.securitySettings;
    }
    if (databaseUser.emailVerified !== undefined) supabaseUser.email_verified = databaseUser.emailVerified;
    if (databaseUser.twoFactorEnabled !== undefined) supabaseUser.two_factor_enabled = databaseUser.twoFactorEnabled;
    if (databaseUser.lastLoginAt !== undefined) supabaseUser.last_login_at = databaseUser.lastLoginAt;
    if (databaseUser.lastPasswordChangeAt !== undefined) supabaseUser.last_password_change_at = databaseUser.lastPasswordChangeAt;
    if (databaseUser.isActive !== undefined) supabaseUser.is_active = databaseUser.isActive;
    if (databaseUser.isLocked !== undefined) supabaseUser.is_locked = databaseUser.isLocked;
    if (databaseUser.failedLoginAttempts !== undefined) supabaseUser.failed_login_attempts = databaseUser.failedLoginAttempts;
    if (databaseUser.lockedUntil !== undefined) supabaseUser.locked_until = databaseUser.lockedUntil;

    return supabaseUser;
  }

  private mapSupabaseCipherToDatabase(supabaseCipher: any): DatabaseCipher {
    return {
      id: supabaseCipher.id,
      userId: supabaseCipher.user_id,
      organizationId: supabaseCipher.organization_id,
      type: supabaseCipher.type,
      folderId: supabaseCipher.folder_id,
      favorite: supabaseCipher.favorite,
      reprompt: supabaseCipher.reprompt,
      name: supabaseCipher.name,
      data: supabaseCipher.data,
      notes: supabaseCipher.notes,
      key: supabaseCipher.key,
      attachments: typeof supabaseCipher.attachments === 'string' 
        ? supabaseCipher.attachments 
        : JSON.stringify(supabaseCipher.attachments),
      createdAt: supabaseCipher.created_at,
      updatedAt: supabaseCipher.updated_at,
      deletedAt: supabaseCipher.deleted_at,
      revisionDate: supabaseCipher.revision_date,
    };
  }

  private mapDatabaseCipherToSupabase(databaseCipher: Partial<DatabaseCipher>): any {
    const supabaseCipher: any = {};
    
    if (databaseCipher.userId !== undefined) supabaseCipher.user_id = databaseCipher.userId;
    if (databaseCipher.organizationId !== undefined) supabaseCipher.organization_id = databaseCipher.organizationId;
    if (databaseCipher.type !== undefined) supabaseCipher.type = databaseCipher.type;
    if (databaseCipher.folderId !== undefined) supabaseCipher.folder_id = databaseCipher.folderId;
    if (databaseCipher.favorite !== undefined) supabaseCipher.favorite = databaseCipher.favorite;
    if (databaseCipher.reprompt !== undefined) supabaseCipher.reprompt = databaseCipher.reprompt;
    if (databaseCipher.name !== undefined) supabaseCipher.name = databaseCipher.name;
    if (databaseCipher.data !== undefined) supabaseCipher.data = databaseCipher.data;
    if (databaseCipher.notes !== undefined) supabaseCipher.notes = databaseCipher.notes;
    if (databaseCipher.key !== undefined) supabaseCipher.key = databaseCipher.key;
    if (databaseCipher.attachments !== undefined) {
      supabaseCipher.attachments = typeof databaseCipher.attachments === 'string' 
        ? JSON.parse(databaseCipher.attachments) 
        : databaseCipher.attachments;
    }
    if (databaseCipher.deletedAt !== undefined) supabaseCipher.deleted_at = databaseCipher.deletedAt;

    return supabaseCipher;
  }

  private mapSupabaseFolderToDatabase(supabaseFolder: any): DatabaseFolder {
    return {
      id: supabaseFolder.id,
      userId: supabaseFolder.user_id,
      name: supabaseFolder.name,
      createdAt: supabaseFolder.created_at,
      updatedAt: supabaseFolder.updated_at,
    };
  }

  private mapSupabaseSecurityEventToDatabase(supabaseEvent: any): DatabaseSecurityEvent {
    return {
      id: supabaseEvent.id,
      userId: supabaseEvent.user_id,
      organizationId: supabaseEvent.organization_id,
      type: supabaseEvent.type,
      details: typeof supabaseEvent.details === 'string' 
        ? supabaseEvent.details 
        : JSON.stringify(supabaseEvent.details),
      ipAddress: supabaseEvent.ip_address,
      userAgent: supabaseEvent.user_agent,
      deviceId: supabaseEvent.device_id,
      timestamp: supabaseEvent.timestamp,
    };
  }
}
