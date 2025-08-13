// Enhanced backup service with proper encryption
// Implements secure backup creation, export, and import with Bitwarden-style encryption

import { 
  SecurityServiceFactory, 
  UserKey, 
  EncryptedString, 
  KdfType,
  SECURITY_CONSTANTS 
} from './index';
import { PasswordEntry, Category } from '../../types/password';
import { Cipher, CipherType } from './cipherEntity';

export interface SecureBackupData {
  version: string;
  createdAt: string;
  application: string;
  
  // Encryption metadata
  encryptionType: string;
  kdfType: KdfType;
  kdfIterations: number;
  kdfMemory?: number;
  kdfParallelism?: number;
  kdfSalt: string; // Base64 encoded
  
  // Encrypted data
  encryptedData: EncryptedString;
  
  // Metadata (not encrypted)
  metadata: {
    totalEntries: number;
    totalCategories: number;
    backupType: 'auto' | 'manual';
    versionName?: string;
    dataHash: string; // For integrity verification
  };
}

export interface BackupOptions {
  includeDeleted?: boolean;
  includeAttachments?: boolean;
  password?: string; // For additional password protection
  compressionLevel?: number;
  encryptionType?: 'user_key' | 'password' | 'both';
}

export interface ImportOptions {
  mergeStrategy: 'replace' | 'merge' | 'skip_existing';
  validateIntegrity?: boolean;
  password?: string;
}

export class EncryptedBackupService {
  private static instance: EncryptedBackupService;
  private cryptoService = SecurityServiceFactory.getCryptoService();
  private vaultService = SecurityServiceFactory.getVaultService();
  private keyManagementService = SecurityServiceFactory.getKeyManagementService();

  public static getInstance(): EncryptedBackupService {
    if (!EncryptedBackupService.instance) {
      EncryptedBackupService.instance = new EncryptedBackupService();
    }
    return EncryptedBackupService.instance;
  }

  private constructor() {}

  // Create secure backup
  async createSecureBackup(
    entries: PasswordEntry[],
    categories: Category[],
    userKey: UserKey,
    options: BackupOptions = {}
  ): Promise<SecureBackupData> {
    const {
      includeDeleted = false,
      password,
      encryptionType = 'user_key',
    } = options;

    // Filter entries if needed
    const filteredEntries = includeDeleted ? entries : entries.filter(e => !e.deletedAt);

    // Convert to cipher format for consistent encryption
    const ciphers: Cipher[] = [];
    for (const entry of filteredEntries) {
      const cipher = await Cipher.fromPasswordEntry(entry, userKey);
      ciphers.push(cipher);
    }

    // Encrypt categories
    const encryptedCategories = await this.vaultService.encryptFolders(categories, userKey);

    // Prepare backup data
    const backupData = {
      version: '2.0', // New version with enhanced security
      ciphers: ciphers.map(c => c.toJSON()),
      categories: encryptedCategories,
      exportedAt: new Date().toISOString(),
    };

    const dataJson = JSON.stringify(backupData);
    const dataHash = await this.cryptoService.generateFileHash(dataJson);

    // Choose encryption key
    let encryptionKey: Uint8Array;
    let kdfConfig: any = null;

    if (encryptionType === 'password' && password) {
      // Use password-based encryption
      const salt = this.cryptoService.generateSalt();
      kdfConfig = {
        type: KdfType.PBKDF2_SHA256,
        iterations: SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS,
        salt,
      };
      encryptionKey = await this.cryptoService.deriveKeyFromPassword(password, salt, kdfConfig);
    } else {
      // Use user key
      encryptionKey = userKey.key;
    }

    // Encrypt the backup data
    const encryptedData = await this.cryptoService.encrypt(dataJson, encryptionKey);

    // Create secure backup structure
    const secureBackup: SecureBackupData = {
      version: '2.0',
      createdAt: new Date().toISOString(),
      application: 'KeyBox Password Manager',
      encryptionType: encryptionType,
      kdfType: kdfConfig?.type || KdfType.PBKDF2_SHA256,
      kdfIterations: kdfConfig?.iterations || SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS,
      kdfMemory: kdfConfig?.memory,
      kdfParallelism: kdfConfig?.parallelism,
      kdfSalt: kdfConfig ? this.arrayBufferToBase64(kdfConfig.salt.buffer) : '',
      encryptedData,
      metadata: {
        totalEntries: filteredEntries.length,
        totalCategories: categories.length,
        backupType: options.backupType || 'manual',
        versionName: options.versionName,
        dataHash,
      },
    };

    return secureBackup;
  }

