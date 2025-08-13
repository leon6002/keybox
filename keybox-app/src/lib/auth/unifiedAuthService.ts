// Unified Authentication Service
// Combines Google Sign-in with encrypted database authentication

import { supabase } from "../supabase";
import { SecurityServiceFactory } from "../security";
import { KeyboxAuthService, AuthUser } from "../security/authService";
import {
  initializeDatabaseService,
  initializeDatabaseWithMasterKey,
} from "../database";

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
    this.initializeAuth();
  }

  // Initialize authentication state
  private async initializeAuth(): Promise<void> {
    try {
      // Check for stored Google user
      const storedGoogleUser = localStorage.getItem("google_user");
      if (storedGoogleUser) {
        const googleUser: GoogleUser = JSON.parse(storedGoogleUser);

        // Check if user has database encryption setup
        const hasEncryption = await this.checkEncryptionSetup(googleUser.email);

        this.currentState = {
          user: {
            googleUser,
            hasEncryptionSetup: hasEncryption,
            isVaultUnlocked: false,
          },
          isAuthenticated: true,
          isLoading: false,
          needsEncryptionSetup: !hasEncryption,
          isVaultLocked: hasEncryption, // If they have encryption, vault starts locked
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
      localStorage.setItem("google_user", JSON.stringify(googleUser));

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
      } catch (sessionError) {
        console.error("❌ Session creation failed:", sessionError);
        console.error("Error details:", {
          name: sessionError.name,
          message: sessionError.message,
          stack: sessionError.stack,
        });
        throw sessionError;
      }

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

      this.notifyListeners();
    } catch (error) {
      console.error("Encryption setup error:", error);
      throw error;
    }
  }

  // Unlock vault with master password
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

      // Use API route to unlock vault (handles database lookup and password verification)
      const response = await fetch("/api/auth/unlock-vault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: this.currentState.user.googleUser.email,
          masterPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Vault unlock failed:", errorData);
        throw new Error(errorData.error || "Failed to unlock vault");
      }

      const responseData = await response.json();
      console.log("📦 Unlock API response:", responseData);

      const { user: databaseUser, userKey } = responseData;
      console.log("✅ Vault unlocked successfully");

      // Convert userKey array back to Uint8Array
      const userKeyBytes = new Uint8Array(userKey.key);
      console.log("🔑 Storing user key in state:", {
        originalLength: userKey.key.length,
        convertedLength: userKeyBytes.length,
        firstFewBytes: Array.from(userKeyBytes.slice(0, 8)),
      });

      // Initialize database services with master key
      await initializeDatabaseService();
      await initializeDatabaseWithMasterKey(userKeyBytes);

      // Update state
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

      console.log("✅ State updated with user key:", {
        userKeyLength: this.currentState.user?.userKey?.length ?? 0,
      });

      this.notifyListeners();
    } catch (error) {
      console.error("Vault unlock error:", error);
      throw error;
    }
  }

  // Lock vault
  lockVault(): void {
    this.authService.logout();

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
      localStorage.removeItem("google_user");

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
      isVaultUnlocked: this.currentState.user?.isVaultUnlocked,
      userKeyLength: userKey?.length ?? 0,
      userKeyType: userKey?.constructor.name ?? "null",
    });
    return userKey;
  }
}
