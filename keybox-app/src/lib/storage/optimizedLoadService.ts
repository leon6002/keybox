// Optimized Load Service for Lightning-Fast Password Loading
// Loads from IndexedDB instantly, refreshes from API in background

import { PasswordEntry, Folder } from "@/types/password";
import { EncryptedCacheService } from "./encryptedCacheService";
import { OptimisticUpdateService } from "./optimisticUpdateService";
import { SecurityServiceFactory } from "../security";
import { UserKey } from "../security/types";
import { FolderService } from "@/services/folderService";

export interface LoadOptions {
  forceRefresh?: boolean;
  limit?: number;
  offset?: number;
  decryptionBatchSize?: number;
}

export interface LoadResult {
  entries: PasswordEntry[];
  folders: Folder[];
  isFromCache: boolean;
  totalCount: number;
  hasMore: boolean;
}

export interface BackgroundSyncStatus {
  isRefreshing: boolean;
  lastRefreshTime: number;
  pendingDecryption: number;
  error?: string;
}

export class OptimizedLoadService {
  private static instance: OptimizedLoadService;
  private cacheService: EncryptedCacheService;
  private optimisticService: OptimisticUpdateService;
  private backgroundRefreshTimer: NodeJS.Timeout | null = null;
  private isBackgroundRefreshing = false;
  private userKeyGetter: (() => Uint8Array | null) | null = null;
  private decryptionQueue: any[] = [];
  private isProcessingDecryption = false;

  private constructor() {
    this.cacheService = EncryptedCacheService.getInstance();
    this.optimisticService = OptimisticUpdateService.getInstance();
  }

  public static getInstance(): OptimizedLoadService {
    if (!OptimizedLoadService.instance) {
      OptimizedLoadService.instance = new OptimizedLoadService();
    }
    return OptimizedLoadService.instance;
  }

  // Set user key getter for decryption
  setUserKeyGetter(getUserKeyFn: () => Uint8Array | null): void {
    this.userKeyGetter = getUserKeyFn;
  }

  // Main load method - instant from cache, background refresh
  async loadPasswordsOptimized(
    userId: string,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    const {
      forceRefresh = false,
      limit = 50,
      offset = 0,
      decryptionBatchSize = 10,
    } = options;

    console.log("⚡ Starting optimized password load for user:", userId);

    // Early check: if user key is not available, return empty result with common folders
    const userKey = await this.getUserKey();
    if (!userKey) {
      console.warn(
        "⚠️ User key not available at start of load, returning empty result with common folders"
      );
      console.warn(
        "💡 This is normal during initial load or when user is not authenticated"
      );
      console.warn(
        "💡 The UI should handle this gracefully and show appropriate state"
      );
      return {
        entries: [],
        folders: FolderService.getCommonFolders(),
        isFromCache: false,
        totalCount: 0,
        hasMore: false,
      };
    }

    try {
      // 1. Try to get from local optimistic updates first (most recent)
      let localEntries: any[] = [];
      let localFolders: any[] = [];
      try {
        console.log(`🔍 Attempting to get local passwords for user: ${userId}`);
        localEntries = await this.optimisticService.getLocalPasswords(userId);
        localFolders = await this.optimisticService.getLocalFolders(userId);
        console.log(
          `🔍 Local optimistic entries found: ${localEntries.length}, folders: ${localFolders.length}`
        );
        if (localEntries.length > 0) {
          console.log(`🔍 Sample local entry:`, {
            id: localEntries[0].id,
            title: localEntries[0].title,
            hasUsername: !!localEntries[0].username,
            hasPassword: !!localEntries[0].password,
            createdAt: localEntries[0].createdAt,
          });
        }
      } catch (error) {
        console.warn("⚠️ Failed to get local optimistic entries:", error);
        localEntries = [];
      }

      // Load folders using the user key we already have
      let userFolders: any[] = [];
      try {
        userFolders = await FolderService.loadEncryptedFolders(
          userId,
          userKey.key
        );
        console.log(`📁 Loaded ${userFolders.length} folders`);
      } catch (error) {
        console.warn("⚠️ Failed to load folders, using common folders:", error);
        userFolders = FolderService.getCommonFolders();
      }

      if (localEntries.length > 0) {
        console.log(`📦 Using ${localEntries.length} local optimistic entries`);

        // Start background refresh but return local data immediately
        this.startBackgroundRefresh(userId);

        return {
          entries: localEntries.slice(offset, offset + limit),
          folders: userFolders, // Use properly loaded folders
          isFromCache: true,
          totalCount: localEntries.length,
          hasMore: localEntries.length > offset + limit,
        };
      }

      // 2. Try to get from encrypted cache
      const cacheKey = EncryptedCacheService.generateCacheKey(
        "passwords/load",
        userId
      );
      console.log(`🔍 Checking cache with key: ${cacheKey}`);

      let cachedEncryptedData: any = null;
      try {
        cachedEncryptedData =
          await this.cacheService.getCachedEncryptedResponse(cacheKey, userId);
      } catch (error) {
        console.warn("⚠️ Failed to get cached data:", error);
        cachedEncryptedData = null;
      }

      console.log(
        `🔍 Cached data found: ${cachedEncryptedData ? "YES" : "NO"}`
      );
      if (cachedEncryptedData) {
        console.log(
          `🔍 Cached data length: ${
            Array.isArray(cachedEncryptedData)
              ? cachedEncryptedData.length
              : "not array"
          }`
        );
      }

      if (cachedEncryptedData && !forceRefresh) {
        console.log(
          "📦 Found cached encrypted data, decrypting progressively..."
        );

        // Start background refresh
        this.startBackgroundRefresh(userId);

        // Decrypt progressively for instant UI
        const decryptedEntries = await this.progressiveDecryption(
          cachedEncryptedData as any[],
          decryptionBatchSize
        );

        return {
          entries: decryptedEntries.slice(offset, offset + limit),
          folders: userFolders, // Use properly loaded folders
          isFromCache: true,
          totalCount: decryptedEntries.length,
          hasMore: decryptedEntries.length > offset + limit,
        };
      }

      // 3. No cache available, load from API (first time or forced refresh)
      console.log("🌐 No cache available, loading from API...");
      const apiResult = await this.loadFromAPI(userId, { limit, offset });
      console.log(`🌐 API result: ${apiResult.entries.length} entries loaded`);
      return apiResult;
    } catch (error) {
      console.error("❌ Failed to load passwords optimized:", error);

      // Fallback to API load
      try {
        return await this.loadFromAPI(userId, { limit, offset });
      } catch (apiError) {
        console.error("❌ API fallback also failed:", apiError);
        return {
          entries: [],
          folders: FolderService.getCommonFolders(),
          isFromCache: false,
          totalCount: 0,
          hasMore: false,
        };
      }
    }
  }

