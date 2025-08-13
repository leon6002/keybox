// Database schema for encrypted password storage
// Implements Bitwarden-style database structure with proper encryption

export interface DatabaseUser {
  id: string;
  email: string;
  name?: string;
  
  // Authentication fields (encrypted)
  masterPasswordHash: string; // Protected with data protection
  kdfType: number;
  kdfIterations: number;
  kdfMemory?: number;
  kdfParallelism?: number;
  kdfSalt: string; // Base64 encoded
  
  // Key management (encrypted)
  userKey: string; // Protected - encrypted user key
  privateKey?: string; // Protected - encrypted private key
  publicKey?: string; // Not encrypted - public key
  
  // Security settings
  securitySettings: string; // JSON string of security settings
  
  // Account management
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastPasswordChangeAt?: string;
  
  // Account status
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export interface DatabaseCipher {
  id: string;
  userId: string;
  organizationId?: string;
  
  // Cipher metadata
  type: number; // CipherType enum
  folderId?: string;
  favorite: boolean;
  reprompt: number; // CipherRepromptType enum
  
  // Encrypted fields
  name: string; // Protected - encrypted cipher name
  data: string; // Protected - encrypted cipher data (JSON)
  notes?: string; // Protected - encrypted notes
  key?: string; // Protected - encrypted individual cipher key
  
  // Attachments
  attachments?: string; // JSON string of attachment metadata
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  
  // Sync metadata
  revisionDate: string;
}

export interface DatabaseFolder {
  id: string;
  userId: string;
  
