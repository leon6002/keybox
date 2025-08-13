// Comprehensive security tests for the keybox encryption system
// Tests encryption, decryption, key management, and security utilities

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  WebCryptoService,
  KeyboxKeyManagementService,
  KeyboxVaultService,
  KeyboxSecurityAuditService,
  DataProtectionService,
  KdfType,
  EncryptionType,
  SECURITY_CONSTANTS,
} from "../index";
import { PasswordEntry } from "../../../types/password";

// Mock crypto for testing environment
const mockCrypto = {
  subtle: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    generateKey: jest.fn(),
    importKey: jest.fn(),
    exportKey: jest.fn(),
    deriveKey: jest.fn(),
    deriveBits: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
    digest: jest.fn(),
  },
  getRandomValues: jest.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  randomUUID: jest.fn(
    () => "test-uuid-" + Math.random().toString(36).substr(2, 9)
  ),
};

// Setup global crypto mock
Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
});

describe("WebCryptoService", () => {
  let cryptoService: WebCryptoService;

  beforeEach(() => {
    cryptoService = WebCryptoService.getInstance();
    jest.clearAllMocks();
  });

  describe("Key Generation", () => {
    it("should generate secure random salt", () => {
      const salt = cryptoService.generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(SECURITY_CONSTANTS.SALT_SIZE);
    });

    it("should generate secure random key", () => {
      const key = cryptoService.generateKey();
      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(SECURITY_CONSTANTS.USER_KEY_SIZE);
    });

    it("should generate different keys each time", () => {
      const key1 = cryptoService.generateKey();
      const key2 = cryptoService.generateKey();
      expect(key1).not.toEqual(key2);
    });
  });

  describe("Key Derivation", () => {
    it("should derive key from password with PBKDF2", async () => {
      const password = "test-password-123";
      const salt = new Uint8Array(16);
      const kdfConfig = {
        type: KdfType.PBKDF2_SHA256,
        iterations: 100000,
        salt,
      };

      // Mock the Web Crypto API calls
      const mockKeyMaterial = {};
      const mockDerivedKey = {};
      const mockExportedKey = new ArrayBuffer(32);

      mockCrypto.subtle.importKey.mockResolvedValue(mockKeyMaterial);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockDerivedKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(mockExportedKey);

      const derivedKey = await cryptoService.deriveKeyFromPassword(
        password,
        salt,
        kdfConfig
      );

      expect(derivedKey).toBeInstanceOf(Uint8Array);
      expect(derivedKey.length).toBe(32);
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        "raw",
        expect.any(Uint8Array),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
    });

    it("should throw error for unsupported KDF type", async () => {
      const password = "test-password";
      const salt = new Uint8Array(16);
      const kdfConfig = {
        type: KdfType.ARGON2ID, // Not implemented in Web Crypto
        iterations: 3,
        memory: 64,
        parallelism: 4,
        salt,
      };

      await expect(
        cryptoService.deriveKeyFromPassword(password, salt, kdfConfig)
      ).rejects.toThrow("Argon2id not yet implemented");
    });
  });

  describe("Encryption/Decryption", () => {
    it("should encrypt and decrypt data successfully", async () => {
      const data = "sensitive test data";
      const key = new Uint8Array(32);

      // Mock encryption
      const mockEncryptedData = new ArrayBuffer(32);
      const mockIv = new Uint8Array(12);
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData);
      mockCrypto.subtle.decrypt.mockResolvedValue(
        new TextEncoder().encode(data)
      );

      const encrypted = await cryptoService.encrypt(
        data,
        key,
        EncryptionType.AES_GCM_256
      );
      expect(encrypted.encryptionType).toBe(EncryptionType.AES_GCM_256);
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      const decrypted = await cryptoService.decrypt(encrypted, key);
      expect(decrypted).toBe(data);
    });

    it("should handle encryption errors gracefully", async () => {
      const data = "test data";
      const key = new Uint8Array(32);

      mockCrypto.subtle.importKey.mockRejectedValue(new Error("Crypto error"));

      await expect(cryptoService.encrypt(data, key)).rejects.toThrow();
    });
  });

  describe("Utility Functions", () => {
    it("should perform constant time comparison", () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);
      const c = new Uint8Array([1, 2, 3, 5]);

      expect(cryptoService.constantTimeEquals(a, b)).toBe(true);
      expect(cryptoService.constantTimeEquals(a, c)).toBe(false);
    });

    it("should handle different length arrays in constant time comparison", () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3, 4]);

      expect(cryptoService.constantTimeEquals(a, b)).toBe(false);
    });

    it("should securely zero memory", () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      cryptoService.secureZero(data);

      for (let i = 0; i < data.length; i++) {
        expect(data[i]).toBe(0);
      }
    });
  });
});

