"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  UnifiedAuthService,
  GoogleUser,
  UnifiedUser,
  AuthState,
} from "../lib/auth/unifiedAuthService";

interface AuthContextType extends AuthState {
  // Google sign-in methods
  signInWithGoogle: (user: GoogleUser) => Promise<void>;
  signOut: () => Promise<void>;

  // Encryption setup methods
  setupEncryption: (masterPassword: string, hint?: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<void>;
  lockVault: () => void;

  // Utility methods
  getGoogleUser: () => GoogleUser | null;
  getDatabaseUser: () => any | null;
  getUserKey: () => Uint8Array | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    needsEncryptionSetup: false,
    isVaultLocked: true,
  });

  const unifiedAuthService = UnifiedAuthService.getInstance();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = unifiedAuthService.subscribe((newState) => {
      console.log("📡 AuthContext received state update:", newState);
      setAuthState(newState);
    });

    // Initialize auth state
    const initialState = unifiedAuthService.getState();
    console.log("🔄 AuthContext initial state:", initialState);
    setAuthState(initialState);

    return unsubscribe;
  }, []);

  // Auth methods
  const signInWithGoogle = async (userData: GoogleUser): Promise<void> => {
    await unifiedAuthService.signInWithGoogle(userData);
  };

  const signOut = async (): Promise<void> => {
    await unifiedAuthService.signOut();

    // Sign out from Google
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const setupEncryption = async (
    masterPassword: string,
    hint?: string
  ): Promise<void> => {
    await unifiedAuthService.setupEncryption(masterPassword, hint);
  };

  const unlockVault = async (masterPassword: string): Promise<void> => {
    await unifiedAuthService.unlockVault(masterPassword);
  };

  const lockVault = (): void => {
    unifiedAuthService.lockVault();
  };

  const getGoogleUser = (): GoogleUser | null => {
    return unifiedAuthService.getGoogleUser();
  };

  const getDatabaseUser = (): any | null => {
    return unifiedAuthService.getDatabaseUser();
  };

  const getUserKey = (): Uint8Array | null => {
    return unifiedAuthService.getUserKey();
  };

  const value: AuthContextType = {
    ...authState,
    signInWithGoogle,
    signOut,
    setupEncryption,
    unlockVault,
    lockVault,
    getGoogleUser,
    getDatabaseUser,
    getUserKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading, needsEncryptionSetup, isVaultLocked } =
    useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login or show login modal
      console.log("User not authenticated, redirect to login");
    }
  }, [isAuthenticated, isLoading]);

  return {
    isAuthenticated,
    isLoading,
    needsEncryptionSetup,
    isVaultLocked,
    requiresSetup: needsEncryptionSetup,
    requiresUnlock: isVaultLocked && !needsEncryptionSetup,
  };
}
