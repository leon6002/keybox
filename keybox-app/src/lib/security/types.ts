// Security types and interfaces for Keybox encryption system
// Based on Bitwarden's security architecture

export enum EncryptionType {
  // Symmetric encryption
  AES_GCM_256 = 0,
  AES_CBC_256_HMAC_SHA256 = 1,
  XCHACHA20_POLY1305 = 2,
}

export enum KdfType {
  PBKDF2_SHA256 = 0,
  ARGON2ID = 1,
}

export interface KdfConfig {
  type: KdfType;
  iterations: number;
  memory?: number; // For Argon2id (MB)
  parallelism?: number; // For Argon2id
  salt: Uint8Array;
}

export interface EncryptedString {
  encryptionType: EncryptionType;
  data: string; // Base64 encoded encrypted data
  iv?: string; // Base64 encoded IV (for AES)
  nonce?: string; // Base64 encoded nonce (for XChaCha20)
  mac?: string; // Base64 encoded MAC (for authenticated encryption)
}

export interface UserKey {
  key: Uint8Array; // 256-bit symmetric key
  encryptedKey?: EncryptedString; // Key encrypted with master key
  publicKey?: Uint8Array; // For asymmetric operations
  privateKey?: EncryptedString; // Private key encrypted with user key
}

export interface MasterKey {
  key: Uint8Array; // Derived from master password
  hash: string; // For authentication
  kdfConfig: KdfConfig;
}

export interface CipherKey {
  key: Uint8Array; // 256-bit key for this specific cipher
  encryptedKey: EncryptedString; // Key encrypted with user key
}

export interface SecuritySettings {
  kdfType: KdfType;
  kdfIterations: number;
  kdfMemory?: number;
  kdfParallelism?: number;
  encryptionType: EncryptionType;
  requireMasterPasswordReprompt: boolean;
  sessionTimeout: number; // minutes
  lockOnIdle: boolean;
  clearClipboard: number; // seconds
}

export interface EncryptedCipher {
  id: string;
  type: string; // password, note, card, identity, etc.
  name: EncryptedString;
  data: EncryptedString; // JSON containing encrypted fields
  notes?: EncryptedString;
  favorite: boolean;
  reprompt: boolean; // Require master password to view
  folderId?: string; // Folder/category ID
  key?: EncryptedString; // Individual cipher key
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface EncryptedFolder {
  id: string;
  name: EncryptedString;
  createdAt: string;
  updatedAt: string;
}

export interface SecureSession {
  userKey: UserKey;
  masterKeyHash: string;
  sessionId: string;
  expiresAt: Date;
  lastActivity: Date;
}

export interface CryptoService {
  // Key derivation
  deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    kdfConfig: KdfConfig
  ): Promise<Uint8Array>;
  generateSalt(): Uint8Array;
  generateKey(): Uint8Array;

  // Encryption/Decryption
  encrypt(
    data: string,
    key: Uint8Array,
    type: EncryptionType
  ): Promise<EncryptedString>;
  decrypt(encryptedData: EncryptedString, key: Uint8Array): Promise<string>;

  // Key management
  encryptKey(
    key: Uint8Array,
    encryptionKey: Uint8Array
  ): Promise<EncryptedString>;
  decryptKey(
    encryptedKey: EncryptedString,
    decryptionKey: Uint8Array
  ): Promise<Uint8Array>;

  // Hashing
  hashPassword(password: string, salt: Uint8Array): Promise<string>;
  verifyPassword(
    password: string,
    hash: string,
    salt: Uint8Array
  ): Promise<boolean>;

  // Utilities
  generateSecureRandom(length: number): Uint8Array;
  constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean;
  secureZero(data: Uint8Array): void;
}

export interface KeyManagementService {
  // Master key operations
  createMasterKey(
    password: string,
    kdfConfig?: Partial<KdfConfig>
  ): Promise<MasterKey>;
  unlockWithMasterKey(
    password: string,
    storedHash: string,
    kdfConfig: KdfConfig
  ): Promise<MasterKey>;

  // User key operations
  generateUserKey(): Promise<UserKey>;
  encryptUserKey(
    userKey: UserKey,
    masterKey: MasterKey
  ): Promise<EncryptedString>;
  decryptUserKey(
    encryptedUserKey: EncryptedString,
    masterKey: MasterKey
  ): Promise<UserKey>;