describe("KeyboxKeyManagementService", () => {
  let keyManagementService: KeyboxKeyManagementService;
  let cryptoService: WebCryptoService;

  beforeEach(() => {
    keyManagementService = KeyboxKeyManagementService.getInstance();
    cryptoService = WebCryptoService.getInstance();
    jest.clearAllMocks();
  });

  describe("Master Key Operations", () => {
    it("should create master key with default settings", async () => {
      const password = "strong-master-password-123";

      // Mock crypto operations
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.deriveKey.mockResolvedValue({});
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      const masterKey = await keyManagementService.createMasterKey(password);

      expect(masterKey.key).toBeInstanceOf(Uint8Array);
      expect(masterKey.hash).toBeDefined();
      expect(masterKey.kdfConfig.type).toBe(KdfType.PBKDF2_SHA256);
      expect(masterKey.kdfConfig.iterations).toBe(
        SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS
      );
    });

    it("should validate KDF configuration", async () => {
      const password = "test-password";
      const invalidConfig = {
        type: KdfType.PBKDF2_SHA256,
        iterations: 50000, // Below minimum
      };

      await expect(
        keyManagementService.createMasterKey(password, invalidConfig)
      ).rejects.toThrow("PBKDF2 iterations must be between");
    });
  });

  describe("User Key Operations", () => {
    it("should generate user key", async () => {
      const userKey = await keyManagementService.generateUserKey();

      expect(userKey.key).toBeInstanceOf(Uint8Array);
      expect(userKey.key.length).toBe(SECURITY_CONSTANTS.USER_KEY_SIZE);
    });

    it("should encrypt and decrypt user key", async () => {
      // Mock crypto operations
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.deriveKey.mockResolvedValue({});
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(48));
      mockCrypto.subtle.decrypt.mockResolvedValue(new ArrayBuffer(32));

      const password = "master-password";
      const masterKey = await keyManagementService.createMasterKey(password);
      const userKey = await keyManagementService.generateUserKey();

      const encryptedUserKey = await keyManagementService.encryptUserKey(
        userKey,
        masterKey
      );
      expect(encryptedUserKey.data).toBeDefined();

      const decryptedUserKey = await keyManagementService.decryptUserKey(
        encryptedUserKey,
        masterKey
      );
      expect(decryptedUserKey.key).toEqual(userKey.key);
    });
  });
});