  // Progressive decryption for instant UI feedback
  private async progressiveDecryption(
    encryptedCiphers: any[],
    batchSize: number = 10
  ): Promise<PasswordEntry[]> {
    const userKey = await this.getUserKey();
    if (!userKey) {
      console.error("❌ User key not available for decryption");
      return [];
    }

    const vaultService = SecurityServiceFactory.getVaultService();
    const decryptedEntries: PasswordEntry[] = [];

    // Process in batches for better performance
    for (let i = 0; i < encryptedCiphers.length; i += batchSize) {
      const batch = encryptedCiphers.slice(i, i + batchSize);
      console.log("batch is => : ", batch);

      try {
        const batchPromises = batch.map(async (cipher) => {
          try {
            return await vaultService.decryptCipher(cipher, userKey);
          } catch (error) {
            console.error(`❌ Failed to decrypt cipher ${cipher.id}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(
          (entry): entry is PasswordEntry => entry !== null
        );
        decryptedEntries.push(...validResults);

        // Small delay between batches to keep UI responsive
        if (i + batchSize < encryptedCiphers.length) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.error(`❌ Failed to decrypt batch starting at ${i}:`, error);
      }
    }

    console.log(
      `✅ Decrypted ${decryptedEntries.length}/${encryptedCiphers.length} entries`
    );
    return decryptedEntries;
  }

  private async fetchUserPasswords(userId: string): Promise<any[]> {
    const response = await fetch("/api/passwords/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.ciphers || [];
  }

  // Load from API (fallback or first time)
  private async loadFromAPI(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<LoadResult> {
    console.log("🌐 Loading passwords from API...");

    try {
      const userKey = await this.getUserKey();
      if (!userKey) {
        console.warn(
          "⚠️ User key not available for API load, returning empty result"
        );
        console.warn(
          "This usually means the user is not authenticated or vault is locked"
        );
        // Return empty result instead of throwing error
        return {
          entries: [],
          folders: FolderService.getCommonFolders(),
          isFromCache: false,
          totalCount: 0,
          hasMore: false,
        };
      }

      const encryptedCiphers = await this.fetchUserPasswords(userId);

      const userFolders = await FolderService.loadEncryptedFolders(
        userId,
        userKey.key
      );

      console.log(
        `📥 Loaded ${encryptedCiphers.length} encrypted passwords from API`
      );

      // Cache the encrypted response
      if (encryptedCiphers.length > 0) {
        const cacheKey = EncryptedCacheService.generateCacheKey(
          "passwords/load",
          userId
        );
        await this.cacheService.cacheEncryptedResponse(
          cacheKey,
          encryptedCiphers,
          userId
        );
      }

      // Decrypt progressively
      const decryptedEntries = await this.progressiveDecryption(
        encryptedCiphers
      );

      return {
        entries: decryptedEntries.slice(
          options.offset || 0,
          (options.offset || 0) + (options.limit || 50)
        ),
        folders: userFolders, // TODO: Add folder support
        isFromCache: false,
        totalCount: decryptedEntries.length,
        hasMore:
          decryptedEntries.length >
          (options.offset || 0) + (options.limit || 50),
      };
    } catch (error) {
      console.error("❌ Failed to load from API:", error);
      throw error;
    }
  }

  // Background refresh without blocking UI
  private startBackgroundRefresh(userId: string): void {
    if (this.isBackgroundRefreshing) {
      console.log("🔄 Background refresh already in progress");
      return;
    }

    console.log("🔄 Starting background refresh...");
    this.isBackgroundRefreshing = true;

    // Use setTimeout to avoid blocking the current execution
    setTimeout(async () => {
      try {
        await this.backgroundRefresh(userId);
      } catch (error) {
        console.error("❌ Background refresh failed:", error);
      } finally {
        this.isBackgroundRefreshing = false;
      }
    }, 100); // Small delay to let UI update first
  }

  // Background refresh implementation
  private async backgroundRefresh(userId: string): Promise<void> {
    try {
      console.log("🔄 Executing background refresh...");

      const response = await fetch("/api/passwords/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Background refresh API error: ${response.status}`);
      }

      const data = await response.json();
      const encryptedCiphers = data.ciphers || [];

      console.log(
        `🔄 Background refresh loaded ${encryptedCiphers.length} encrypted passwords`
      );

      // Update cache with fresh data
      if (encryptedCiphers.length > 0) {
        const cacheKey = EncryptedCacheService.generateCacheKey(
          "passwords/load",
          userId
        );
        await this.cacheService.cacheEncryptedResponse(
          cacheKey,
          encryptedCiphers,
          userId
        );
        console.log("✅ Background refresh updated cache");
      }

      // Emit event for UI to refresh if needed
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("passwordsRefreshed", {
            detail: { userId, count: encryptedCiphers.length },
          })
        );
      }
    } catch (error) {
      console.error("❌ Background refresh failed:", error);
    }
  }

  // Get background sync status
  getBackgroundSyncStatus(): BackgroundSyncStatus {
    return {
      isRefreshing: this.isBackgroundRefreshing,
      lastRefreshTime: Date.now(), // TODO: Track actual last refresh time
      pendingDecryption: this.decryptionQueue.length,
    };
  }

  // Force refresh from API
  async forceRefresh(userId: string): Promise<LoadResult> {
    console.log("🔄 Force refreshing passwords...");

    // Invalidate cache first
    const cacheKey = EncryptedCacheService.generateCacheKey(
      "passwords/load",
      userId
    );
    await this.cacheService.invalidateCache(cacheKey);

    // Load fresh data
    return await this.loadPasswordsOptimized(userId, { forceRefresh: true });
  }

  // Get user key for decryption
  private async getUserKey(): Promise<UserKey | null> {
    try {
      console.log("🔍 getUserKey debug info:", {
        hasUserKeyGetter: !!this.userKeyGetter,
        userKeyGetterType: typeof this.userKeyGetter,
      });

      if (this.userKeyGetter) {
        const userKeyBytes = this.userKeyGetter();
        console.log("🔍 userKeyGetter result:", {
          hasUserKeyBytes: !!userKeyBytes,
          userKeyLength: userKeyBytes?.length ?? 0,
          userKeyType: userKeyBytes?.constructor.name ?? "null",
        });

        if (userKeyBytes) {
          return { key: userKeyBytes };
        }
      }

      console.warn(
        "⚠️ User key not available for decryption - possible causes:"
      );
      console.warn("  1. User not authenticated");
      console.warn("  2. Vault is locked");
      console.warn("  3. User key getter not set");
      console.warn("  4. User key getter returned null");
      return null;
    } catch (error) {
      console.error("❌ Failed to get user key:", error);
      return null;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.backgroundRefreshTimer) {
      clearTimeout(this.backgroundRefreshTimer);
      this.backgroundRefreshTimer = null;
    }
    this.isBackgroundRefreshing = false;
    this.decryptionQueue = [];
  }
}