  // Cipher key operations
  generateCipherKey(): Promise<CipherKey>;
  encryptCipherKey(
    cipherKey: CipherKey,
    userKey: UserKey
  ): Promise<EncryptedString>;
  decryptCipherKey(
    encryptedCipherKey: EncryptedString,
    userKey: UserKey
  ): Promise<CipherKey>;

  // Key rotation
  rotateUserKey(oldUserKey: UserKey, newMasterKey: MasterKey): Promise<UserKey>;
  rotateCipherKeys(
    cipherKeys: CipherKey[],
    oldUserKey: UserKey,
    newUserKey: UserKey
  ): Promise<CipherKey[]>;
}

export interface VaultService {
  // Cipher operations
  encryptCipher(cipher: any, userKey: UserKey): Promise<EncryptedCipher>;
  decryptCipher(
    encryptedCipher: EncryptedCipher,
    userKey: UserKey
  ): Promise<any>;

  // Folder operations
  encryptFolder(folder: any, userKey: UserKey): Promise<EncryptedFolder>;
  decryptFolder(
    encryptedFolder: EncryptedFolder,
    userKey: UserKey
  ): Promise<any>;

  // String operations
  encryptString(plaintext: string, userKey: UserKey): Promise<EncryptedString>;
  decryptString(
    encryptedString: EncryptedString,
    userKey: UserKey
  ): Promise<string>;

  // Bulk operations
  encryptCiphers(ciphers: any[], userKey: UserKey): Promise<EncryptedCipher[]>;
  decryptCiphers(
    encryptedCiphers: EncryptedCipher[],
    userKey: UserKey
  ): Promise<any[]>;
}

export interface SecurityAuditService {
  // Password analysis
  analyzePasswordStrength(password: string): PasswordStrengthResult;
  checkForDataBreaches(password: string): Promise<boolean>;
  findWeakPasswords(ciphers: any[]): any[];
  findReusedPasswords(ciphers: any[]): any[];

  // Security monitoring
  logSecurityEvent(event: SecurityEvent): void;
  detectSuspiciousActivity(events: SecurityEvent[]): SecurityAlert[];
}

export interface PasswordStrengthResult {
  score: number; // 0-100
  isStrong: boolean;
  feedback: string[];
  estimatedCrackTime: string;
}

export interface SecurityEvent {
  type:
    | "login"
    | "unlock"
    | "export"
    | "import"
    | "key_rotation"
    | "failed_auth";
  timestamp: Date;
  userId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityAlert {
  type:
    | "weak_password"
    | "reused_password"
    | "suspicious_login"
    | "data_breach";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  cipherId?: string;
  timestamp: Date;
}

// Constants
export const SECURITY_CONSTANTS = {
  // KDF defaults
  PBKDF2_DEFAULT_ITERATIONS: 600000,
  PBKDF2_MIN_ITERATIONS: 600000,
  PBKDF2_MAX_ITERATIONS: 2000000,

  ARGON2_DEFAULT_ITERATIONS: 3,
  ARGON2_MIN_ITERATIONS: 2,
  ARGON2_MAX_ITERATIONS: 10,
  ARGON2_DEFAULT_MEMORY: 64, // MB
  ARGON2_MIN_MEMORY: 15,
  ARGON2_MAX_MEMORY: 1024,
  ARGON2_DEFAULT_PARALLELISM: 4,
  ARGON2_MIN_PARALLELISM: 1,
  ARGON2_MAX_PARALLELISM: 16,

  // Key sizes
  MASTER_KEY_SIZE: 32, // 256 bits
  USER_KEY_SIZE: 32, // 256 bits
  CIPHER_KEY_SIZE: 32, // 256 bits
  SALT_SIZE: 16, // 128 bits
  IV_SIZE: 12, // 96 bits for GCM
  XCHACHA20_NONCE_SIZE: 24, // 192 bits for XChaCha20

  // Session
  DEFAULT_SESSION_TIMEOUT: 60, // minutes
  MAX_SESSION_TIMEOUT: 1440, // 24 hours

  // Security
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 300, // 5 minutes

  // Database protection
  PROTECTED_PREFIX: "KB|",
} as const;