describe("KeyboxVaultService", () => {
  let vaultService: KeyboxVaultService;
  let userKey: any;

  beforeEach(() => {
    vaultService = KeyboxVaultService.getInstance();
    userKey = { key: new Uint8Array(32) };
    jest.clearAllMocks();
  });

  describe("Cipher Operations", () => {
    it("should encrypt password entry", async () => {
      const entry: PasswordEntry = {
        id: "test-id",
        title: "Test Entry",
        categoryId: "default",
        username: "testuser",
        password: "testpass",
        website: "https://example.com",
        description: "",
        notes: "Test notes",
        customFields: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
      };

      // Mock encryption
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));

      const encryptedCipher = await vaultService.encryptCipher(entry, userKey);

      expect(encryptedCipher.id).toBe(entry.id);
      expect(encryptedCipher.name.data).toBeDefined();
      expect(encryptedCipher.data.data).toBeDefined();
      expect(encryptedCipher.favorite).toBe(entry.isFavorite);
    });

    it("should decrypt cipher back to password entry", async () => {
      const originalEntry: PasswordEntry = {
        id: "test-id",
        title: "Test Entry",
        categoryId: "default",
        username: "testuser",
        password: "testpass",
        website: "https://example.com",
        description: "",
        notes: "Test notes",
        customFields: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
      };

      // Mock crypto operations
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.decrypt
        .mockResolvedValueOnce(new TextEncoder().encode(originalEntry.title))
        .mockResolvedValueOnce(
          new TextEncoder().encode(
            JSON.stringify({
              username: originalEntry.username,
              password: originalEntry.password,
              website: originalEntry.website,
              customFields: originalEntry.customFields,
              tags: originalEntry.tags,
            })
          )
        )
        .mockResolvedValueOnce(new TextEncoder().encode(originalEntry.notes));

      const encryptedCipher = await vaultService.encryptCipher(
        originalEntry,
        userKey
      );
      const decryptedEntry = await vaultService.decryptCipher(
        encryptedCipher,
        userKey
      );

      expect(decryptedEntry.id).toBe(originalEntry.id);
      expect(decryptedEntry.title).toBe(originalEntry.title);
      expect(decryptedEntry.username).toBe(originalEntry.username);
      expect(decryptedEntry.password).toBe(originalEntry.password);
    });
  });
});

