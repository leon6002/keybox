// Core cryptographic service implementation
// Based on Bitwarden's encryption patterns with Web Crypto API

import {
  CryptoService,
  EncryptionType,
  EncryptedString,
  KdfType,
  KdfConfig,
  SECURITY_CONSTANTS,
} from "./types";

export class WebCryptoService implements CryptoService {
  private static instance: WebCryptoService;

  public static getInstance(): WebCryptoService {
    if (!WebCryptoService.instance) {
      WebCryptoService.instance = new WebCryptoService();
    }
    return WebCryptoService.instance;
  }

  private constructor() {
    if (!this.isWebCryptoSupported()) {
      throw new Error("Web Crypto API is not supported in this environment");
    }
  }

  private isWebCryptoSupported(): boolean {
    return (
      typeof crypto !== "undefined" &&
      typeof crypto.subtle !== "undefined" &&
      typeof crypto.subtle.encrypt === "function" &&
      typeof crypto.subtle.decrypt === "function" &&
      typeof crypto.subtle.deriveKey === "function"
    );
  }

  // Key derivation functions
  async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    kdfConfig: KdfConfig
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    let derivedKey: CryptoKey;

    switch (kdfConfig.type) {
      case KdfType.PBKDF2_SHA256:
        derivedKey = await crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: salt,
            iterations: kdfConfig.iterations,
            hash: "SHA-256",
          },
          keyMaterial,
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );
        break;

      case KdfType.ARGON2ID:
        // Note: Web Crypto API doesn't support Argon2 natively
        // For production, consider using a WebAssembly implementation
        throw new Error("Argon2id not yet implemented in Web Crypto API");

      default:
        throw new Error(`Unsupported KDF type: ${kdfConfig.type}`);
    }

    const exportedKey = await crypto.subtle.exportKey("raw", derivedKey);
    return new Uint8Array(exportedKey);
  }

  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(SECURITY_CONSTANTS.SALT_SIZE));
  }

  generateKey(): Uint8Array {
    return crypto.getRandomValues(
      new Uint8Array(SECURITY_CONSTANTS.USER_KEY_SIZE)
    );
  }

  // Encryption/Decryption
  async encrypt(
    data: string,
    key: Uint8Array,
    type: EncryptionType = EncryptionType.AES_GCM_256
  ): Promise<EncryptedString> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    switch (type) {
      case EncryptionType.AES_GCM_256:
        return this.encryptAesGcm(dataBytes, key);
      case EncryptionType.AES_CBC_256_HMAC_SHA256:
        return this.encryptAesCbcHmac(dataBytes, key);
      default:
        throw new Error(`Unsupported encryption type: ${type}`);
    }
  }

  async decrypt(
    encryptedData: EncryptedString,
    key: Uint8Array
  ): Promise<string> {
    let decryptedBytes: Uint8Array;

    switch (encryptedData.encryptionType) {
      case EncryptionType.AES_GCM_256:
        decryptedBytes = await this.decryptAesGcm(encryptedData, key);
        break;
      case EncryptionType.AES_CBC_256_HMAC_SHA256:
        decryptedBytes = await this.decryptAesCbcHmac(encryptedData, key);
        break;
      default:
        throw new Error(
          `Unsupported encryption type: ${encryptedData.encryptionType}`
        );
    }

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBytes);
  }

  // AES-GCM encryption (recommended)
  private async encryptAesGcm(
    data: Uint8Array,
    key: Uint8Array
  ): Promise<EncryptedString> {
    const iv = crypto.getRandomValues(
      new Uint8Array(SECURITY_CONSTANTS.IV_SIZE)
    );

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      cryptoKey,
      data
    );

    return {
      encryptionType: EncryptionType.AES_GCM_256,
      data: this.arrayBufferToBase64(encryptedData),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  private async decryptAesGcm(
    encryptedData: EncryptedString,
    key: Uint8Array
  ): Promise<Uint8Array> {
    if (!encryptedData.iv) {
      throw new Error("IV is required for AES-GCM decryption");
    }

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = this.base64ToArrayBuffer(encryptedData.data);

    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      cryptoKey,
      ciphertext
    );

    return new Uint8Array(decryptedData);
  }

  // AES-CBC with HMAC-SHA256 (for compatibility)
  private async encryptAesCbcHmac(
    data: Uint8Array,
    key: Uint8Array
  ): Promise<EncryptedString> {
    const iv = crypto.getRandomValues(new Uint8Array(16)); // 128-bit IV for CBC
    const encKey = key.slice(0, 32); // First 32 bytes for encryption
    const macKey = key.slice(32, 64); // Next 32 bytes for MAC (requires 64-byte key)

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encKey,
      { name: "AES-CBC" },
      false,
      ["encrypt"]
    );

    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: iv },
      cryptoKey,
      data
    );

    // Calculate HMAC
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      macKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const macData = new Uint8Array(iv.length + encryptedData.byteLength);
    macData.set(iv, 0);
    macData.set(new Uint8Array(encryptedData), iv.length);

    const mac = await crypto.subtle.sign("HMAC", hmacKey, macData);

    return {
      encryptionType: EncryptionType.AES_CBC_256_HMAC_SHA256,
      data: this.arrayBufferToBase64(encryptedData),
      iv: this.arrayBufferToBase64(iv),
      mac: this.arrayBufferToBase64(mac),
    };
  }

  private async decryptAesCbcHmac(
    encryptedData: EncryptedString,
    key: Uint8Array
  ): Promise<Uint8Array> {
    if (!encryptedData.iv || !encryptedData.mac) {
      throw new Error("IV and MAC are required for AES-CBC-HMAC decryption");
    }

    const encKey = key.slice(0, 32);
    const macKey = key.slice(32, 64);

    // Verify MAC first
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      macKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = this.base64ToArrayBuffer(encryptedData.data);
    const mac = this.base64ToArrayBuffer(encryptedData.mac);

    const macData = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    macData.set(new Uint8Array(iv), 0);
    macData.set(new Uint8Array(ciphertext), iv.byteLength);

    const isValid = await crypto.subtle.verify("HMAC", hmacKey, mac, macData);
    if (!isValid) {
      throw new Error("MAC verification failed");
    }

    // Decrypt
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encKey,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: iv },
      cryptoKey,
      ciphertext
    );

    return new Uint8Array(decryptedData);
  }

  // Key encryption/decryption
  async encryptKey(
    key: Uint8Array,
    encryptionKey: Uint8Array
  ): Promise<EncryptedString> {
    return this.encrypt(this.arrayBufferToBase64(key), encryptionKey);
  }

  async decryptKey(
    encryptedKey: EncryptedString,
    decryptionKey: Uint8Array
  ): Promise<Uint8Array> {
    console.log("🔓 CryptoService.decryptKey called with:", {
      encryptionType: encryptedKey.encryptionType,
      dataLength: encryptedKey.data?.length,
      ivLength: encryptedKey.iv?.length,
      decryptionKeyLength: decryptionKey.length,
    });

    try {
      const keyBase64 = await this.decrypt(encryptedKey, decryptionKey);
      console.log("✅ Decrypted key as base64, length:", keyBase64.length);

      const result = this.base64ToArrayBuffer(keyBase64);
      console.log("✅ Converted to ArrayBuffer, length:", result.length);

      return result;
    } catch (error) {
      console.error("❌ DecryptKey failed:", error);
      throw error;
    }
  }

  // Password hashing
  async hashPassword(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const hashBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    return this.arrayBufferToBase64(hashBits);
  }

  async verifyPassword(
    password: string,
    hash: string,
    salt: Uint8Array
  ): Promise<boolean> {
    const computedHash = await this.hashPassword(password, salt);
    return this.constantTimeEquals(
      new TextEncoder().encode(computedHash),
      new TextEncoder().encode(hash)
    );
  }

  // Utility functions
  generateSecureRandom(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }

    return result === 0;
  }

  secureZero(data: Uint8Array): void {
    // Note: This doesn't guarantee memory is actually zeroed in JavaScript
    // but it's the best we can do in a browser environment
    for (let i = 0; i < data.length; i++) {
      data[i] = 0;
    }
  }

  // Helper methods
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Additional utility methods
  async generateKeyPair(): Promise<{
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  }> {
    // Generate RSA key pair for asymmetric operations
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );

    return {
      publicKey: new Uint8Array(publicKey),
      privateKey: new Uint8Array(privateKey),
    };
  }

  async encryptWithPublicKey(
    data: string,
    publicKey: Uint8Array
  ): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      "spki",
      publicKey,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );

    const encryptedData = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      dataBytes
    );

    return this.arrayBufferToBase64(encryptedData);
  }

  async decryptWithPrivateKey(
    encryptedData: string,
    privateKey: Uint8Array
  ): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKey,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    const ciphertext = this.base64ToArrayBuffer(encryptedData);
    const decryptedData = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  // Add missing method for file hash generation
  async generateFileHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
    return this.arrayBufferToBase64(hashBuffer);
  }
}
