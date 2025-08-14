// User authentication service with secure session management
// Implements Bitwarden-style authentication with master password and user keys

import {
  MasterKey,
  UserKey,
  SecureSession,
  SecuritySettings,
  KdfType,
  SECURITY_CONSTANTS,
} from "./types";
import { WebCryptoService } from "./cryptoService";
import { KeyboxKeyManagementService } from "./keyManagementService";
import { KeyboxSecurityAuditService } from "./securityUtils";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  kdfType: KdfType;
  kdfIterations: number;
  kdfMemory?: number;
  kdfParallelism?: number;
  kdfSalt: string; // Base64 encoded
  masterPasswordHash: string;
  userKeyEncrypted: string; // Base64 encoded encrypted user key
  securitySettings: SecuritySettings;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  masterPassword: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  name?: string;
  masterPassword: string;
  masterPasswordHint?: string;
  kdfType?: KdfType;
  kdfIterations?: number;
  kdfMemory?: number;
  kdfParallelism?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordHint?: string;
}

export class KeyboxAuthService {
  private static instance: KeyboxAuthService;
  private cryptoService: WebCryptoService;
  private keyManagementService: KeyboxKeyManagementService;
  private securityAuditService: KeyboxSecurityAuditService;
  private currentSession: SecureSession | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;

  public static getInstance(): KeyboxAuthService {
    if (!KeyboxAuthService.instance) {
      KeyboxAuthService.instance = new KeyboxAuthService();
    }
    return KeyboxAuthService.instance;
  }

  private constructor() {
    this.cryptoService = WebCryptoService.getInstance();
    this.keyManagementService = KeyboxKeyManagementService.getInstance();
    this.securityAuditService = KeyboxSecurityAuditService.getInstance();
  }

