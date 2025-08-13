// Security utilities and helpers
// Implements security audit, password analysis, and monitoring features

import {
  SecurityAuditService,
  PasswordStrengthResult,
  SecurityEvent,
  SecurityAlert,
  SECURITY_CONSTANTS,
} from './types';
import { PasswordEntry } from '../../types/password';

export class KeyboxSecurityAuditService implements SecurityAuditService {
  private static instance: KeyboxSecurityAuditService;
  private securityEvents: SecurityEvent[] = [];

  public static getInstance(): KeyboxSecurityAuditService {
    if (!KeyboxSecurityAuditService.instance) {
      KeyboxSecurityAuditService.instance = new KeyboxSecurityAuditService();
    }
    return KeyboxSecurityAuditService.instance;
  }

  private constructor() {}

  // Password strength analysis
  analyzePasswordStrength(password: string): PasswordStrengthResult {
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 12) {
      score += 25;
    } else if (password.length >= 8) {
      score += 15;
      feedback.push('Consider using a longer password (12+ characters)');
    } else {
      score += 5;
      feedback.push('Password is too short (minimum 8 characters)');
    }

    // Character variety
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;
    score += varietyCount * 15;

    if (varietyCount < 3) {
      feedback.push('Use a mix of uppercase, lowercase, numbers, and symbols');
    }

    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /(.)\1{2,}/, // Repeated characters
      /^(.+)\1+$/, // Repeated patterns
    ];

    commonPatterns.forEach(pattern => {
      if (pattern.test(password)) {
        score -= 20;
        feedback.push('Avoid common patterns and repeated characters');
      }
    });

    // Dictionary words (simplified check)
    const commonWords = ['password', 'admin', 'user', 'login', 'welcome', 'secret'];
    const lowerPassword = password.toLowerCase();
    commonWords.forEach(word => {
      if (lowerPassword.includes(word)) {
        score -= 15;
        feedback.push('Avoid common dictionary words');
      }
    });

    // Sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password) ||
        /(?:012|123|234|345|456|567|678|789)/.test(password)) {
      score -= 10;
      feedback.push('Avoid sequential characters');
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    const isStrong = score >= 70;

    // Estimate crack time (simplified)
    let estimatedCrackTime = 'Less than a day';
    if (score >= 90) {
      estimatedCrackTime = 'Centuries';
    } else if (score >= 80) {
      estimatedCrackTime = 'Years';
    } else if (score >= 70) {
      estimatedCrackTime = 'Months';
    } else if (score >= 60) {
      estimatedCrackTime = 'Weeks';
    } else if (score >= 50) {
      estimatedCrackTime = 'Days';
    }

    return {
      score,
      isStrong,
      feedback,
      estimatedCrackTime,
    };
  }

  // Data breach check (placeholder - would integrate with HaveIBeenPwned API)
  async checkForDataBreaches(password: string): Promise<boolean> {
    // In a real implementation, this would hash the password and check against
    // the HaveIBeenPwned API or similar service
    
    // For now, return false (no breach detected)
    // TODO: Implement actual breach checking
    console.warn('Data breach checking not yet implemented');
    return false;
  }

  // Find weak passwords in vault
  findWeakPasswords(ciphers: PasswordEntry[]): PasswordEntry[] {
    const weakPasswords: PasswordEntry[] = [];

    ciphers.forEach(cipher => {
      if (cipher.password) {
        const strength = this.analyzePasswordStrength(cipher.password);
        if (!strength.isStrong) {
          weakPasswords.push(cipher);
        }
      }
    });

    return weakPasswords;
  }

  // Find reused passwords
  findReusedPasswords(ciphers: PasswordEntry[]): PasswordEntry[] {
    const passwordMap = new Map<string, PasswordEntry[]>();
    const reusedPasswords: PasswordEntry[] = [];

    // Group ciphers by password
    ciphers.forEach(cipher => {
      if (cipher.password) {
        const existing = passwordMap.get(cipher.password) || [];
        existing.push(cipher);
        passwordMap.set(cipher.password, existing);
      }
    });

    // Find passwords used more than once
    passwordMap.forEach((entries, password) => {
      if (entries.length > 1) {
        reusedPasswords.push(...entries);
      }
    });

    return reusedPasswords;
  }

  // Security event logging
  logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);

    // Keep only recent events (last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Event:', event);
    }
  }

  // Detect suspicious activity
  detectSuspiciousActivity(events: SecurityEvent[]): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const recentEvents = events.filter(e => now.getTime() - e.timestamp.getTime() < oneHour);

    // Check for multiple failed login attempts
    const failedLogins = recentEvents.filter(e => e.type === 'failed_auth');
    if (failedLogins.length >= SECURITY_CONSTANTS.MAX_FAILED_ATTEMPTS) {
      alerts.push({
        type: 'suspicious_login',
        severity: 'high',
        message: `${failedLogins.length} failed login attempts in the last hour`,
        timestamp: now,
      });
    }

    // Check for unusual export activity
    const exports = recentEvents.filter(e => e.type === 'export');
    if (exports.length > 3) {
      alerts.push({
        type: 'suspicious_login',
        severity: 'medium',
        message: `Multiple data exports detected (${exports.length} in the last hour)`,
        timestamp: now,
      });
    }

    return alerts;
  }

  // Generate security report
  generateSecurityReport(ciphers: PasswordEntry[]): {
    weakPasswords: PasswordEntry[];
    reusedPasswords: PasswordEntry[];
    overallScore: number;
    recommendations: string[];
  } {
    const weakPasswords = this.findWeakPasswords(ciphers);
    const reusedPasswords = this.findReusedPasswords(ciphers);
    const recommendations: string[] = [];

    // Calculate overall security score
    let totalScore = 0;
    let passwordCount = 0;

    ciphers.forEach(cipher => {
      if (cipher.password) {
        const strength = this.analyzePasswordStrength(cipher.password);
        totalScore += strength.score;
        passwordCount++;
      }
    });

    const overallScore = passwordCount > 0 ? Math.round(totalScore / passwordCount) : 0;

    // Generate recommendations
    if (weakPasswords.length > 0) {
      recommendations.push(`Update ${weakPasswords.length} weak passwords`);
    }

    if (reusedPasswords.length > 0) {
      const uniqueReused = new Set(reusedPasswords.map(p => p.password)).size;
      recommendations.push(`Change ${uniqueReused} reused passwords`);
    }

    if (overallScore < 70) {
      recommendations.push('Consider using a password generator for stronger passwords');
    }

    if (ciphers.length > 50 && !recommendations.length) {
      recommendations.push('Great job! Your password security looks good');
    }

    return {
      weakPasswords,
      reusedPasswords,
      overallScore,
      recommendations,
    };
  }

  // Clear security events (for privacy)
  clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  // Get recent security events
  getRecentSecurityEvents(hours: number = 24): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.securityEvents.filter(event => event.timestamp >= cutoff);
  }
}

// Utility functions for secure operations
export class SecureUtils {
  // Generate secure random string
  static generateSecureId(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
  }

  // Generate secure random password
  static generateSecurePassword(options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
  } = {}): string {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true,
    } = options;

    let chars = '';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      chars = chars.replace(/[0O1lI]/g, '');
    }

    if (!chars) {
      throw new Error('No character types selected for password generation');
    }

    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i] % chars.length];
    }
    
    return password;
  }

  // Secure string comparison
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  // Generate TOTP-style code for additional verification
  static generateVerificationCode(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(3));
    let code = '';
    
    for (let i = 0; i < 3; i++) {
      code += (randomBytes[i] % 100).toString().padStart(2, '0');
    }
    
    return code;
  }
}