  // Encrypted fields
  name: string; // Protected - encrypted folder name
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseCollection {
  id: string;
  organizationId: string;
  
  // Encrypted fields
  name: string; // Protected - encrypted collection name
  
  // Access control
  readOnly: boolean;
  hidePasswords: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseOrganization {
  id: string;
  name: string;
  businessName?: string;
  
  // Billing
  planType: number;
  seats: number;
  maxCollections: number;
  maxStorageGb: number;
  
  // Settings
  useGroups: boolean;
  useDirectory: boolean;
  useEvents: boolean;
  useTotp: boolean;
  use2fa: boolean;
  useApi: boolean;
  selfHost: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseDevice {
  id: string;
  userId: string;
  
  // Device info
  name: string;
  type: number; // DeviceType enum
  identifier: string; // Unique device identifier
  
  // Push notifications
  pushToken?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}

export interface DatabaseSecurityEvent {
  id: string;
  userId?: string;
  organizationId?: string;
  
  // Event details
  type: string; // SecurityEventType
  details: string; // JSON string of event details
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  
  // Timestamp
  timestamp: string;
}

export interface DatabaseBackup {
  id: string;
  userId: string;
  
  // Backup metadata
  filename: string;
  filePath: string;
  backupType: 'auto' | 'manual';
  versionName?: string;
  fileSize: number;
  
  // Encryption info
  isEncrypted: boolean;
  encryptionMethod?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Database indexes for performance
export interface DatabaseIndexes {
  users: {
    email: 'unique';
    createdAt: 'index';
    lastLoginAt: 'index';
  };
  
  ciphers: {
    userId: 'index';
    organizationId: 'index';
    folderId: 'index';
    type: 'index';
    favorite: 'index';
    deletedAt: 'index';
    revisionDate: 'index';
    'userId,type': 'compound';
    'userId,favorite': 'compound';
    'userId,deletedAt': 'compound';
  };
  
  folders: {
    userId: 'index';
    createdAt: 'index';
  };
  
  collections: {
    organizationId: 'index';
    createdAt: 'index';
  };
  
  devices: {
    userId: 'index';
    identifier: 'unique';
    lastSeenAt: 'index';
  };
  
  securityEvents: {
    userId: 'index';
    organizationId: 'index';
    type: 'index';
    timestamp: 'index';
    'userId,timestamp': 'compound';
    'organizationId,timestamp': 'compound';
  };
  
  backups: {
    userId: 'index';
    backupType: 'index';
    createdAt: 'index';
    'userId,createdAt': 'compound';
  };
}

// Database constraints and validation rules
export interface DatabaseConstraints {
  users: {
    email: {
      required: true;
      unique: true;
      format: 'email';
    };
    masterPasswordHash: {
      required: true;
      minLength: 32;
    };
    kdfIterations: {
      required: true;
      min: 100000;
      max: 2000000;
    };
  };
  
  ciphers: {
    userId: {
      required: true;
      foreignKey: 'users.id';
    };
    name: {
      required: true;
      minLength: 1;
    };
    data: {
      required: true;
      minLength: 1;
    };
    type: {
      required: true;
      enum: [0, 1, 2, 3, 4]; // CipherType values
    };
  };
  
  folders: {
    userId: {
      required: true;
      foreignKey: 'users.id';
    };
    name: {
      required: true;
      minLength: 1;
    };
  };
}

// Migration scripts for database schema updates
export interface DatabaseMigration {
  version: string;
  description: string;
  up: string[]; // SQL statements to apply migration
  down: string[]; // SQL statements to rollback migration
}

export const migrations: DatabaseMigration[] = [
  {
    version: '1.0.0',
    description: 'Initial schema with encrypted storage support',
    up: [
      `CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        masterPasswordHash TEXT NOT NULL,
        kdfType INTEGER NOT NULL DEFAULT 0,
        kdfIterations INTEGER NOT NULL DEFAULT 600000,
        kdfMemory INTEGER,
        kdfParallelism INTEGER,
        kdfSalt TEXT NOT NULL,
        userKey TEXT NOT NULL,
        privateKey TEXT,
        publicKey TEXT,
        securitySettings TEXT NOT NULL DEFAULT '{}',
        emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
        twoFactorEnabled BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        lastLoginAt TEXT,
        lastPasswordChangeAt TEXT,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        isLocked BOOLEAN NOT NULL DEFAULT FALSE,
        failedLoginAttempts INTEGER NOT NULL DEFAULT 0,
        lockedUntil TEXT
      )`,
      
      `CREATE TABLE ciphers (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        organizationId TEXT,
        type INTEGER NOT NULL DEFAULT 0,
        folderId TEXT,
        favorite BOOLEAN NOT NULL DEFAULT FALSE,
        reprompt INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        notes TEXT,
        key TEXT,
        attachments TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT,
        revisionDate TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE folders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE securityEvents (
        id TEXT PRIMARY KEY,
        userId TEXT,
        organizationId TEXT,
        type TEXT NOT NULL,
        details TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        deviceId TEXT,
        timestamp TEXT NOT NULL
      )`,
      
      `CREATE TABLE backups (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        filename TEXT NOT NULL,
        filePath TEXT NOT NULL,
        backupType TEXT NOT NULL,
        versionName TEXT,
        fileSize INTEGER NOT NULL,
        isEncrypted BOOLEAN NOT NULL DEFAULT TRUE,
        encryptionMethod TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Create indexes
      `CREATE INDEX idx_users_email ON users (email)`,
      `CREATE INDEX idx_users_createdAt ON users (createdAt)`,
      `CREATE INDEX idx_ciphers_userId ON ciphers (userId)`,
      `CREATE INDEX idx_ciphers_type ON ciphers (type)`,
      `CREATE INDEX idx_ciphers_favorite ON ciphers (favorite)`,
      `CREATE INDEX idx_ciphers_deletedAt ON ciphers (deletedAt)`,
      `CREATE INDEX idx_ciphers_userId_type ON ciphers (userId, type)`,
      `CREATE INDEX idx_folders_userId ON folders (userId)`,
      `CREATE INDEX idx_securityEvents_userId ON securityEvents (userId)`,
      `CREATE INDEX idx_securityEvents_timestamp ON securityEvents (timestamp)`,
      `CREATE INDEX idx_backups_userId ON backups (userId)`,
    ],
    down: [
      'DROP TABLE IF EXISTS backups',
      'DROP TABLE IF EXISTS securityEvents',
      'DROP TABLE IF EXISTS folders',
      'DROP TABLE IF EXISTS ciphers',
      'DROP TABLE IF EXISTS users',
    ],
  },
];

// Database configuration
export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql';
  connection: {
    filename?: string; // For SQLite
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
  };
  pool?: {
    min: number;
    max: number;
  };
  migrations: {
    directory: string;
    tableName: string;
  };
  encryption: {
    enabled: boolean;
    keyDerivation: {
      algorithm: 'PBKDF2' | 'Argon2id';
      iterations: number;
      memory?: number;
      parallelism?: number;
    };
  };
}
