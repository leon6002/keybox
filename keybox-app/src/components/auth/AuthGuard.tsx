"use client";

// Authentication Guard Component
// Automatically handles the authentication flow and shows appropriate modals

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import EncryptionSetupModal from "./EncryptionSetupModal";
import VaultUnlockModal from "./VaultUnlockModal";

interface AuthGuardProps {
  children: React.ReactNode;
  requiresVaultUnlock?: boolean; // If true, requires vault to be unlocked
  fallback?: React.ReactNode; // What to show when not authenticated
}

export default function AuthGuard({
  children,
  requiresVaultUnlock = false,
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    needsEncryptionSetup,
    isVaultLocked,
    user,
  } = useAuth();

  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);
  const [showVaultUnlock, setShowVaultUnlock] = useState(false);

  useEffect(() => {
    console.log("🛡️ AuthGuard state check:", {
      isLoading,
      isAuthenticated,
      needsEncryptionSetup,
      isVaultLocked,
      requiresVaultUnlock,
      user: user?.googleUser?.email,
    });

    if (!isLoading) {
      if (!isAuthenticated) {
        // Not signed in - redirect to sign in page
        console.log("❌ Not authenticated, redirecting to sign in");
        router.push(
          "/auth/signin?returnUrl=" +
            encodeURIComponent(window.location.pathname)
        );
        return;
      }

      // User is signed in with Google
      if (needsEncryptionSetup) {
        // Show encryption setup modal
        console.log("🔐 Showing encryption setup modal");
        setShowEncryptionSetup(true);
        setShowVaultUnlock(false);
      } else if (requiresVaultUnlock && isVaultLocked) {
        // Show vault unlock modal
        console.log("🔓 Showing vault unlock modal");
        setShowEncryptionSetup(false);
        setShowVaultUnlock(true);
      } else {
        // All good, hide modals
        console.log("✅ All good, hiding modals");
        setShowEncryptionSetup(false);
        setShowVaultUnlock(false);
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    needsEncryptionSetup,
    isVaultLocked,
    requiresVaultUnlock,
    user,
    router,
  ]);

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

  // If not authenticated, the useEffect will handle the redirect
  // So we just show loading state while the redirect happens
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Show children if authenticated and vault is accessible
  const canShowChildren =
    isAuthenticated &&
    (!requiresVaultUnlock || (!needsEncryptionSetup && !isVaultLocked));

  return (
    <>
      {canShowChildren ? (
        children
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-orange-600 dark:text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">
              {needsEncryptionSetup
                ? "Encryption Setup Required"
                : "Vault Locked"}
            </h2>
            <p className="text-muted-foreground">
              {needsEncryptionSetup
                ? "Set up your master password to encrypt your passwords securely."
                : "Enter your master password to unlock your encrypted vault."}
            </p>
          </div>
        </div>
      )}

      {/* Encryption Setup Modal */}
      <EncryptionSetupModal
        isOpen={showEncryptionSetup}
        onClose={() => setShowEncryptionSetup(false)}
      />

      {/* Vault Unlock Modal */}
      <VaultUnlockModal
        isOpen={showVaultUnlock}
        onClose={() => setShowVaultUnlock(false)}
      />
    </>
  );
}

// Convenience wrapper for pages that require vault access
export function VaultGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <AuthGuard requiresVaultUnlock={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

// Convenience wrapper for pages that only require Google sign-in
// Does NOT show encryption setup modal - that's only for password management
export function SignInGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push(
      "/auth/signin?returnUrl=" + encodeURIComponent(window.location.pathname)
    );
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

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

  // Show children if authenticated (no encryption setup required)
  return <>{children}</>;
}
