// Data protection service for database field encryption
// Implements Bitwarden-style database field protection with prefixed encryption

import { SECURITY_CONSTANTS } from './types';
import { WebCryptoService } from './cryptoService';

export interface DataProtectionConfig {
  purpose: string;
  key: Uint8Array;
}

export class DataProtectionService {
  private static instance: DataProtectionService;
  private cryptoService: WebCryptoService;
  private protectionKeys: Map<string, Uint8Array> = new Map();

  public static getInstance(): DataProtectionService {
    if (!DataProtectionService.instance) {
      DataProtectionService.instance = new DataProtectionService();
    }
    return DataProtectionService.instance;
  }

  private constructor() {
    this.cryptoService = WebCryptoService.getInstance();
  }

  // Initialize protection key for a specific purpose
  async initializeProtectionKey(purpose: string, masterKey?: Uint8Array): Promise<void> {
    let protectionKey: Uint8Array;

    if (masterKey) {
      // Derive protection key from master key
      protectionKey = await this.deriveProtectionKey(masterKey, purpose);
    } else {
      // Generate new protection key
      protectionKey = this.cryptoService.generateKey();
    }

    this.protectionKeys.set(purpose, protectionKey);
  }

  // Protect (encrypt) a database field value
  async protect(value: string, purpose: string = 'default'): Promise<string> {
    if (!value) {
      return value;
    }

    // Check if already protected
    if (value.startsWith(SECURITY_CONSTANTS.PROTECTED_PREFIX)) {
      return value;
    }

    const protectionKey = this.protectionKeys.get(purpose);
    if (!protectionKey) {
      throw new Error(`Protection key not initialized for purpose: ${purpose}`);
    }

    try {
      const encryptedData = await this.cryptoService.encrypt(value, protectionKey);
      const protectedValue = JSON.stringify(encryptedData);
      
      return SECURITY_CONSTANTS.PROTECTED_PREFIX + protectedValue;
    } catch (error) {
      console.error('Failed to protect data:', error);
      throw new Error('Data protection failed');
    }
  }

  // Unprotect (decrypt) a database field value
  async unprotect(protectedValue: string, purpose: string = 'default'): Promise<string> {
    if (!protectedValue) {
      return protectedValue;
    }

    // Check if actually protected
    if (!protectedValue.startsWith(SECURITY_CONSTANTS.PROTECTED_PREFIX)) {
      return protectedValue;
    }

    const protectionKey = this.protectionKeys.get(purpose);
    if (!protectionKey) {
      throw new Error(`Protection key not initialized for purpose: ${purpose}`);
    }

    try {
      const encryptedDataJson = protectedValue.substring(SECURITY_CONSTANTS.PROTECTED_PREFIX.length);
      const encryptedData = JSON.parse(encryptedDataJson);
      
      return await this.cryptoService.decrypt(encryptedData, protectionKey);
    } catch (error) {
      console.error('Failed to unprotect data:', error);
      throw new Error('Data unprotection failed');
    }
  }

  // Batch protect multiple values
  async protectBatch(values: Record<string, string>, purpose: string = 'default'): Promise<Record<string, string>> {
    const protectedValues: Record<string, string> = {};

    for (const [key, value] of Object.entries(values)) {
      protectedValues[key] = await this.protect(value, purpose);
    }

    return protectedValues;
  }

  // Batch unprotect multiple values
  async unprotectBatch(protectedValues: Record<string, string>, purpose: string = 'default'): Promise<Record<string, string>> {
    const unprotectedValues: Record<string, string> = {};

    for (const [key, value] of Object.entries(protectedValues)) {
      unprotectedValues[key] = await this.unprotect(value, purpose);
    }

    return unprotectedValues;
  }

  // Check if a value is protected
  isProtected(value: string): boolean {
    return value?.startsWith(SECURITY_CONSTANTS.PROTECTED_PREFIX) || false;
  }

