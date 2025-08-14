// Core cryptographic service implementation
// Based on Bitwarden's encryption patterns with Web Crypto API
// Includes fallback for mobile browsers that don't support Web Crypto API

import {
  CryptoService,
  EncryptionType,
  EncryptedString,
  KdfType,
  KdfConfig,
  SECURITY_CONSTANTS,
} from "./types";
import CryptoJS from "crypto-js";

export class WebCryptoService implements CryptoService {
  private static instance: WebCryptoService;
  private useWebCrypto: boolean;

  public static getInstance(): WebCryptoService {
    if (!WebCryptoService.instance) {
      WebCryptoService.instance = new WebCryptoService();
    }
    return WebCryptoService.instance;
  }

  private constructor() {
    this.useWebCrypto = this.isWebCryptoSupported();
    if (!this.useWebCrypto) {
      console.warn(
        "⚠️ Web Crypto API not supported, using CryptoJS fallback for mobile compatibility"
      );
    } else {
      console.log("✅ Web Crypto API supported, using native implementation");
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
    if (this.useWebCrypto) {
      return this.deriveKeyWebCrypto(password, salt, kdfConfig);
    } else {
      return this.deriveKeyFallback(password, salt, kdfConfig);
    }
  }

  private async deriveKeyWebCrypto(
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
        throw new Error("Argon2id not yet implemented in Web Crypto API");

      default:
        throw new Error(`Unsupported KDF type: ${kdfConfig.type}`);
    }

    const exportedKey = await crypto.subtle.exportKey("raw", derivedKey);
    return new Uint8Array(exportedKey);
  }

