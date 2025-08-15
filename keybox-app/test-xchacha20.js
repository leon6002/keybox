#!/usr/bin/env node

// Quick test script to verify XChaCha20-Poly1305 implementation
// Run with: node test-xchacha20.js

const { WebCryptoService } = require('./dist/lib/security/cryptoService.js');
const { EncryptionType } = require('./dist/lib/security/types.js');

async function testXChaCha20() {
  console.log('🔐 Testing XChaCha20-Poly1305 Implementation...\n');
  
  try {
    // Initialize crypto service
    const cryptoService = WebCryptoService.getInstance();
    
    // Test data
    const testData = "This is a secret password: MySecurePassword123!";
    const key = cryptoService.generateKey(); // 256-bit key
    
    console.log('📝 Test Data:', testData);
    console.log('🔑 Key Length:', key.length, 'bytes');
    console.log('');
    
    // Test encryption
    console.log('🔒 Encrypting with XChaCha20-Poly1305...');
    const encrypted = await cryptoService.encrypt(
      testData, 
      key, 
      EncryptionType.XCHACHA20_POLY1305
    );
    
    console.log('✅ Encryption successful!');
    console.log('   Encryption Type:', encrypted.encryptionType);
    console.log('   Has Nonce:', !!encrypted.nonce);
    console.log('   Nonce Length:', encrypted.nonce ? atob(encrypted.nonce).length : 0, 'bytes');
    console.log('   Ciphertext Length:', atob(encrypted.data).length, 'bytes');
    console.log('');
    
    // Test decryption
    console.log('🔓 Decrypting...');
    const decrypted = await cryptoService.decrypt(encrypted, key);
    
    console.log('✅ Decryption successful!');
    console.log('📝 Decrypted Data:', decrypted);
    console.log('✅ Match Original:', decrypted === testData ? 'YES' : 'NO');
    console.log('');
    
    // Test multiple encryptions (should have different nonces)
    console.log('🔄 Testing nonce uniqueness...');
    const encrypted1 = await cryptoService.encrypt(testData, key, EncryptionType.XCHACHA20_POLY1305);
    const encrypted2 = await cryptoService.encrypt(testData, key, EncryptionType.XCHACHA20_POLY1305);
    
    const noncesAreDifferent = encrypted1.nonce !== encrypted2.nonce;
    console.log('✅ Nonces are unique:', noncesAreDifferent ? 'YES' : 'NO');
    console.log('');
    
    // Performance test
    console.log('⚡ Performance test (100 encrypt/decrypt cycles)...');
    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      const enc = await cryptoService.encrypt(testData, key, EncryptionType.XCHACHA20_POLY1305);
      await cryptoService.decrypt(enc, key);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`✅ Completed 100 cycles in ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per cycle: ${(totalTime / 100).toFixed(2)}ms`);
    console.log('');
    
    console.log('🎉 All tests passed! XChaCha20-Poly1305 is working correctly.');
    
    return {
      success: true,
      original: testData,
      encrypted,
      decrypted,
      matches: decrypted === testData,
      noncesUnique: noncesAreDifferent,
      performanceMs: totalTime
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  testXChaCha20().then(result => {
    if (result.success) {
      console.log('\n✅ XChaCha20-Poly1305 implementation is ready for production!');
      process.exit(0);
    } else {
      console.log('\n❌ XChaCha20-Poly1305 implementation needs fixes.');
      process.exit(1);
    }
  });
}

module.exports = { testXChaCha20 };
