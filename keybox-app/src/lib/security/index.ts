// Security module exports
// Centralized exports for all security-related services and types

// Types and interfaces
export * from "./types";

// Core services
export { WebCryptoService } from "./cryptoService";
export { KeyboxKeyManagementService } from "./keyManagementService";
export { KeyboxVaultService } from "./vaultService";
export { KeyboxAuthService } from "./authService";
export type { AuthUser, LoginRequest, RegisterRequest } from "./authService";
export {
  DataProtectionService,
  DatabaseFieldProtector,
  DatabaseProtectionUtils,
} from "./dataProtectionService";

// Security utilities
export { KeyboxSecurityAuditService, SecureUtils } from "./securityUtils";

// Import services for internal use in factory
import { WebCryptoService } from "./cryptoService";
import { KeyboxKeyManagementService } from "./keyManagementService";
import { KeyboxVaultService } from "./vaultService";
import { KeyboxAuthService } from "./authService";
import { DataProtectionService } from "./dataProtectionService";
import { KeyboxSecurityAuditService } from "./securityUtils";
import {
  SecuritySettings,
  KdfType,
  SECURITY_CONSTANTS,
  EncryptionType,
} from "./types";

// Convenience factory functions
export class SecurityServiceFactory {
  private static cryptoService: WebCryptoService;
  private static keyManagementService: KeyboxKeyManagementService;
  private static vaultService: KeyboxVaultService;
  private static authService: KeyboxAuthService;
  private static dataProtectionService: DataProtectionService;
  private static securityAuditService: KeyboxSecurityAuditService;

  // Get crypto service instance
  static getCryptoService(): WebCryptoService {
    if (!this.cryptoService) {
      this.cryptoService = WebCryptoService.getInstance();
    }
    return this.cryptoService;
  }

  // Get key management service instance
  static getKeyManagementService(): KeyboxKeyManagementService {
    if (!this.keyManagementService) {
      this.keyManagementService = KeyboxKeyManagementService.getInstance();
    }
    return this.keyManagementService;
  }

  // Get vault service instance
  static getVaultService(): KeyboxVaultService {
    if (!this.vaultService) {
      this.vaultService = KeyboxVaultService.getInstance();
    }
    return this.vaultService;
  }

  // Get auth service instance
  static getAuthService(): KeyboxAuthService {
    if (!this.authService) {
      this.authService = KeyboxAuthService.getInstance();
    }
    return this.authService;
  }

  // Get data protection service instance
  static getDataProtectionService(): DataProtectionService {
    if (!this.dataProtectionService) {
      this.dataProtectionService = DataProtectionService.getInstance();
    }
    return this.dataProtectionService;
  }

  // Get security audit service instance
  static getSecurityAuditService(): KeyboxSecurityAuditService {
    if (!this.securityAuditService) {
      this.securityAuditService = KeyboxSecurityAuditService.getInstance();
    }
    return this.securityAuditService;
  }

  // Initialize all services
  static async initializeServices(masterKey?: Uint8Array): Promise<void> {
    // Initialize crypto service (always available)
    this.getCryptoService();

    // Initialize key management service
    this.getKeyManagementService();

    // Initialize vault service
    this.getVaultService();

    // Initialize auth service
    this.getAuthService();

    // Initialize data protection service
    const dataProtectionService = this.getDataProtectionService();
    if (masterKey) {
      await dataProtectionService.initializeProtectionKey("default", masterKey);
      await dataProtectionService.initializeProtectionKey(
        "user_auth",
        masterKey
      );
      await dataProtectionService.initializeProtectionKey(
        "user_keys",
        masterKey
      );
      await dataProtectionService.initializeProtectionKey(
        "cipher_data",
        masterKey
      );
      await dataProtectionService.initializeProtectionKey(
        "cipher_keys",
        masterKey
      );
    }

    // Initialize security audit service
    this.getSecurityAuditService();
  }

  // Clean up all services
  static cleanup(): void {
    if (this.authService) {
      this.authService.logout();
    }

    if (this.dataProtectionService) {
      this.dataProtectionService.cleanup();
    }

    // Reset instances
    this.cryptoService = null as any;
    this.keyManagementService = null as any;
    this.vaultService = null as any;
    this.authService = null as any;
    this.dataProtectionService = null as any;
    this.securityAuditService = null as any;
  }
}