  private async deriveKeyFallback(
    password: string,
    salt: Uint8Array,
    kdfConfig: KdfConfig
  ): Promise<Uint8Array> {
    switch (kdfConfig.type) {
      case KdfType.PBKDF2_SHA256:
        // Convert Uint8Array to WordArray for CryptoJS
        const saltWordArray = CryptoJS.lib.WordArray.create(Array.from(salt));
        const derived = CryptoJS.PBKDF2(password, saltWordArray, {
          keySize: 256 / 32, // 256 bits = 8 words of 32 bits each
          iterations: kdfConfig.iterations,
          hasher: CryptoJS.algo.SHA256,
        });

        // Convert WordArray back to Uint8Array
        const words = derived.words;
        const result = new Uint8Array(32); // 256 bits = 32 bytes
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          result[i * 4] = (word >>> 24) & 0xff;
          result[i * 4 + 1] = (word >>> 16) & 0xff;
          result[i * 4 + 2] = (word >>> 8) & 0xff;
          result[i * 4 + 3] = word & 0xff;
        }
        return result;

      case KdfType.ARGON2ID:
        throw new Error("Argon2id not implemented in fallback mode");

      default:
        throw new Error(`Unsupported KDF type: ${kdfConfig.type}`);
    }
  }

  generateSalt(): Uint8Array {
    if (
      this.useWebCrypto &&
      typeof crypto !== "undefined" &&
      crypto.getRandomValues
    ) {
      return crypto.getRandomValues(
        new Uint8Array(SECURITY_CONSTANTS.SALT_SIZE)
      );
    } else {
      // Fallback using CryptoJS
      const randomWords = CryptoJS.lib.WordArray.random(
        SECURITY_CONSTANTS.SALT_SIZE
      );
      const result = new Uint8Array(SECURITY_CONSTANTS.SALT_SIZE);
      for (let i = 0; i < randomWords.words.length; i++) {
        const word = randomWords.words[i];
        const offset = i * 4;
        if (offset < result.length) result[offset] = (word >>> 24) & 0xff;
        if (offset + 1 < result.length)
          result[offset + 1] = (word >>> 16) & 0xff;
        if (offset + 2 < result.length)
          result[offset + 2] = (word >>> 8) & 0xff;
        if (offset + 3 < result.length) result[offset + 3] = word & 0xff;
      }
      return result;
    }
  }

  generateKey(): Uint8Array {
    if (
      this.useWebCrypto &&
      typeof crypto !== "undefined" &&
      crypto.getRandomValues
    ) {
      return crypto.getRandomValues(
        new Uint8Array(SECURITY_CONSTANTS.USER_KEY_SIZE)
      );
    } else {
      // Fallback using CryptoJS
      const randomWords = CryptoJS.lib.WordArray.random(
        SECURITY_CONSTANTS.USER_KEY_SIZE
      );
      const result = new Uint8Array(SECURITY_CONSTANTS.USER_KEY_SIZE);
      for (let i = 0; i < randomWords.words.length; i++) {
        const word = randomWords.words[i];
        const offset = i * 4;
        if (offset < result.length) result[offset] = (word >>> 24) & 0xff;
        if (offset + 1 < result.length)
          result[offset + 1] = (word >>> 16) & 0xff;
        if (offset + 2 < result.length)
          result[offset + 2] = (word >>> 8) & 0xff;
        if (offset + 3 < result.length) result[offset + 3] = word & 0xff;
      }
      return result;
    }
  }

  // Encryption/Decryption
  async encrypt(
    data: string,
    key: Uint8Array,
    type: EncryptionType = EncryptionType.AES_GCM_256
  ): Promise<EncryptedString> {
    if (this.useWebCrypto) {
      return this.encryptWebCrypto(data, key, type);
    } else {
      return this.encryptFallback(data, key, type);
    }
  }

  private async encryptWebCrypto(
    data: string,
    key: Uint8Array,
    type: EncryptionType
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

  private async encryptFallback(
    data: string,
    key: Uint8Array,
    type: EncryptionType
  ): Promise<EncryptedString> {
    switch (type) {
      case EncryptionType.AES_GCM_256:
        return this.encryptAesGcmFallback(data, key);
      case EncryptionType.AES_CBC_256_HMAC_SHA256:
        return this.encryptAesCbcHmacFallback(data, key);
      default:
        throw new Error(`Unsupported encryption type: ${type}`);
    }
  }

  async decrypt(
    encryptedDataParam: EncryptedString | string,
    key: Uint8Array
  ): Promise<string> {
    if (this.useWebCrypto) {
      return this.decryptWebCrypto(encryptedDataParam, key);
    } else {
      return this.decryptFallback(encryptedDataParam, key);
    }
  }

  private async decryptWebCrypto(
    encryptedDataParam: EncryptedString | string,
    key: Uint8Array
  ): Promise<string> {
    let decryptedBytes: Uint8Array;
    let encryptedData = encryptedDataParam as EncryptedString;
    if (typeof encryptedDataParam == "string") {
      encryptedData = JSON.parse(encryptedDataParam as string);
    }
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

  private async decryptFallback(
    encryptedDataParam: EncryptedString | string,
    key: Uint8Array
  ): Promise<string> {
    let encryptedData = encryptedDataParam as EncryptedString;
    if (typeof encryptedDataParam == "string") {
      encryptedData = JSON.parse(encryptedDataParam as string);
    }

    switch (encryptedData.encryptionType) {
      case EncryptionType.AES_GCM_256:
        return this.decryptAesGcmFallback(encryptedData, key);
      case EncryptionType.AES_CBC_256_HMAC_SHA256:
        return this.decryptAesCbcHmacFallback(encryptedData, key);
      default:
        throw new Error(
          `Unsupported encryption type: ${encryptedData.encryptionType}`
        );
    }
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
      iv: this.arrayBufferToBase64(iv.buffer),
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
      iv: this.arrayBufferToBase64(iv.buffer),
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

  // Fallback encryption methods using CryptoJS
  private async encryptAesGcmFallback(
    data: string,
    key: Uint8Array
  ): Promise<EncryptedString> {
    // Convert key to WordArray
    const keyWordArray = CryptoJS.lib.WordArray.create(Array.from(key));

    // Generate random IV
    const iv = this.generateSecureRandom(12); // 96-bit IV for GCM
    const ivWordArray = CryptoJS.lib.WordArray.create(Array.from(iv));

    // Encrypt using AES-GCM (note: CryptoJS doesn't have native GCM, so we'll use CTR mode as fallback)
    const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CTR,
      padding: CryptoJS.pad.NoPadding,
    });

    return {
      encryptionType: EncryptionType.AES_GCM_256,
      data: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      iv: CryptoJS.enc.Base64.stringify(ivWordArray),
    };
  }

  private async encryptAesCbcHmacFallback(
    data: string,
    key: Uint8Array
  ): Promise<EncryptedString> {
    const encKey = key.slice(0, 32);
    const macKey = key.slice(32, 64);

    // Convert keys to WordArrays
    const encKeyWordArray = CryptoJS.lib.WordArray.create(Array.from(encKey));
    const macKeyWordArray = CryptoJS.lib.WordArray.create(Array.from(macKey));

    // Generate random IV
    const iv = this.generateSecureRandom(16); // 128-bit IV for CBC
    const ivWordArray = CryptoJS.lib.WordArray.create(Array.from(iv));

    // Encrypt using AES-CBC
    const encrypted = CryptoJS.AES.encrypt(data, encKeyWordArray, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Calculate HMAC
    const ciphertext = encrypted.ciphertext;
    const dataToMac = ivWordArray.concat(ciphertext);
    const mac = CryptoJS.HmacSHA256(dataToMac, macKeyWordArray);

    return {
      encryptionType: EncryptionType.AES_CBC_256_HMAC_SHA256,
      data: ciphertext.toString(CryptoJS.enc.Base64),
      iv: CryptoJS.enc.Base64.stringify(ivWordArray),
      mac: mac.toString(CryptoJS.enc.Base64),
    };
  }

  // Fallback decryption methods using CryptoJS
  private decryptAesGcmFallback(
    encryptedData: EncryptedString,
    key: Uint8Array
  ): string {
    if (!encryptedData.iv) {
      throw new Error("IV is required for AES-GCM decryption");
    }

    // Convert key and IV to WordArrays
    const keyWordArray = CryptoJS.lib.WordArray.create(Array.from(key));
    const ivWordArray = CryptoJS.enc.Base64.parse(encryptedData.iv);

    // Create cipher params object
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedData.data),
    });

    // Decrypt using AES-CTR (fallback for GCM)
    const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CTR,
      padding: CryptoJS.pad.NoPadding,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  private decryptAesCbcHmacFallback(
    encryptedData: EncryptedString,
    key: Uint8Array
  ): string {
    if (!encryptedData.iv || !encryptedData.mac) {
      throw new Error("IV and MAC are required for AES-CBC-HMAC decryption");
    }

    const encKey = key.slice(0, 32);
    const macKey = key.slice(32, 64);

    // Convert keys to WordArrays
    const encKeyWordArray = CryptoJS.lib.WordArray.create(Array.from(encKey));
    const macKeyWordArray = CryptoJS.lib.WordArray.create(Array.from(macKey));
    const ivWordArray = CryptoJS.enc.Base64.parse(encryptedData.iv);
    const ciphertext = CryptoJS.enc.Base64.parse(encryptedData.data);

    // Verify MAC first
    const dataToMac = ivWordArray.concat(ciphertext);
    const computedMac = CryptoJS.HmacSHA256(dataToMac, macKeyWordArray);
    const expectedMac = CryptoJS.enc.Base64.parse(encryptedData.mac);

    if (!this.constantTimeEqualsWordArray(computedMac, expectedMac)) {
      throw new Error("MAC verification failed");
    }

    // Create cipher params object
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertext,
    });

    // Decrypt using AES-CBC
    const decrypted = CryptoJS.AES.decrypt(cipherParams, encKeyWordArray, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  private constantTimeEqualsWordArray(
    a: CryptoJS.lib.WordArray,
    b: CryptoJS.lib.WordArray
  ): boolean {
    if (a.sigBytes !== b.sigBytes) {
      return false;
    }

    let result = 0;
    const aWords = a.words;
    const bWords = b.words;

    for (let i = 0; i < aWords.length; i++) {
      result |= aWords[i] ^ bWords[i];
    }

    return result === 0;
  }

  // Key encryption/decryption
  async encryptKey(
    key: Uint8Array,
    encryptionKey: Uint8Array
  ): Promise<EncryptedString> {
    return this.encrypt(
      this.arrayBufferToBase64(key.buffer as ArrayBuffer),
      encryptionKey
    );
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
      console.log("✅ Converted to ArrayBuffer, length:", result.byteLength);

      return new Uint8Array(result);
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
    if (
      this.useWebCrypto &&
      typeof crypto !== "undefined" &&
      crypto.getRandomValues
    ) {
      return crypto.getRandomValues(new Uint8Array(length));
    } else {
      // Fallback using CryptoJS
      const randomWords = CryptoJS.lib.WordArray.random(length);
      const result = new Uint8Array(length);
      for (let i = 0; i < randomWords.words.length; i++) {
        const word = randomWords.words[i];
        const offset = i * 4;
        if (offset < result.length) result[offset] = (word >>> 24) & 0xff;
        if (offset + 1 < result.length)
          result[offset + 1] = (word >>> 16) & 0xff;
        if (offset + 2 < result.length)
          result[offset + 2] = (word >>> 8) & 0xff;
        if (offset + 3 < result.length) result[offset + 3] = word & 0xff;
      }
      return result;
    }
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
