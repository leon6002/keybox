#!/bin/bash

# Install XChaCha20-Poly1305 support for Keybox
# This script installs the @noble/ciphers library and updates the crypto service

echo "🔐 Installing XChaCha20-Poly1305 support for Keybox..."

# Install the noble ciphers library
echo "📦 Installing @noble/ciphers..."
npm install @noble/ciphers

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ @noble/ciphers installed successfully"
else
    echo "❌ Failed to install @noble/ciphers"
    exit 1
fi

echo ""
echo "🔧 Next steps to complete XChaCha20 implementation:"
echo ""
echo "1. Uncomment the import in src/lib/security/cryptoService.ts:"
echo "   // import { xchacha20poly1305 } from '@noble/ciphers/chacha';"
echo ""
echo "2. Replace the TODO implementations in encryptXChaCha20 and decryptXChaCha20 methods"
echo ""
echo "3. Update the default encryption type in src/lib/security/index.ts:"
echo "   encryptionType: EncryptionType.XCHACHA20_POLY1305"
echo ""
echo "4. Run tests to verify the implementation:"
echo "   npm test"
echo ""
echo "📖 See XCHACHA20_IMPLEMENTATION_PLAN.md for detailed implementation guide"
echo ""
echo "🎉 Installation complete! Ready to implement XChaCha20-Poly1305 encryption."
