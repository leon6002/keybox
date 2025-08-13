'use client';

// Password Management Guard Component
// Only protects password-related features, not the entire app

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import EncryptionSetupModal from './EncryptionSetupModal';
import VaultUnlockModal from './VaultUnlockModal';

interface PasswordGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // What to show when not authenticated
}

export default function PasswordGuard({ children, fallback }: PasswordGuardProps) {
  const router = useRouter();
  const { 
    isAuthenticated, 
    isLoading, 
    needsEncryptionSetup, 
    isVaultLocked,
    user 
  } = useAuth();

  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);
  const [showVaultUnlock, setShowVaultUnlock] = useState(false);

  useEffect(() => {
    console.log('🔐 PasswordGuard state check:', {
      isLoading,
      isAuthenticated,
      needsEncryptionSetup,
      isVaultLocked,
      user: user?.googleUser?.email
    });

    if (!isLoading) {
      if (!isAuthenticated) {
        // Not signed in - redirect to sign in page
        console.log('❌ Not authenticated, redirecting to sign in');
        router.push('/auth/signin?returnUrl=' + encodeURIComponent(window.location.pathname));
        return;
      }

      // User is signed in with Google
      if (needsEncryptionSetup) {
        // Show encryption setup modal
        console.log('🔐 Showing encryption setup modal');
        setShowEncryptionSetup(true);
        setShowVaultUnlock(false);
      } else if (isVaultLocked) {
        // Show vault unlock modal
        console.log('🔓 Showing vault unlock modal');
        setShowEncryptionSetup(false);
        setShowVaultUnlock(true);
      } else {
        // All good, hide modals
        console.log('✅ All good, hiding modals');
        setShowEncryptionSetup(false);
        setShowVaultUnlock(false);
      }
    }
  }, [isLoading, isAuthenticated, needsEncryptionSetup, isVaultLocked, user, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if not authenticated (shouldn't happen due to redirect, but just in case)
  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Sign In Required</h2>
          <p className="text-muted-foreground">
            Please sign in with Google to access your encrypted password vault.
          </p>
        </div>
      </div>
    );
  }

  // Show children if authenticated and vault is accessible
  const canShowChildren = isAuthenticated && !needsEncryptionSetup && !isVaultLocked;

  return (
    <>
      {canShowChildren ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">
              {needsEncryptionSetup ? 'Encryption Setup Required' : 'Vault Locked'}
            </h2>
            <p className="text-muted-foreground">
              {needsEncryptionSetup 
                ? 'Set up your master password to encrypt your passwords securely.'
                : 'Enter your master password to unlock your encrypted vault.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Encryption Setup Modal */}
      <EncryptionSetupModal
        isOpen={showEncryptionSetup}
        onClose={() => {
          // Don't allow closing without setup for password pages
          console.log('⚠️ Encryption setup required for password management');
        }}
      />

      {/* Vault Unlock Modal */}
      <VaultUnlockModal
        isOpen={showVaultUnlock}
        onClose={() => {
          // Don't allow closing without unlock for password pages
          console.log('⚠️ Vault unlock required for password management');
        }}
      />
    </>
  );
}
