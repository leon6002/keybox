// Key management service for secure key operations
// Implements Bitwarden-style key hierarchy: Master Key -> User Key -> Cipher Keys

import {
  KeyManagementService,
  MasterKey,
  UserKey,
  CipherKey,
  EncryptedString,
  KdfConfig,
  KdfType,
  SECURITY_CONSTANTS,
} from "./types";
import { WebCryptoService } from "./cryptoService";

export class KeyboxKeyManagementService implements KeyManagementService {
  private static instance: KeyboxKeyManagementService;
  private cryptoService: WebCryptoService;

  public static getInstance(): KeyboxKeyManagementService {
    if (!KeyboxKeyManagementService.instance) {
      KeyboxKeyManagementService.instance = new KeyboxKeyManagementService();
    }
    return KeyboxKeyManagementService.instance;
  }

  private constructor() {
    this.cryptoService = WebCryptoService.getInstance();
  }

  // Master key operations
  async createMasterKey(
    password: string,
    kdfConfig?: Partial<KdfConfig>
  ): Promise<MasterKey> {
    // Use provided salt or generate a new one
    const salt = kdfConfig?.salt ?? this.cryptoService.generateSalt();

    const fullKdfConfig: KdfConfig = {
      type: kdfConfig?.type ?? KdfType.PBKDF2_SHA256,
      iterations:
        kdfConfig?.iterations ?? SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS,
      memory: kdfConfig?.memory,
      parallelism: kdfConfig?.parallelism,
      salt,
    };

    // Validate KDF parameters
    this.validateKdfConfig(fullKdfConfig);

    // Derive master key from password
    const masterKeyBytes = await this.cryptoService.deriveKeyFromPassword(
      password,
      salt,
      fullKdfConfig
    );

    // Create authentication hash (different from the key itself)
    const authHash = await this.cryptoService.hashPassword(password, salt);

    return {
      key: masterKeyBytes,
      hash: authHash,
      kdfConfig: fullKdfConfig,
    };
  }

  async unlockWithMasterKey(
    password: string,
    storedHash: string,
    kdfConfig: KdfConfig
  ): Promise<MasterKey> {
    // Verify password first
    const isValid = await this.cryptoService.verifyPassword(
      password,
      storedHash,
      kdfConfig.salt
    );

    if (!isValid) {
      throw new Error("Invalid master password");
    }

    // Derive master key
    const masterKeyBytes = await this.cryptoService.deriveKeyFromPassword(
      password,
      kdfConfig.salt,
      kdfConfig
    );

    return {
      key: masterKeyBytes,
      hash: storedHash,
      kdfConfig,
    };
  }

  // User key operations
  async generateUserKey(): Promise<UserKey> {
    const keyBytes = this.cryptoService.generateKey();

    return {
      key: keyBytes,
    };
  }

  async encryptUserKey(
    userKey: UserKey,
    masterKey: MasterKey
  ): Promise<EncryptedString> {
    return this.cryptoService.encryptKey(userKey.key, masterKey.key);
  }

  async decryptUserKey(
    encryptedUserKey: EncryptedString,
    masterKey: MasterKey
  ): Promise<UserKey> {
    const keyBytes = await this.cryptoService.decryptKey(
      encryptedUserKey,
      masterKey.key
    );

    return {
      key: keyBytes,
      encryptedKey: encryptedUserKey,
    };
  }

  // Cipher key operations
  async generateCipherKey(): Promise<CipherKey> {
    const keyBytes = this.cryptoService.generateKey();

    // For now, we'll use a placeholder encrypted key
    // In practice, this would be encrypted with the user key
    const placeholderEncrypted: EncryptedString = {
      encryptionType: 0,
      data: "",
    };

    return {
      key: keyBytes,
      encryptedKey: placeholderEncrypted,
    };
  }

  async encryptCipherKey(
    cipherKey: CipherKey,
    userKey: UserKey
  ): Promise<EncryptedString> {
    return this.cryptoService.encryptKey(cipherKey.key, userKey.key);
  }

  async decryptCipherKey(
    encryptedCipherKey: EncryptedString,
    userKey: UserKey
  ): Promise<CipherKey> {
    const keyBytes = await this.cryptoService.decryptKey(
      encryptedCipherKey,
      userKey.key
    );

    return {
      key: keyBytes,
      encryptedKey: encryptedCipherKey,
    };
  }

  // Key rotation operations
  async rotateUserKey(
    oldUserKey: UserKey,
    newMasterKey: MasterKey
  ): Promise<UserKey> {
    // Generate new user key
    const newUserKey = await this.generateUserKey();

    // Encrypt new user key with new master key
    newUserKey.encryptedKey = await this.encryptUserKey(
      newUserKey,
      newMasterKey
    );

    return newUserKey;
  }

  async rotateCipherKeys(
    cipherKeys: CipherKey[],
    oldUserKey: UserKey,
    newUserKey: UserKey
  ): Promise<CipherKey[]> {
    const rotatedKeys: CipherKey[] = [];

    for (const cipherKey of cipherKeys) {
      // Decrypt with old user key
      const decryptedKey = await this.decryptCipherKey(
        cipherKey.encryptedKey,
        oldUserKey
      );

      // Re-encrypt with new user key
      const newEncryptedKey = await this.encryptCipherKey(
        decryptedKey,
        newUserKey
      );

      rotatedKeys.push({
        key: decryptedKey.key,
        encryptedKey: newEncryptedKey,
      });
    }

    return rotatedKeys;
  }