// Security configuration and validation
export class SecurityConfig {
  // Validate security configuration
  static validateConfig(config: Partial<SecuritySettings>): string[] {
    const errors: string[] = [];

    if (config.kdfIterations !== undefined) {
      if (config.kdfType === KdfType.PBKDF2_SHA256) {
        if (config.kdfIterations < SECURITY_CONSTANTS.PBKDF2_MIN_ITERATIONS) {
          errors.push(
            `PBKDF2 iterations too low (minimum: ${SECURITY_CONSTANTS.PBKDF2_MIN_ITERATIONS})`
          );
        }
        if (config.kdfIterations > SECURITY_CONSTANTS.PBKDF2_MAX_ITERATIONS) {
          errors.push(
            `PBKDF2 iterations too high (maximum: ${SECURITY_CONSTANTS.PBKDF2_MAX_ITERATIONS})`
          );
        }
      } else if (config.kdfType === KdfType.ARGON2ID) {
        if (config.kdfIterations < SECURITY_CONSTANTS.ARGON2_MIN_ITERATIONS) {
          errors.push(
            `Argon2 iterations too low (minimum: ${SECURITY_CONSTANTS.ARGON2_MIN_ITERATIONS})`
          );
        }
        if (config.kdfIterations > SECURITY_CONSTANTS.ARGON2_MAX_ITERATIONS) {
          errors.push(
            `Argon2 iterations too high (maximum: ${SECURITY_CONSTANTS.ARGON2_MAX_ITERATIONS})`
          );
        }
      }
    }

    if (config.kdfMemory !== undefined && config.kdfType === KdfType.ARGON2ID) {
      if (config.kdfMemory < SECURITY_CONSTANTS.ARGON2_MIN_MEMORY) {
        errors.push(
          `Argon2 memory too low (minimum: ${SECURITY_CONSTANTS.ARGON2_MIN_MEMORY}MB)`
        );
      }
      if (config.kdfMemory > SECURITY_CONSTANTS.ARGON2_MAX_MEMORY) {
        errors.push(
          `Argon2 memory too high (maximum: ${SECURITY_CONSTANTS.ARGON2_MAX_MEMORY}MB)`
        );
      }
    }

    if (config.sessionTimeout !== undefined) {
      if (config.sessionTimeout < 1) {
        errors.push("Session timeout must be at least 1 minute");
      }
      if (config.sessionTimeout > SECURITY_CONSTANTS.MAX_SESSION_TIMEOUT) {
        errors.push(
          `Session timeout too high (maximum: ${SECURITY_CONSTANTS.MAX_SESSION_TIMEOUT} minutes)`
        );
      }
    }

    return errors;
  }

  // Get recommended security settings
  static getRecommendedSettings(): SecuritySettings {
    return {
      kdfType: KdfType.PBKDF2_SHA256,
      kdfIterations: SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS,
      encryptionType: EncryptionType.AES_GCM_256,
      requireMasterPasswordReprompt: false,
      sessionTimeout: SECURITY_CONSTANTS.DEFAULT_SESSION_TIMEOUT,
      lockOnIdle: true,
      clearClipboard: 30,
    };
  }

  // Get high security settings
  static getHighSecuritySettings(): SecuritySettings {
    return {
      kdfType: KdfType.PBKDF2_SHA256,
      kdfIterations: 1000000, // Higher iterations
      encryptionType: EncryptionType.AES_GCM_256,
      requireMasterPasswordReprompt: true,
      sessionTimeout: 15, // Shorter session
      lockOnIdle: true,
      clearClipboard: 10, // Clear clipboard faster
    };
  }
}

// Security status and health check
export class SecurityHealthCheck {
  // Check overall security health
  static async checkSecurityHealth(): Promise<{
    status: "good" | "warning" | "critical";
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check Web Crypto API support
    if (!SecurityServiceFactory.getCryptoService()) {
      issues.push("Web Crypto API not supported");
      return {
        status: "critical",
        issues,
        recommendations: ["Use a modern browser that supports Web Crypto API"],
      };
    }

    // Check if services are initialized
    try {
      SecurityServiceFactory.getCryptoService();
      SecurityServiceFactory.getKeyManagementService();
      SecurityServiceFactory.getVaultService();
    } catch (error) {
      issues.push("Security services not properly initialized");
      recommendations.push("Initialize security services before use");
    }

    // Check for recent security events
    const auditService = SecurityServiceFactory.getSecurityAuditService();
    const recentEvents = auditService.getRecentSecurityEvents(1); // Last hour
    const alerts = auditService.detectSuspiciousActivity(recentEvents);

    if (alerts.length > 0) {
      issues.push(`${alerts.length} security alerts detected`);
      recommendations.push(
        "Review security alerts and take appropriate action"
      );
    }

    // Determine overall status
    let status: "good" | "warning" | "critical" = "good";
    if (issues.length > 0) {
      status = alerts.some((a) => a.severity === "critical")
        ? "critical"
        : "warning";
    }

    return { status, issues, recommendations };
  }

  // Check browser security features
  static checkBrowserSecurity(): {
    webCrypto: boolean;
    secureContext: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
  } {
    return {
      webCrypto:
        typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined",
      secureContext:
        typeof window !== "undefined" ? window.isSecureContext : true,
      localStorage: typeof localStorage !== "undefined",
      sessionStorage: typeof sessionStorage !== "undefined",
    };
  }
}

// Re-export commonly used types and constants
export { KdfType, EncryptionType, SECURITY_CONSTANTS } from "./types";

export type {
  SecuritySettings,
  MasterKey,
  UserKey,
  EncryptedString,
  EncryptedCipher,
  SecureSession,
} from "./types";