  // Import secure backup
  async importSecureBackup(
    backupData: SecureBackupData,
    userKey: UserKey,
    options: ImportOptions = { mergeStrategy: 'merge' }
  ): Promise<{ entries: PasswordEntry[]; categories: Category[] }> {
    const { password, validateIntegrity = true } = options;

    // Validate backup version
    if (!this.isVersionSupported(backupData.version)) {
      throw new Error(`Unsupported backup version: ${backupData.version}`);
    }

    // Choose decryption key
    let decryptionKey: Uint8Array;

    if (backupData.encryptionType === 'password' && password) {
      // Use password-based decryption
      const salt = this.base64ToArrayBuffer(backupData.kdfSalt);
      const kdfConfig = {
        type: backupData.kdfType,
        iterations: backupData.kdfIterations,
        memory: backupData.kdfMemory,
        parallelism: backupData.kdfParallelism,
        salt: new Uint8Array(salt),
      };
      decryptionKey = await this.cryptoService.deriveKeyFromPassword(password, new Uint8Array(salt), kdfConfig);
    } else {
      // Use user key
      decryptionKey = userKey.key;
    }

    // Decrypt backup data
    const decryptedJson = await this.cryptoService.decrypt(backupData.encryptedData, decryptionKey);
    
    // Validate data integrity
    if (validateIntegrity) {
      const computedHash = await this.cryptoService.generateFileHash(decryptedJson);
      if (computedHash !== backupData.metadata.dataHash) {
        throw new Error('Backup data integrity check failed');
      }
    }

    const decryptedData = JSON.parse(decryptedJson);

    // Convert ciphers back to password entries
    const entries: PasswordEntry[] = [];
    if (decryptedData.ciphers) {
      for (const cipherJson of decryptedData.ciphers) {
        const cipher = Cipher.fromJSON(cipherJson);
        const entry = await cipher.toPasswordEntry(userKey);
        entries.push(entry);
      }
    }

    // Decrypt categories
    const categories: Category[] = [];
    if (decryptedData.categories) {
      for (const encryptedCategory of decryptedData.categories) {
        const category = await this.vaultService.decryptFolder(encryptedCategory, userKey);
        categories.push(category);
      }
    }

    return { entries, categories };
  }

  // Export to encrypted file
  async exportToEncryptedFile(
    entries: PasswordEntry[],
    categories: Category[],
    userKey: UserKey,
    options: BackupOptions = {}
  ): Promise<{ filename: string; data: string; size: number }> {
    const secureBackup = await this.createSecureBackup(entries, categories, userKey, options);
    const backupJson = JSON.stringify(secureBackup, null, 2);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `keybox-backup-${timestamp}.kbx`;
    
    return {
      filename,
      data: backupJson,
      size: new Blob([backupJson]).size,
    };
  }

  // Import from encrypted file
  async importFromEncryptedFile(
    fileContent: string,
    userKey: UserKey,
    options: ImportOptions = { mergeStrategy: 'merge' }
  ): Promise<{ entries: PasswordEntry[]; categories: Category[] }> {
    try {
      const backupData: SecureBackupData = JSON.parse(fileContent);
      return await this.importSecureBackup(backupData, userKey, options);
    } catch (error) {
      throw new Error(`Failed to import backup file: ${error.message}`);
    }
  }

  // Legacy backup support (for backward compatibility)
  async importLegacyBackup(
    legacyData: any,
    userKey: UserKey
  ): Promise<{ entries: PasswordEntry[]; categories: Category[] }> {
    console.warn('Importing legacy backup format. Consider upgrading to the new format.');
    
    // Handle legacy format
    const entries: PasswordEntry[] = legacyData.entries || [];
    const categories: Category[] = legacyData.categories || [];
    
    // Validate and sanitize legacy data
    const validatedEntries = entries.filter(entry => 
      entry.id && entry.title && typeof entry.title === 'string'
    );
    
    const validatedCategories = categories.filter(category =>
      category.id && category.name && typeof category.name === 'string'
    );
    
    return {
      entries: validatedEntries,
      categories: validatedCategories,
    };
  }

  // Validate backup data
  async validateBackup(backupData: SecureBackupData): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check version
    if (!this.isVersionSupported(backupData.version)) {
      errors.push(`Unsupported backup version: ${backupData.version}`);
    }

    // Check required fields
    if (!backupData.encryptedData) {
      errors.push('Missing encrypted data');
    }

    if (!backupData.metadata) {
      errors.push('Missing metadata');
    }

    // Check encryption parameters
    if (backupData.encryptionType === 'password' && !backupData.kdfSalt) {
      errors.push('Missing KDF salt for password-based encryption');
    }

    // Check metadata
    if (backupData.metadata) {
      if (typeof backupData.metadata.totalEntries !== 'number') {
        warnings.push('Invalid total entries count in metadata');
      }
      
      if (!backupData.metadata.dataHash) {
        warnings.push('Missing data integrity hash');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Utility methods
  private isVersionSupported(version: string): boolean {
    const supportedVersions = ['1.0', '2.0'];
    return supportedVersions.includes(version);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Get backup statistics
  async getBackupStats(backupData: SecureBackupData): Promise<{
    version: string;
    createdAt: string;
    totalEntries: number;
    totalCategories: number;
    encryptionType: string;
    estimatedSize: number;
  }> {
    return {
      version: backupData.version,
      createdAt: backupData.createdAt,
      totalEntries: backupData.metadata.totalEntries,
      totalCategories: backupData.metadata.totalCategories,
      encryptionType: backupData.encryptionType,
      estimatedSize: JSON.stringify(backupData).length,
    };
  }
}