  // Derive protection key from master key
  private async deriveProtectionKey(masterKey: Uint8Array, purpose: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const purposeBytes = encoder.encode(purpose);
    
    // Create key material from master key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      masterKey,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    // Derive key using HKDF
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32), // Zero salt for simplicity
        info: purposeBytes,
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Export as raw bytes
    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
    return new Uint8Array(exportedKey);
  }

  // Rotate protection keys
  async rotateProtectionKey(purpose: string, newMasterKey: Uint8Array): Promise<void> {
    const newProtectionKey = await this.deriveProtectionKey(newMasterKey, purpose);
    
    // Clean up old key
    const oldKey = this.protectionKeys.get(purpose);
    if (oldKey) {
      this.cryptoService.secureZero(oldKey);
    }

    // Set new key
    this.protectionKeys.set(purpose, newProtectionKey);
  }

  // Clean up all protection keys
  cleanup(): void {
    for (const [purpose, key] of this.protectionKeys) {
      this.cryptoService.secureZero(key);
    }
    this.protectionKeys.clear();
  }

  // Get available protection purposes
  getAvailablePurposes(): string[] {
    return Array.from(this.protectionKeys.keys());
  }
}

// Database field protection decorator/converter
export class DatabaseFieldProtector {
  private dataProtectionService: DataProtectionService;

  constructor(purpose: string = 'database') {
    this.dataProtectionService = DataProtectionService.getInstance();
    
    // Initialize protection key if not already done
    this.dataProtectionService.initializeProtectionKey(purpose).catch(error => {
      console.error('Failed to initialize database field protection:', error);
    });
  }

  // Convert value for database storage (encrypt)
  async convertToDatabaseValue(value: string, purpose: string = 'database'): Promise<string> {
    return this.dataProtectionService.protect(value, purpose);
  }

  // Convert value from database (decrypt)
  async convertFromDatabaseValue(value: string, purpose: string = 'database'): Promise<string> {
    return this.dataProtectionService.unprotect(value, purpose);
  }
}

// Utility functions for common database operations
export class DatabaseProtectionUtils {
  private static protector = new DatabaseFieldProtector();

  // Protect user sensitive fields
  static async protectUserData(userData: {
    masterPassword?: string;
    userKey?: string;
    privateKey?: string;
    [key: string]: any;
  }): Promise<typeof userData> {
    const protectedData = { ...userData };

    if (userData.masterPassword) {
      protectedData.masterPassword = await this.protector.convertToDatabaseValue(
        userData.masterPassword,
        'user_auth'
      );
    }

    if (userData.userKey) {
      protectedData.userKey = await this.protector.convertToDatabaseValue(
        userData.userKey,
        'user_keys'
      );
    }

    if (userData.privateKey) {
      protectedData.privateKey = await this.protector.convertToDatabaseValue(
        userData.privateKey,
        'user_keys'
      );
    }

    return protectedData;
  }

  // Unprotect user sensitive fields
  static async unprotectUserData(protectedData: {
    masterPassword?: string;
    userKey?: string;
    privateKey?: string;
    [key: string]: any;
  }): Promise<typeof protectedData> {
    const userData = { ...protectedData };

    if (protectedData.masterPassword) {
      userData.masterPassword = await this.protector.convertFromDatabaseValue(
        protectedData.masterPassword,
        'user_auth'
      );
    }

    if (protectedData.userKey) {
      userData.userKey = await this.protector.convertFromDatabaseValue(
        protectedData.userKey,
        'user_keys'
      );
    }

    if (protectedData.privateKey) {
      userData.privateKey = await this.protector.convertFromDatabaseValue(
        protectedData.privateKey,
        'user_keys'
      );
    }

    return userData;
  }

  // Protect cipher sensitive fields
  static async protectCipherData(cipherData: {
    data?: string;
    key?: string;
    [key: string]: any;
  }): Promise<typeof cipherData> {
    const protectedData = { ...cipherData };

    if (cipherData.data) {
      protectedData.data = await this.protector.convertToDatabaseValue(
        cipherData.data,
        'cipher_data'
      );
    }

    if (cipherData.key) {
      protectedData.key = await this.protector.convertToDatabaseValue(
        cipherData.key,
        'cipher_keys'
      );
    }

    return protectedData;
  }

  // Unprotect cipher sensitive fields
  static async unprotectCipherData(protectedData: {
    data?: string;
    key?: string;
    [key: string]: any;
  }): Promise<typeof protectedData> {
    const cipherData = { ...protectedData };

    if (protectedData.data) {
      cipherData.data = await this.protector.convertFromDatabaseValue(
        protectedData.data,
        'cipher_data'
      );
    }

    if (protectedData.key) {
      cipherData.key = await this.protector.convertFromDatabaseValue(
        protectedData.key,
        'cipher_keys'
      );
    }

    return cipherData;
  }
}
