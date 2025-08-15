# XChaCha20-Poly1305 Implementation Plan

## Overview
This document outlines the plan to switch from AES-GCM to XChaCha20-Poly1305 encryption in the Keybox project.

## Why XChaCha20-Poly1305?

### Advantages over AES-GCM:
1. **Larger Nonce Space**: 192-bit nonce vs 96-bit IV (no nonce reuse concerns)
2. **Better Performance**: Often faster than AES on non-hardware-accelerated platforms
3. **Simpler Implementation**: No timing attack concerns like AES
4. **Industry Adoption**: Used by NordPass, Signal, WireGuard, etc.
5. **Future-Proof**: Quantum-resistant (unlike RSA components)

### Security Benefits:
- **Nonce Misuse Resistance**: Much safer with random nonces
- **Side-Channel Resistance**: ChaCha20 is more resistant to timing attacks
- **Constant-Time**: Easier to implement securely

## Implementation Steps

### 1. Install Dependencies
```bash
npm install @noble/ciphers
npm install --save-dev @types/node  # if not already installed
```

### 2. Update Crypto Service

#### Add XChaCha20 Methods:
```typescript
// In cryptoService.ts
import { xchacha20poly1305 } from '@noble/ciphers/chacha';

private async encryptXChaCha20(
  data: Uint8Array,
  key: Uint8Array
): Promise<EncryptedString> {
  // Generate 192-bit nonce
  const nonce = crypto.getRandomValues(
    new Uint8Array(SECURITY_CONSTANTS.XCHACHA20_NONCE_SIZE)
  );
  
  // Encrypt with XChaCha20-Poly1305
  const cipher = xchacha20poly1305(key, nonce);
  const encryptedData = cipher.encrypt(data);
  
  return {
    encryptionType: EncryptionType.XCHACHA20_POLY1305,
    data: this.arrayBufferToBase64(encryptedData),
    nonce: this.arrayBufferToBase64(nonce),
  };
}

private async decryptXChaCha20(
  encryptedData: EncryptedString,
  key: Uint8Array
): Promise<Uint8Array> {
  const nonce = this.base64ToArrayBuffer(encryptedData.nonce!);
  const ciphertext = this.base64ToArrayBuffer(encryptedData.data);
  
  const cipher = xchacha20poly1305(key, new Uint8Array(nonce));
  return cipher.decrypt(new Uint8Array(ciphertext));
}
```

### 3. Update Default Encryption Type

#### Change Default in Security Settings:
```typescript
// In index.ts - getRecommendedSettings()
static getRecommendedSettings(): SecuritySettings {
  return {
    kdfType: KdfType.PBKDF2_SHA256,
    kdfIterations: SECURITY_CONSTANTS.PBKDF2_DEFAULT_ITERATIONS,
    encryptionType: EncryptionType.XCHACHA20_POLY1305, // Changed from AES_GCM_256
    requireMasterPasswordReprompt: false,
    sessionTimeout: SECURITY_CONSTANTS.DEFAULT_SESSION_TIMEOUT,
    lockOnIdle: true,
    clearClipboard: 30,
  };
}
```

### 4. Update Encryption Switch Statement

#### Add XChaCha20 Cases:
```typescript
// In encryptWebCrypto method
switch (type) {
  case EncryptionType.AES_GCM_256:
    return this.encryptAesGcm(dataBytes, key);
  case EncryptionType.AES_CBC_256_HMAC_SHA256:
    return this.encryptAesCbcHmac(dataBytes, key);
  case EncryptionType.XCHACHA20_POLY1305:
    return this.encryptXChaCha20(dataBytes, key);
  default:
    throw new Error(`Unsupported encryption type: ${type}`);
}
```

### 5. Backward Compatibility

#### Keep AES Support:
- Maintain all existing AES encryption/decryption methods
- Only change the default for NEW encryptions
- Existing data will continue to work with AES

### 6. Testing

#### Add XChaCha20 Tests:
```typescript
describe('XChaCha20-Poly1305 Encryption', () => {
  it('should encrypt and decrypt data correctly', async () => {
    const data = 'test data';
    const key = cryptoService.generateKey();
    
    const encrypted = await cryptoService.encrypt(
      data, 
      key, 
      EncryptionType.XCHACHA20_POLY1305
    );
    
    const decrypted = await cryptoService.decrypt(encrypted, key);
    expect(decrypted).toBe(data);
  });
  
  it('should use 192-bit nonces', async () => {
    const data = 'test';
    const key = cryptoService.generateKey();
    
    const encrypted = await cryptoService.encrypt(
      data, 
      key, 
      EncryptionType.XCHACHA20_POLY1305
    );
    
    const nonce = cryptoService.base64ToArrayBuffer(encrypted.nonce!);
    expect(nonce.byteLength).toBe(24); // 192 bits
  });
});
```

## Migration Strategy

### For Development (No Historical Data):
1. ✅ Change default encryption type to XChaCha20
2. ✅ All new passwords will use XChaCha20
3. ✅ Keep AES support for any existing test data

### Bundle Size Impact:
- `@noble/ciphers`: ~15KB gzipped
- Current `crypto-js`: ~100KB+ gzipped
- **Net Result**: Potentially smaller bundle if we can reduce crypto-js usage

## Performance Comparison

### XChaCha20-Poly1305 vs AES-GCM:
- **Encryption Speed**: XChaCha20 often 20-30% faster on non-AES-NI hardware
- **Decryption Speed**: Similar or better performance
- **Memory Usage**: Lower memory footprint
- **Battery Usage**: More efficient on mobile devices

## Security Audit Considerations

### What Security Auditors Look For:
1. ✅ **Nonce Uniqueness**: XChaCha20's 192-bit nonce makes collisions virtually impossible
2. ✅ **Key Management**: No changes needed to existing key derivation
3. ✅ **Implementation Quality**: @noble/ciphers is audited and well-maintained
4. ✅ **Algorithm Choice**: XChaCha20-Poly1305 is IETF standardized (RFC 8439)

## Timeline Estimate

### Implementation Time: 2-3 days
- Day 1: Install library, implement encryption/decryption methods
- Day 2: Update default settings, add comprehensive tests
- Day 3: Integration testing, performance validation

### Risk Level: LOW
- ✅ No breaking changes (backward compatible)
- ✅ Well-established library
- ✅ No database schema changes needed
- ✅ Easy to rollback if needed

## Conclusion

**Recommendation: PROCEED** ✅

This is an excellent time to switch to XChaCha20-Poly1305:
1. **Perfect Timing**: No historical data to migrate
2. **Better Security**: Improved nonce handling and side-channel resistance  
3. **Industry Standard**: Used by leading password managers
4. **Easy Implementation**: Clean architecture makes this straightforward
5. **Future-Proof**: Better long-term security properties

The implementation is low-risk and high-reward, positioning Keybox with modern, industry-standard encryption.