  // User registration
  async register(request: RegisterRequest): Promise<AuthUser> {
    // Validate password strength
    const passwordStrength = this.securityAuditService.analyzePasswordStrength(
      request.masterPassword
    );
    if (!passwordStrength.isStrong) {
      throw new Error(
        `Password is too weak: ${passwordStrength.feedback.join(", ")}`
      );
    }

    // Create master key with KDF
    const masterKey = await this.keyManagementService.createMasterKey(
      request.masterPassword,
      {
        type: request.kdfType || KdfType.PBKDF2_SHA256,
        iterations:
          request.kdfIterations || SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS,
        memory: request.kdfMemory,
        parallelism: request.kdfParallelism,
      }
    );

    // Generate user key
    const userKey = await this.keyManagementService.generateUserKey();

    // Encrypt user key with master key
    const encryptedUserKey = await this.keyManagementService.encryptUserKey(
      userKey,
      masterKey
    );

    // Create user object
    const user: AuthUser = {
      id: this.generateUserId(),
      email: request.email.toLowerCase(),
      name: request.name,
      kdfType: masterKey.kdfConfig.type,
      kdfIterations: masterKey.kdfConfig.iterations,
      kdfMemory: masterKey.kdfConfig.memory,
      kdfParallelism: masterKey.kdfConfig.parallelism,
      kdfSalt: this.cryptoService.arrayBufferToBase64(
        masterKey.kdfConfig.salt.buffer as ArrayBuffer
      ),
      masterPasswordHash: masterKey.hash,
      userKeyEncrypted: JSON.stringify(encryptedUserKey),
      securitySettings: this.getDefaultSecuritySettings(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Log security event
    this.securityAuditService.logSecurityEvent({
      type: "login",
      timestamp: new Date(),
      userId: user.id,
      details: { action: "register" },
    });

    // Clean up sensitive data
    this.keyManagementService.secureCleanup(masterKey, userKey);

    return user;
  }

  // User login
  async login(
    request: LoginRequest
  ): Promise<{ user: AuthUser; session: SecureSession }> {
    try {
      // In a real app, you'd fetch the user from your database
      const user = await this.getUserByEmail(request.email);
      if (!user) {
        throw new Error("User not found");
      }

      // Reconstruct KDF config
      const kdfConfig = {
        type: user.kdfType,
        iterations: user.kdfIterations,
        memory: user.kdfMemory,
        parallelism: user.kdfParallelism,
        salt: this.base64ToUint8Array(user.kdfSalt),
      };

      // Unlock master key
      const masterKey = await this.keyManagementService.unlockWithMasterKey(
        request.masterPassword,
        user.masterPasswordHash,
        kdfConfig
      );

      // Decrypt user key
      const encryptedUserKey = JSON.parse(user.userKeyEncrypted);
      const userKey = await this.keyManagementService.decryptUserKey(
        encryptedUserKey,
        masterKey
      );

      // Create secure session
      const session = await this.createSession(user, userKey, masterKey.hash);

      // Log successful login
      this.securityAuditService.logSecurityEvent({
        type: "login",
        timestamp: new Date(),
        userId: user.id,
        details: { success: true },
      });

      // Clean up master key (keep user key in session)
      this.keyManagementService.secureCleanup(masterKey);

      return { user, session };
    } catch (error) {
      // Log failed login attempt
      this.securityAuditService.logSecurityEvent({
        type: "failed_auth",
        timestamp: new Date(),
        details: {
          email: request.email,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  // Change master password
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    if (!this.currentSession) {
      throw new Error("No active session");
    }

    // Validate new password strength
    const passwordStrength = this.securityAuditService.analyzePasswordStrength(
      request.newPassword
    );
    if (!passwordStrength.isStrong) {
      throw new Error(
        `New password is too weak: ${passwordStrength.feedback.join(", ")}`
      );
    }

    // Get current user
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const currentKdfConfig = {
      type: user.kdfType,
      iterations: user.kdfIterations,
      memory: user.kdfMemory,
      parallelism: user.kdfParallelism,
      salt: this.base64ToUint8Array(user.kdfSalt),
    };

    const currentMasterKey =
      await this.keyManagementService.unlockWithMasterKey(
        request.currentPassword,
        user.masterPasswordHash,
        currentKdfConfig
      );

    // Create new master key
    const newMasterKey = await this.keyManagementService.createMasterKey(
      request.newPassword
    );

    // Rotate user key
    const newUserKey = await this.keyManagementService.rotateUserKey(
      this.currentSession.userKey,
      newMasterKey
    );

    // Update user record
    user.kdfType = newMasterKey.kdfConfig.type;
    user.kdfIterations = newMasterKey.kdfConfig.iterations;
    user.kdfMemory = newMasterKey.kdfConfig.memory;
    user.kdfParallelism = newMasterKey.kdfConfig.parallelism;
    user.kdfSalt = this.cryptoService.arrayBufferToBase64(
      newMasterKey.kdfConfig.salt.buffer as ArrayBuffer
    );
    user.masterPasswordHash = newMasterKey.hash;
    user.userKeyEncrypted = JSON.stringify(newUserKey.encryptedKey);
    user.updatedAt = new Date().toISOString();

    // Update session
    this.currentSession.userKey = newUserKey;
    this.currentSession.masterKeyHash = newMasterKey.hash;

    // Log password change
    this.securityAuditService.logSecurityEvent({
      type: "key_rotation",
      timestamp: new Date(),
      userId: user.id,
      details: { action: "password_change" },
    });

    // Clean up old keys
    this.keyManagementService.secureCleanup(currentMasterKey, undefined, []);
    this.keyManagementService.secureCleanup(newMasterKey);

    // In a real app, you'd save the updated user to your database
    await this.saveUser(user);
  }

  // Session management
  private async createSession(
    user: AuthUser,
    userKey: UserKey,
    masterKeyHash: string
  ): Promise<SecureSession> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(
      Date.now() + user.securitySettings.sessionTimeout * 60 * 1000
    );

    const session: SecureSession = {
      userKey,
      masterKeyHash,
      sessionId,
      expiresAt,
      lastActivity: new Date(),
    };

    this.currentSession = session;
    this.startSessionTimeout(user.securitySettings.sessionTimeout);

    return session;
  }

  private startSessionTimeout(timeoutMinutes: number): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    this.sessionTimeout = setTimeout(() => {
      this.logout();
    }, timeoutMinutes * 60 * 1000);
  }

  // Get current session
  getCurrentSession(): SecureSession | null {
    if (this.currentSession && this.currentSession.expiresAt > new Date()) {
      this.currentSession.lastActivity = new Date();
      return this.currentSession;
    }

    // Session expired
    this.logout();
    return null;
  }

  // Logout
  logout(): void {
    if (this.currentSession) {
      // Log logout event
      this.securityAuditService.logSecurityEvent({
        type: "login",
        timestamp: new Date(),
        details: { action: "logout" },
      });

      // Clean up session
      this.keyManagementService.secureCleanup(
        undefined,
        this.currentSession.userKey
      );
      this.currentSession = null;
    }

    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  // Utility methods
  private generateUserId(): string {
    return crypto.randomUUID();
  }

  private generateSessionId(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(randomBytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private getDefaultSecuritySettings(): SecuritySettings {
    return {
      kdfType: KdfType.PBKDF2_SHA256,
      kdfIterations: SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS,
      encryptionType: 0, // AES_GCM_256
      requireMasterPasswordReprompt: false,
      sessionTimeout: SECURITY_CONSTANTS.DEFAULT_SESSION_TIMEOUT,
      lockOnIdle: true,
      clearClipboard: 30,
    };
  }

  // Placeholder methods for database operations
  // In a real app, these would interact with your database
  private async getUserByEmail(email: string): Promise<AuthUser | null> {
    // TODO: Implement database lookup
    return null;
  }

  private async getCurrentUser(): Promise<AuthUser | null> {
    // TODO: Implement current user lookup
    return null;
  }

  private async saveUser(user: AuthUser): Promise<void> {
    // TODO: Implement user save to database
  }
}
