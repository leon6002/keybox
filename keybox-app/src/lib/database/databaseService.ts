// Database service with encrypted storage support
// Implements Bitwarden-style database operations with automatic field protection

import { 
  DatabaseUser, 
  DatabaseCipher, 
  DatabaseFolder, 
  DatabaseSecurityEvent,
  DatabaseBackup 
} from './schema';
import { 
  DataProtectionService, 
  DatabaseProtectionUtils 
} from '../security/dataProtectionService';
import { Cipher } from '../security/cipherEntity';
import { UserKey } from '../security/types';

export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid?: number }>;
  transaction<T>(callback: (tx: DatabaseConnection) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export class EncryptedDatabaseService {
  private static instance: EncryptedDatabaseService;
  private connection: DatabaseConnection | null = null;
  private dataProtectionService: DataProtectionService;
  private isInitialized = false;

  public static getInstance(): EncryptedDatabaseService {
    if (!EncryptedDatabaseService.instance) {
      EncryptedDatabaseService.instance = new EncryptedDatabaseService();
    }
    return EncryptedDatabaseService.instance;
  }

  private constructor() {
    this.dataProtectionService = DataProtectionService.getInstance();
  }

  // Initialize database connection and protection keys
  async initialize(connection: DatabaseConnection, masterKey?: Uint8Array): Promise<void> {
    this.connection = connection;
    
    // Initialize data protection keys
    if (masterKey) {
      await this.dataProtectionService.initializeProtectionKey('user_auth', masterKey);
      await this.dataProtectionService.initializeProtectionKey('user_keys', masterKey);
      await this.dataProtectionService.initializeProtectionKey('cipher_data', masterKey);
      await this.dataProtectionService.initializeProtectionKey('cipher_keys', masterKey);
      await this.dataProtectionService.initializeProtectionKey('folder_data', masterKey);
    }
    
    this.isInitialized = true;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.connection) {
      throw new Error('Database service not initialized');
    }
  }

  // User operations
  async createUser(user: Omit<DatabaseUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseUser> {
    this.ensureInitialized();
    
    const now = new Date().toISOString();
    const userWithTimestamps: DatabaseUser = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    // Protect sensitive fields
    const protectedUser = await DatabaseProtectionUtils.protectUserData(userWithTimestamps);

    const sql = `
      INSERT INTO users (
        id, email, name, masterPasswordHash, kdfType, kdfIterations, 
        kdfMemory, kdfParallelism, kdfSalt, userKey, privateKey, publicKey,
        securitySettings, emailVerified, twoFactorEnabled, createdAt, updatedAt,
        lastLoginAt, lastPasswordChangeAt, isActive, isLocked, failedLoginAttempts, lockedUntil
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.connection!.execute(sql, [
      protectedUser.id,
      protectedUser.email,
      protectedUser.name,
      protectedUser.masterPasswordHash,
      protectedUser.kdfType,
      protectedUser.kdfIterations,
      protectedUser.kdfMemory,
      protectedUser.kdfParallelism,
      protectedUser.kdfSalt,
      protectedUser.userKey,
      protectedUser.privateKey,
      protectedUser.publicKey,
      protectedUser.securitySettings,
      protectedUser.emailVerified,
      protectedUser.twoFactorEnabled,
      protectedUser.createdAt,
      protectedUser.updatedAt,
      protectedUser.lastLoginAt,
      protectedUser.lastPasswordChangeAt,
      protectedUser.isActive,
      protectedUser.isLocked,
      protectedUser.failedLoginAttempts,
      protectedUser.lockedUntil,
    ]);

    return userWithTimestamps;
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    this.ensureInitialized();
    
    const sql = 'SELECT * FROM users WHERE email = ? AND isActive = TRUE';
    const results = await this.connection!.query<DatabaseUser>(sql, [email]);
    
    if (results.length === 0) {
      return null;
    }

    // Unprotect sensitive fields
    const protectedUser = results[0];
    return await DatabaseProtectionUtils.unprotectUserData(protectedUser);
  }

  async updateUser(userId: string, updates: Partial<DatabaseUser>): Promise<void> {
    this.ensureInitialized();
    
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Protect sensitive fields in updates
    const protectedUpdates = await DatabaseProtectionUtils.protectUserData(updatesWithTimestamp);

    const setClause = Object.keys(protectedUpdates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
    const values = [...Object.values(protectedUpdates), userId];

    await this.connection!.execute(sql, values);
  }

  // Cipher operations
  async createCipher(cipher: Omit<DatabaseCipher, 'id' | 'createdAt' | 'updatedAt' | 'revisionDate'>): Promise<DatabaseCipher> {
    this.ensureInitialized();
    
    const now = new Date().toISOString();
    const cipherWithTimestamps: DatabaseCipher = {
      ...cipher,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      revisionDate: now,
    };

    // Protect sensitive fields
    const protectedCipher = await DatabaseProtectionUtils.protectCipherData(cipherWithTimestamps);

    const sql = `
      INSERT INTO ciphers (
        id, userId, organizationId, type, folderId, favorite, reprompt,
        name, data, notes, key, attachments, createdAt, updatedAt, deletedAt, revisionDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.connection!.execute(sql, [
      protectedCipher.id,
      protectedCipher.userId,
      protectedCipher.organizationId,
      protectedCipher.type,
      protectedCipher.folderId,
      protectedCipher.favorite,
      protectedCipher.reprompt,
      protectedCipher.name,
      protectedCipher.data,
      protectedCipher.notes,
      protectedCipher.key,
      protectedCipher.attachments,
      protectedCipher.createdAt,
      protectedCipher.updatedAt,
      protectedCipher.deletedAt,
      protectedCipher.revisionDate,
    ]);

    return cipherWithTimestamps;
  }

  async getCiphersByUserId(userId: string, includeDeleted = false): Promise<DatabaseCipher[]> {
    this.ensureInitialized();
    
    let sql = 'SELECT * FROM ciphers WHERE userId = ?';
    const params = [userId];
    
    if (!includeDeleted) {
      sql += ' AND deletedAt IS NULL';
    }
    
    sql += ' ORDER BY revisionDate DESC';

    const results = await this.connection!.query<DatabaseCipher>(sql, params);
    
    // Unprotect sensitive fields for all ciphers
    const unprotectedCiphers: DatabaseCipher[] = [];
    for (const protectedCipher of results) {
      const unprotectedCipher = await DatabaseProtectionUtils.unprotectCipherData(protectedCipher);
      unprotectedCiphers.push(unprotectedCipher);
    }
    
    return unprotectedCiphers;
  }

  async updateCipher(cipherId: string, updates: Partial<DatabaseCipher>): Promise<void> {
    this.ensureInitialized();
    
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString(),
      revisionDate: new Date().toISOString(),
    };

    // Protect sensitive fields in updates
    const protectedUpdates = await DatabaseProtectionUtils.protectCipherData(updatesWithTimestamp);

    const setClause = Object.keys(protectedUpdates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const sql = `UPDATE ciphers SET ${setClause} WHERE id = ?`;
    const values = [...Object.values(protectedUpdates), cipherId];

    await this.connection!.execute(sql, values);
  }

  async deleteCipher(cipherId: string, soft = true): Promise<void> {
    this.ensureInitialized();
    
    if (soft) {
      // Soft delete - mark as deleted
      await this.updateCipher(cipherId, {
        deletedAt: new Date().toISOString(),
      });
    } else {
      // Hard delete - remove from database
      const sql = 'DELETE FROM ciphers WHERE id = ?';
      await this.connection!.execute(sql, [cipherId]);
    }
  }

  // Folder operations
  async createFolder(folder: Omit<DatabaseFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseFolder> {
    this.ensureInitialized();
    
    const now = new Date().toISOString();
    const folderWithTimestamps: DatabaseFolder = {
      ...folder,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    // Protect folder name
    const protectedName = await this.dataProtectionService.protect(folder.name, 'folder_data');

    const sql = `
      INSERT INTO folders (id, userId, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `;

    await this.connection!.execute(sql, [
      folderWithTimestamps.id,
      folderWithTimestamps.userId,
      protectedName,
      folderWithTimestamps.createdAt,
      folderWithTimestamps.updatedAt,
    ]);

    return folderWithTimestamps;
  }

  async getFoldersByUserId(userId: string): Promise<DatabaseFolder[]> {
    this.ensureInitialized();
    
    const sql = 'SELECT * FROM folders WHERE userId = ? ORDER BY name';
    const results = await this.connection!.query<DatabaseFolder>(sql, [userId]);
    
    // Unprotect folder names
    const unprotectedFolders: DatabaseFolder[] = [];
    for (const folder of results) {
      const unprotectedName = await this.dataProtectionService.unprotect(folder.name, 'folder_data');
      unprotectedFolders.push({
        ...folder,
        name: unprotectedName,
      });
    }
    
    return unprotectedFolders;
  }

  // Security event logging
  async logSecurityEvent(event: Omit<DatabaseSecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    this.ensureInitialized();
    
    const securityEvent: DatabaseSecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const sql = `
      INSERT INTO securityEvents (id, userId, organizationId, type, details, ipAddress, userAgent, deviceId, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.connection!.execute(sql, [
      securityEvent.id,
      securityEvent.userId,
      securityEvent.organizationId,
      securityEvent.type,
      securityEvent.details,
      securityEvent.ipAddress,
      securityEvent.userAgent,
      securityEvent.deviceId,
      securityEvent.timestamp,
    ]);
  }

  async getSecurityEvents(userId: string, limit = 100): Promise<DatabaseSecurityEvent[]> {
    this.ensureInitialized();
    
    const sql = `
      SELECT * FROM securityEvents 
      WHERE userId = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    
    return await this.connection!.query<DatabaseSecurityEvent>(sql, [userId, limit]);
  }

  // Backup operations
  async createBackup(backup: Omit<DatabaseBackup, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseBackup> {
    this.ensureInitialized();
    
    const now = new Date().toISOString();
    const backupWithTimestamps: DatabaseBackup = {
      ...backup,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    const sql = `
      INSERT INTO backups (id, userId, filename, filePath, backupType, versionName, fileSize, isEncrypted, encryptionMethod, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.connection!.execute(sql, [
      backupWithTimestamps.id,
      backupWithTimestamps.userId,
      backupWithTimestamps.filename,
      backupWithTimestamps.filePath,
      backupWithTimestamps.backupType,
      backupWithTimestamps.versionName,
      backupWithTimestamps.fileSize,
      backupWithTimestamps.isEncrypted,
      backupWithTimestamps.encryptionMethod,
      backupWithTimestamps.createdAt,
      backupWithTimestamps.updatedAt,
    ]);

    return backupWithTimestamps;
  }

  async getBackupsByUserId(userId: string): Promise<DatabaseBackup[]> {
    this.ensureInitialized();
    
    const sql = 'SELECT * FROM backups WHERE userId = ? ORDER BY createdAt DESC';
    return await this.connection!.query<DatabaseBackup>(sql, [userId]);
  }

  // Database maintenance
  async vacuum(): Promise<void> {
    this.ensureInitialized();
    await this.connection!.execute('VACUUM');
  }

  async getStats(): Promise<{
    users: number;
    ciphers: number;
    folders: number;
    securityEvents: number;
    backups: number;
  }> {
    this.ensureInitialized();
    
    const [users, ciphers, folders, securityEvents, backups] = await Promise.all([
      this.connection!.query('SELECT COUNT(*) as count FROM users'),
      this.connection!.query('SELECT COUNT(*) as count FROM ciphers WHERE deletedAt IS NULL'),
      this.connection!.query('SELECT COUNT(*) as count FROM folders'),
      this.connection!.query('SELECT COUNT(*) as count FROM securityEvents'),
      this.connection!.query('SELECT COUNT(*) as count FROM backups'),
    ]);

    return {
      users: users[0].count,
      ciphers: ciphers[0].count,
      folders: folders[0].count,
      securityEvents: securityEvents[0].count,
      backups: backups[0].count,
    };
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    this.isInitialized = false;
  }
}
