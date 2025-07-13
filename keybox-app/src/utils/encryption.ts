// 加密工具类
export class EncryptionUtil {
  // 生成密钥
  private static async generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // 加密数据
  static async encryptData(data: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const key = await this.generateKey(password, salt);
      const encodedData = encoder.encode(data);
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encodedData
      );

      // 将 salt、iv 和加密数据组合
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

      // 转换为 Base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('加密失败');
    }
  }

  // 解密数据
  static async decryptData(encryptedData: string, password: string): Promise<string> {
    try {
      // 从 Base64 解码
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      // 提取 salt、iv 和加密数据
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encrypted = combined.slice(28);

      const key = await this.generateKey(password, salt);
      
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('解密失败，请检查密码是否正确');
    }
  }

  // 生成强密码
  static generateStrongPassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  // 验证密码强度
  static validatePasswordStrength(password: string): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length >= 12) {
      score += 25;
    } else if (password.length >= 8) {
      score += 15;
    } else {
      feedback.push('密码长度至少应为8位');
    }

    // 字符类型检查
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    const charTypeCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;
    score += charTypeCount * 15;

    if (!hasUppercase) feedback.push('建议包含大写字母');
    if (!hasLowercase) feedback.push('建议包含小写字母');
    if (!hasNumbers) feedback.push('建议包含数字');
    if (!hasSymbols) feedback.push('建议包含特殊符号');

    // 重复字符检查
    const repeatedChars = password.match(/(.)\1{2,}/g);
    if (repeatedChars) {
      score -= repeatedChars.length * 10;
      feedback.push('避免连续重复字符');
    }

    // 常见模式检查
    const commonPatterns = [
      /123456/,
      /abcdef/,
      /qwerty/,
      /password/i,
    ];

    commonPatterns.forEach(pattern => {
      if (pattern.test(password)) {
        score -= 20;
        feedback.push('避免使用常见模式');
      }
    });

    score = Math.max(0, Math.min(100, score));
    const isStrong = score >= 70;

    return { isStrong, score, feedback };
  }

  // 生成文件哈希（用于验证文件完整性）
  static async generateFileHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 验证文件完整性
  static async verifyFileIntegrity(data: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.generateFileHash(data);
    return actualHash === expectedHash;
  }

  // 创建加密文件元数据
  static createEncryptedFileMetadata() {
    return {
      version: '1.0.0',
      algorithm: 'AES-GCM',
      keyDerivation: 'PBKDF2',
      iterations: 100000,
      createdAt: new Date().toISOString(),
      application: 'KeyBox Password Manager'
    };
  }

  // 检查浏览器是否支持 Web Crypto API
  static isWebCryptoSupported(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.subtle.encrypt === 'function' &&
           typeof crypto.subtle.decrypt === 'function';
  }
}