  // Utility methods
  private validateKdfConfig(config: KdfConfig): void {
    switch (config.type) {
      case KdfType.PBKDF2_SHA256:
        if (
          config.iterations < SECURITY_CONSTANTS.PBKDF2_MIN_ITERATIONS ||
          config.iterations > SECURITY_CONSTANTS.PBKDF2_MAX_ITERATIONS
        ) {
          throw new Error(
            `PBKDF2 iterations must be between ${SECURITY_CONSTANTS.PBKDF2_MIN_ITERATIONS} and ${SECURITY_CONSTANTS.PBKDF2_MAX_ITERATIONS}`
          );
        }
        break;

      case KdfType.ARGON2ID:
        if (
          config.iterations < SECURITY_CONSTANTS.ARGON2_MIN_ITERATIONS ||
          config.iterations > SECURITY_CONSTANTS.ARGON2_MAX_ITERATIONS
        ) {
          throw new Error(
            `Argon2 iterations must be between ${SECURITY_CONSTANTS.ARGON2_MIN_ITERATIONS} and ${SECURITY_CONSTANTS.ARGON2_MAX_ITERATIONS}`
          );
        }

        if (
          !config.memory ||
          config.memory < SECURITY_CONSTANTS.ARGON2_MIN_MEMORY ||
          config.memory > SECURITY_CONSTANTS.ARGON2_MAX_MEMORY
        ) {
          throw new Error(
            `Argon2 memory must be between ${SECURITY_CONSTANTS.ARGON2_MIN_MEMORY}MB and ${SECURITY_CONSTANTS.ARGON2_MAX_MEMORY}MB`
          );
        }

        if (
          !config.parallelism ||
          config.parallelism < SECURITY_CONSTANTS.ARGON2_MIN_PARALLELISM ||
          config.parallelism > SECURITY_CONSTANTS.ARGON2_MAX_PARALLELISM
        ) {
          throw new Error(
            `Argon2 parallelism must be between ${SECURITY_CONSTANTS.ARGON2_MIN_PARALLELISM} and ${SECURITY_CONSTANTS.ARGON2_MAX_PARALLELISM}`
          );
        }
        break;

      default:
        throw new Error(`Unsupported KDF type: ${config.type}`);
    }
  }

  // Key derivation configuration helpers
  getDefaultKdfConfig(
    type: KdfType = KdfType.PBKDF2_SHA256
  ): Partial<KdfConfig> {
    switch (type) {
      case KdfType.PBKDF2_SHA256:
        return {
          type,
          iterations: SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS,
        };

      case KdfType.ARGON2ID:
        return {
          type,
          iterations: SECURITY_CONSTANTS.ARGON2_DEFAULT_ITERATIONS,
          memory: SECURITY_CONSTANTS.ARGON2_DEFAULT_MEMORY,
          parallelism: SECURITY_CONSTANTS.ARGON2_DEFAULT_PARALLELISM,
        };

      default:
        throw new Error(`Unsupported KDF type: ${type}`);
    }
  }

  // Security utilities
  async deriveKeyFromMasterKey(
    masterKey: MasterKey,
    purpose: string
  ): Promise<Uint8Array> {
    // Derive a specific-purpose key from the master key
    // This is useful for creating keys for different purposes (e.g., MAC keys, encryption keys)
    const encoder = new TextEncoder();
    const purposeBytes = encoder.encode(purpose);

    // Simple key derivation using HKDF-like approach
    const combinedData = new Uint8Array(
      masterKey.key.length + purposeBytes.length
    );
    combinedData.set(masterKey.key, 0);
    combinedData.set(purposeBytes, masterKey.key.length);

    // Hash the combined data
    const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData);
    return new Uint8Array(hashBuffer);
  }

  // Memory cleanup
  secureCleanup(
    masterKey?: MasterKey,
    userKey?: UserKey,
    cipherKeys?: CipherKey[]
  ): void {
    if (masterKey) {
      this.cryptoService.secureZero(masterKey.key);
    }

    if (userKey) {
      this.cryptoService.secureZero(userKey.key);
    }

    if (cipherKeys) {
      cipherKeys.forEach((key) => this.cryptoService.secureZero(key.key));
    }
  }

  // Export key for storage (encrypted)
  async exportUserKeyForStorage(
    userKey: UserKey,
    masterKey: MasterKey
  ): Promise<string> {
    const encryptedKey = await this.encryptUserKey(userKey, masterKey);
    return JSON.stringify({
      encryptedKey,
      kdfConfig: masterKey.kdfConfig,
      version: "1.0",
    });
  }

  // Import key from storage
  async importUserKeyFromStorage(
    exportedData: string,
    masterKey: MasterKey
  ): Promise<UserKey> {
    const parsed = JSON.parse(exportedData);

    if (parsed.version !== "1.0") {
      throw new Error(`Unsupported key export version: ${parsed.version}`);
    }

    return this.decryptUserKey(parsed.encryptedKey, masterKey);
  }
}