describe("KeyboxSecurityAuditService", () => {
  let securityAuditService: KeyboxSecurityAuditService;

  beforeEach(() => {
    securityAuditService = KeyboxSecurityAuditService.getInstance();
  });

  describe("Password Strength Analysis", () => {
    it("should analyze strong password correctly", () => {
      const strongPassword = "MyStr0ng!P@ssw0rd2024";
      const result =
        securityAuditService.analyzePasswordStrength(strongPassword);

      expect(result.score).toBeGreaterThan(70);
      expect(result.isStrong).toBe(true);
      expect(result.feedback).toBeDefined();
      expect(result.estimatedCrackTime).toBeDefined();
    });

    it("should analyze weak password correctly", () => {
      const weakPassword = "123456";
      const result = securityAuditService.analyzePasswordStrength(weakPassword);

      expect(result.score).toBeLessThan(30);
      expect(result.isStrong).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it("should detect common patterns", () => {
      const commonPassword = "password123";
      const result =
        securityAuditService.analyzePasswordStrength(commonPassword);

      expect(result.score).toBeLessThan(50);
      expect(result.feedback.some((f) => f.includes("common"))).toBe(true);
    });
  });

  describe("Security Event Logging", () => {
    it("should log security events", () => {
      const event = {
        type: "login" as const,
        timestamp: new Date(),
        userId: "test-user",
        details: { success: true },
      };

      expect(() => {
        securityAuditService.logSecurityEvent(event);
      }).not.toThrow();
    });

    it("should detect suspicious activity", () => {
      const events = Array.from({ length: 6 }, (_, i) => ({
        type: "failed_auth" as const,
        timestamp: new Date(Date.now() - i * 60000), // 1 minute apart
        details: { attempt: i + 1 },
      }));

      const alerts = securityAuditService.detectSuspiciousActivity(events);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe("suspicious_login");
    });
  });

  describe("Vault Security Analysis", () => {
    it("should find weak passwords in vault", () => {
      const entries: PasswordEntry[] = [
        {
          id: "1",
          title: "Weak Entry",
          categoryId: "default",
          password: "123456",
          username: "user",
          website: "",
          description: "",
          notes: "",
          customFields: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        },
        {
          id: "2",
          title: "Strong Entry",
          categoryId: "default",
          password: "MyStr0ng!P@ssw0rd2024",
          username: "user",
          website: "",
          description: "",
          notes: "",
          customFields: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        },
      ];

      const weakPasswords = securityAuditService.findWeakPasswords(entries);
      expect(weakPasswords.length).toBe(1);
      expect(weakPasswords[0].id).toBe("1");
    });

    it("should find reused passwords", () => {
      const entries: PasswordEntry[] = [
        {
          id: "1",
          title: "Entry 1",
          categoryId: "default",
          password: "shared-password",
          username: "user1",
          website: "",
          description: "",
          notes: "",
          customFields: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        },
        {
          id: "2",
          title: "Entry 2",
          categoryId: "default",
          password: "shared-password",
          username: "user2",
          website: "",
          description: "",
          notes: "",
          customFields: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        },
      ];

      const reusedPasswords = securityAuditService.findReusedPasswords(entries);
      expect(reusedPasswords.length).toBe(2);
    });
  });
});

describe("DataProtectionService", () => {
  let dataProtectionService: DataProtectionService;

  beforeEach(async () => {
    dataProtectionService = DataProtectionService.getInstance();
    await dataProtectionService.initializeProtectionKey("test");
    jest.clearAllMocks();
  });

  afterEach(() => {
    dataProtectionService.cleanup();
  });

  describe("Data Protection", () => {
    it("should protect and unprotect data", async () => {
      const originalData = "sensitive information";

      // Mock encryption
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.decrypt.mockResolvedValue(
        new TextEncoder().encode(originalData)
      );

      const protectedData = await dataProtectionService.protect(
        originalData,
        "test"
      );
      expect(protectedData).toContain(SECURITY_CONSTANTS.PROTECTED_PREFIX);

      const unprotectedData = await dataProtectionService.unprotect(
        protectedData,
        "test"
      );
      expect(unprotectedData).toBe(originalData);
    });

    it("should handle already protected data", async () => {
      const alreadyProtected =
        SECURITY_CONSTANTS.PROTECTED_PREFIX + "already-protected";

      const result = await dataProtectionService.protect(
        alreadyProtected,
        "test"
      );
      expect(result).toBe(alreadyProtected);
    });

    it("should detect protected data correctly", () => {
      const protectedData = SECURITY_CONSTANTS.PROTECTED_PREFIX + "data";
      const unprotectedData = "normal data";

      expect(dataProtectionService.isProtected(protectedData)).toBe(true);
      expect(dataProtectionService.isProtected(unprotectedData)).toBe(false);
    });
  });
});

describe("Security Integration Tests", () => {
  it("should perform end-to-end encryption workflow", async () => {
    // Mock all crypto operations
    mockCrypto.subtle.importKey.mockResolvedValue({});
    mockCrypto.subtle.deriveKey.mockResolvedValue({});
    mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(48));
    mockCrypto.subtle.decrypt.mockResolvedValue(
      new TextEncoder().encode("decrypted-data")
    );

    const keyManagementService = KeyboxKeyManagementService.getInstance();
    const vaultService = KeyboxVaultService.getInstance();

    // Create master key
    const masterKey = await keyManagementService.createMasterKey(
      "test-password"
    );
    expect(masterKey).toBeDefined();

    // Generate user key
    const userKey = await keyManagementService.generateUserKey();
    expect(userKey).toBeDefined();

    // Encrypt user key with master key
    const encryptedUserKey = await keyManagementService.encryptUserKey(
      userKey,
      masterKey
    );
    expect(encryptedUserKey).toBeDefined();

    // Create test password entry
    const entry: PasswordEntry = {
      id: "test-id",
      title: "Test Entry",
      categoryId: "default",
      username: "testuser",
      password: "testpass",
      website: "https://example.com",
      description: "",
      notes: "Test notes",
      customFields: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
    };

    // Encrypt password entry
    const encryptedCipher = await vaultService.encryptCipher(entry, userKey);
    expect(encryptedCipher).toBeDefined();
    expect(encryptedCipher.name.data).toBeDefined();

    // This test validates the complete workflow works without errors
    expect(true).toBe(true);
  });

  it("should validate security constants", () => {
    expect(SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS).toBeGreaterThanOrEqual(
      600000
    );
    expect(SECURITY_CONSTANTS.MASTER_KEY_SIZE).toBe(32);
    expect(SECURITY_CONSTANTS.USER_KEY_SIZE).toBe(32);
    expect(SECURITY_CONSTANTS.SALT_SIZE).toBe(16);
    expect(SECURITY_CONSTANTS.PROTECTED_PREFIX).toBe("KB|");
  });
});
