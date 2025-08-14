// Unified Authentication Service
// Combines Google Sign-in with encrypted database authentication

import { supabase } from "../supabase";
import { SecurityServiceFactory } from "../security";
import { KeyboxAuthService, AuthUser } from "../security/authService";
import {
  initializeDatabaseService,
  initializeDatabaseWithMasterKey,
} from "../database";
import { OptimisticUpdateService } from "../storage/optimisticUpdateService";

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  given_name: string;
  family_name: string;
}

export interface UnifiedUser {
  // Google user info
  googleUser: GoogleUser;

  // Database user info (if they have set up encryption)
  databaseUser?: AuthUser;

  // Security status
  hasEncryptionSetup: boolean;
  isVaultUnlocked: boolean;

  // User key (available when vault is unlocked)
  userKey?: Uint8Array;
}

export interface AuthState {
  user: UnifiedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsEncryptionSetup: boolean;
  isVaultLocked: boolean;
}

export class UnifiedAuthService {
  private static instance: UnifiedAuthService;
  private authService: KeyboxAuthService;
  private currentState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    needsEncryptionSetup: false,
    isVaultLocked: true,
  };
  private listeners: ((state: AuthState) => void)[] = [];

  public static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService();
    }
    return UnifiedAuthService.instance;
  }

  private constructor() {
    this.authService = SecurityServiceFactory.getAuthService();
    // Initialize asynchronously to avoid SSR issues
    if (typeof window !== "undefined") {
      this.initializeAuth();
    }
  }

  // Initialize authentication state
  private async initializeAuth(): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        console.log("🔄 Server-side rendering, skipping auth initialization");
        this.currentState.isLoading = false;
        this.notifyListeners();
        return;
      }

      // Add a small delay to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check for stored Google user
      let storedGoogleUser: string | null = null;
      try {
        storedGoogleUser = localStorage.getItem("google_user");
      } catch (error) {
        console.warn(
          "⚠️ Failed to access localStorage for google_user:",
          error
        );
      }

      if (storedGoogleUser) {
        const googleUser: GoogleUser = JSON.parse(storedGoogleUser);

        // Check if user has database encryption setup
        const hasEncryption = await this.checkEncryptionSetup(googleUser.email);

        // Try to restore vault unlock state and user key from sessionStorage
        let storedVaultState: string | null = null;
        let storedUserKey: string | null = null;
        let storedDatabaseUser: string | null = null;

        try {
          storedVaultState = sessionStorage.getItem("vault_unlock_state");
          storedUserKey = sessionStorage.getItem("user_key");
          storedDatabaseUser = sessionStorage.getItem("database_user");
        } catch (error) {
          console.warn("⚠️ Failed to access sessionStorage:", error);
        }

        let isVaultUnlocked = false;
        let userKey: Uint8Array | undefined;
        let databaseUser: any = null;

        if (
          storedVaultState === "unlocked" &&
          storedUserKey &&
          storedDatabaseUser
        ) {
          try {
            // Restore user key from base64
            const userKeyArray = JSON.parse(storedUserKey);
            userKey = new Uint8Array(userKeyArray);
            databaseUser = JSON.parse(storedDatabaseUser);
            isVaultUnlocked = true;
            console.log("✅ Restored vault unlock state from session storage");

            // Initialize database services with restored user key
            try {
              await initializeDatabaseService();
              await initializeDatabaseWithMasterKey(userKey);

              // Initialize OptimisticUpdateService
              const optimisticService = OptimisticUpdateService.getInstance();
              await optimisticService.initialize();
              console.log("✅ OptimisticUpdateService initialized");

              console.log(
                "✅ Database services initialized with restored user key"
              );
            } catch (error) {
              console.warn(
                "⚠️ Failed to initialize database services with restored key:",
                error
              );
            }
          } catch (error) {
            console.warn(
              "⚠️ Failed to restore vault state, user will need to unlock again:",
              error
            );
            // Clear invalid stored data
            sessionStorage.removeItem("vault_unlock_state");
            sessionStorage.removeItem("user_key");
            sessionStorage.removeItem("database_user");
          }
        }

        this.currentState = {
          user: {
            googleUser,
            databaseUser,
            hasEncryptionSetup: hasEncryption,
            isVaultUnlocked,
            userKey,
          },
          isAuthenticated: true,
          isLoading: false,
          needsEncryptionSetup: !hasEncryption,
          isVaultLocked: hasEncryption && !isVaultUnlocked,
        };
      } else {
        this.currentState.isLoading = false;
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      this.currentState.isLoading = false;
    }

    this.notifyListeners();
  }

  // Google Sign-in
  async signInWithGoogle(googleUser: GoogleUser): Promise<void> {
    try {
      console.log("🚀 Starting Google sign-in for:", googleUser.email);

      // Store Google user info
      try {
        localStorage.setItem("google_user", JSON.stringify(googleUser));
      } catch (error) {
        console.warn("⚠️ Failed to store Google user in localStorage:", error);
      }

      // Check if user has encryption setup
      const hasEncryption = await this.checkEncryptionSetup(googleUser.email);

      // Sign in to Supabase with Google user info
      await this.signInToSupabase(googleUser);

      const newState = {
        user: {
          googleUser,
          hasEncryptionSetup: hasEncryption,
          isVaultUnlocked: false,
        },
        isAuthenticated: true,
        isLoading: false,
        needsEncryptionSetup: !hasEncryption,
        isVaultLocked: hasEncryption,
      };

      console.log("🔄 Setting new auth state:", newState);
      this.currentState = newState;

      this.notifyListeners();
      console.log("✅ Google sign-in completed successfully");
    } catch (error) {
      console.error("❌ Google sign-in error:", error);
      throw error;
    }
  }

  // Set up encryption for the first time
  async setupEncryption(
    masterPassword: string,
    masterPasswordHint?: string
  ): Promise<void> {
    if (!this.currentState.user?.googleUser) {
      throw new Error("Must be signed in with Google first");
    }

    try {
      const googleUser = this.currentState.user.googleUser;
      console.log("🔐 Setting up encryption for:", googleUser.email);

      // Call API route to create user with encryption (server-side with admin privileges)
      console.log("📝 Creating encrypted user via API...");
      const response = await fetch("/api/auth/setup-encryption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googleUser,
          masterPassword,
          masterPasswordHint,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to setup encryption");
      }

      const { user: databaseUser } = await response.json();
      console.log("✅ User created successfully:", databaseUser.id);

      // Create a session directly since we have all the data
      console.log("🔑 Creating session...");

      try {
        // We already have the user key from the registration process
        // Let's recreate the master key to get the user key
        console.log("📦 Loading security services...");
        const { SecurityServiceFactory } = await import("../security");
        const keyManagementService =
          SecurityServiceFactory.getKeyManagementService();

        // Recreate master key from password
        console.log("🔐 Recreating master key...");
        console.log("KDF Config:", {
          type: databaseUser.kdfType,
          iterations: databaseUser.kdfIterations,
          memory: databaseUser.kdfMemory,
          parallelism: databaseUser.kdfParallelism,
          saltLength: databaseUser.kdfSalt.length,
        });

        // Decode salt from base64
        const saltBytes = new Uint8Array(
          Buffer.from(databaseUser.kdfSalt, "base64")
        );
        console.log("🧂 Salt details:", {
          originalBase64: databaseUser.kdfSalt,
          decodedLength: saltBytes.length,
          firstFewBytes: Array.from(saltBytes.slice(0, 8)),
        });

        const masterKey = await keyManagementService.createMasterKey(
          masterPassword,
          {
            type: databaseUser.kdfType,
            iterations: databaseUser.kdfIterations,
            memory: databaseUser.kdfMemory,
            parallelism: databaseUser.kdfParallelism,
            salt: saltBytes,
          }
        );
        console.log("✅ Master key recreated successfully");

        // Decrypt user key
        console.log("🔓 Decrypting user key...");
        const encryptedUserKey = JSON.parse(databaseUser.userKeyEncrypted);
        console.log(
          "Encrypted user key structure:",
          Object.keys(encryptedUserKey)
        );
        console.log("Encrypted user key details:", {
          encryptionType: encryptedUserKey.encryptionType,
          dataLength: encryptedUserKey.data?.length,
          ivLength: encryptedUserKey.iv?.length,
          hasData: !!encryptedUserKey.data,
          hasIv: !!encryptedUserKey.iv,
        });

        const userKey = await keyManagementService.decryptUserKey(
          encryptedUserKey,
          masterKey
        );
        console.log("✅ User key decrypted successfully");

        // Initialize database services
        console.log("🗄️ Initializing database service...");
        await initializeDatabaseService();
        console.log("✅ Database service initialized");

        console.log("🔐 Initializing database with master key...");
        await initializeDatabaseWithMasterKey(userKey.key);
        console.log("✅ Database initialized with master key successfully");

        // Update state
        this.currentState = {
          ...this.currentState,
          user: {
            ...this.currentState.user,
            databaseUser,
            hasEncryptionSetup: true,
            isVaultUnlocked: true,
            userKey: userKey.key,
          },
          needsEncryptionSetup: false,
          isVaultLocked: false,
        };
      } catch (sessionError) {
        console.error("❌ Session creation failed:", sessionError);
        console.error("Error details:", {
          name: sessionError instanceof Error ? sessionError.name : "Unknown",
          message:
            sessionError instanceof Error
              ? sessionError.message
              : String(sessionError),
          stack: sessionError instanceof Error ? sessionError.stack : undefined,
        });
        throw sessionError;
      }

      this.notifyListeners();
    } catch (error) {
      console.error("Encryption setup error:", error);
      throw error;
    }
  }

  // Unlock vault with master password (CLIENT-SIDE ONLY - ZERO KNOWLEDGE)
  async unlockVault(masterPassword: string): Promise<void> {
    if (!this.currentState.user?.googleUser) {
      throw new Error("Must be signed in first");
    }

    if (!this.currentState.user.hasEncryptionSetup) {
      throw new Error("Encryption not set up");
    }

    try {
      console.log(
        "🔓 Unlocking vault for:",
        this.currentState.user.googleUser.email
      );

      // SECURITY: Get user's encrypted data from server WITHOUT sending master password
      const response = await fetch("/api/auth/get-user-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: this.currentState.user.googleUser.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Failed to get user data:", errorData);
        throw new Error(errorData.error || "Failed to get user data");
      }

      const responseData = await response.json();
      console.log("📦 User data retrieved from server");

      const { user: databaseUser } = responseData;

      // SECURITY: Perform ALL cryptographic operations CLIENT-SIDE
      const { SecurityServiceFactory } = await import("@/lib/security");
      const keyManagementService =
        SecurityServiceFactory.getKeyManagementService();

      // Recreate master key from password and stored KDF parameters (CLIENT-SIDE ONLY)
      console.log("🔐 Deriving master key client-side...");
      const saltBytes = new Uint8Array(
        Buffer.from(databaseUser.kdfSalt, "base64")
      );
      const masterKey = await keyManagementService.createMasterKey(
        masterPassword,
        {
          type: databaseUser.kdfType,
          iterations: databaseUser.kdfIterations,
          memory: databaseUser.kdfMemory,
          parallelism: databaseUser.kdfParallelism,
          salt: saltBytes,
        }
      );

      // Verify password by attempting to decrypt user key (CLIENT-SIDE ONLY)
      console.log("🔐 Attempting to decrypt user key client-side...");
      const encryptedUserKey = JSON.parse(databaseUser.userKeyEncrypted);

      try {
        const userKey = await keyManagementService.decryptUserKey(
          encryptedUserKey,
          masterKey
        );

        // Convert ArrayBuffer to Uint8Array if needed
        let userKeyBytes: Uint8Array;
        if (userKey.key instanceof ArrayBuffer) {
          userKeyBytes = new Uint8Array(userKey.key);
        } else if (userKey.key instanceof Uint8Array) {
          userKeyBytes = userKey.key;
        } else {
          throw new Error(`Unexpected user key type: ${typeof userKey.key}`);
        }

        if (!userKeyBytes || userKeyBytes.length === 0) {
          throw new Error("Decrypted user key is empty");
        }

        console.log("✅ Vault unlocked successfully (client-side decryption)");

        // Initialize database services with master key
        await initializeDatabaseService();
        await initializeDatabaseWithMasterKey(userKeyBytes);

        // Update state with decrypted user key
        this.currentState = {
          ...this.currentState,
          user: {
            ...this.currentState.user,
            databaseUser,
            isVaultUnlocked: true,
            userKey: userKeyBytes,
          },
          isVaultLocked: false,
        };

        console.log("✅ State updated with client-side decrypted user key:", {
          userKeyLength: this.currentState.user?.userKey?.length ?? 0,
        });

        // Persist vault unlock state and user key in sessionStorage for page refresh
        try {
          sessionStorage.setItem("vault_unlock_state", "unlocked");
          sessionStorage.setItem(
            "user_key",
            JSON.stringify(Array.from(userKeyBytes))
          );
          sessionStorage.setItem("database_user", JSON.stringify(databaseUser));
          console.log("💾 Persisted vault unlock state to session storage");
        } catch (error) {
          console.warn("⚠️ Failed to persist vault state:", error);
        }

        this.notifyListeners();
      } catch (decryptionError) {
        console.error(
          "❌ Client-side decryption failed (incorrect password):",
          decryptionError
        );
        throw new Error("Incorrect master password");
      }
    } catch (error) {
      console.error("Vault unlock error:", error);
      throw error;
    }
  }

  // Lock vault
  lockVault(): void {
    this.authService.logout();

    // Clear persisted vault state
    try {
      sessionStorage.removeItem("vault_unlock_state");
      sessionStorage.removeItem("user_key");
      sessionStorage.removeItem("database_user");
      console.log("🔒 Cleared persisted vault state from session storage");
    } catch (error) {
      console.warn("⚠️ Failed to clear vault state:", error);
    }

    if (this.currentState.user) {
      this.currentState = {
        ...this.currentState,
        user: {
          ...this.currentState.user,
          isVaultUnlocked: false,
          userKey: undefined, // Clear user key for security
        },
        isVaultLocked: true,
      };
    }

    this.notifyListeners();
  }

  // Sign out completely
  async signOut(): Promise<void> {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local storage
      try {
        localStorage.removeItem("google_user");
      } catch (error) {
        console.warn("⚠️ Failed to clear localStorage:", error);
      }

      // Clear session storage (vault state)
      try {
        sessionStorage.removeItem("vault_unlock_state");
        sessionStorage.removeItem("user_key");
        sessionStorage.removeItem("database_user");
      } catch (error) {
        console.warn("⚠️ Failed to clear sessionStorage:", error);
      }

      // Logout from auth service
      this.authService.logout();

      // Reset state
      this.currentState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        needsEncryptionSetup: false,
        isVaultLocked: true,
      };

      this.notifyListeners();
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  // Check if user has encryption setup
  private async checkEncryptionSetup(email: string): Promise<boolean> {
    try {
      console.log("🔍 Checking encryption setup for:", email);

      // Use API route to check encryption setup (bypasses RLS with admin client)
      const response = await fetch("/api/auth/check-encryption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API error checking encryption setup:", errorData);
        return false;
      }

      const { hasEncryption } = await response.json();
      console.log(`✅ User ${email} has encryption setup: ${hasEncryption}`);
      return hasEncryption;
    } catch (error) {
      console.error("❌ Failed to check encryption setup:", error);
      return false;
    }
  }

  // Sign in to Supabase with Google user
  private async signInToSupabase(googleUser: GoogleUser): Promise<void> {
    // For now, we'll use Supabase's signInWithPassword with a placeholder
    // In a full implementation, you'd set up proper Google OAuth with Supabase
    // This is a simplified approach for the current setup

    try {
      // Try to sign in (this might fail if user doesn't exist in Supabase auth)
      const { error } = await supabase.auth.signInWithPassword({
        email: googleUser.email,
        password: "google-oauth-placeholder", // This won't work in production
      });

      // If sign-in fails, we'll continue anyway since we're using Google auth
      // In production, you'd set up proper Supabase Google OAuth
      if (error) {
        console.log(
          "Supabase auth not set up for this user, continuing with Google auth only"
        );
      }
    } catch (error) {
      console.log(
        "Supabase auth error (expected for Google-only users):",
        error
      );
    }
  }

  // State management
  getState(): AuthState {
    return { ...this.currentState };
  }

  // Force client-side initialization
  async forceClientInitialization(): Promise<void> {
    if (typeof window !== "undefined") {
      console.log("🔄 Forcing client-side auth initialization");
      await this.initializeAuth();
    }
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener({ ...this.currentState }));
  }

  // Utility methods
  isSignedIn(): boolean {
    return this.currentState.isAuthenticated;
  }

  hasEncryptionSetup(): boolean {
    return this.currentState.user?.hasEncryptionSetup ?? false;
  }

  isVaultUnlocked(): boolean {
    return this.currentState.user?.isVaultUnlocked ?? false;
  }

  getCurrentUser(): UnifiedUser | null {
    return this.currentState.user;
  }

  getGoogleUser(): GoogleUser | null {
    return this.currentState.user?.googleUser ?? null;
  }

  getDatabaseUser(): AuthUser | null {
    return this.currentState.user?.databaseUser ?? null;
  }

  // Get current user key (only available when vault is unlocked)
  getUserKey(): Uint8Array | null {
    const userKey = this.currentState.user?.userKey ?? null;
    console.log("🔑 getUserKey called:", {
      hasUser: !!this.currentState.user,
      isAuthenticated: this.currentState.isAuthenticated,
      isVaultLocked: this.currentState.isVaultLocked,
      isVaultUnlocked: this.currentState.user?.isVaultUnlocked,
      hasEncryptionSetup: this.currentState.user?.hasEncryptionSetup,
      needsEncryptionSetup: this.currentState.needsEncryptionSetup,
      userKeyLength: userKey?.length ?? 0,
      userKeyType: userKey?.constructor.name ?? "null",
    });

    if (!this.currentState.isAuthenticated) {
      console.warn("🔑 User key unavailable: User not authenticated");
    } else if (this.currentState.isVaultLocked) {
      console.warn("🔑 User key unavailable: Vault is locked");
    } else if (!this.currentState.user?.isVaultUnlocked) {
      console.warn("🔑 User key unavailable: Vault not unlocked in user state");
    } else if (!userKey) {
      console.warn("🔑 User key unavailable: User key is null");
    }

    return userKey;
  }
}
