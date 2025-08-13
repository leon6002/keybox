// Optimized Load Service for Lightning-Fast Password Loading
// Loads from IndexedDB instantly, refreshes from API in background

import { PasswordEntry, Folder } from "@/types/password";
import { EncryptedCacheService } from "./encryptedCacheService";
import { OptimisticUpdateService } from "./optimisticUpdateService";
import { SecurityServiceFactory } from "../security";
import { UserKey } from "../security/types";

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

    try {
      // 1. Try to get from local optimistic updates first (most recent)
      let localEntries: any[] = [];
      try {
        localEntries = await this.optimisticService.getLocalPasswords(userId);
        console.log(
          `🔍 Local optimistic entries found: ${localEntries.length}`
        );
      } catch (error) {
        console.warn("⚠️ Failed to get local optimistic entries:", error);
        localEntries = [];
      }

      if (localEntries.length > 0) {
        console.log(`📦 Using ${localEntries.length} local optimistic entries`);

        // Start background refresh but return local data immediately
        this.startBackgroundRefresh(userId);

        return {
          entries: localEntries.slice(offset, offset + limit),
          folders: [], // TODO: Add folder support
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
          folders: [], // TODO: Add folder support
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
          folders: [],
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

  // Load from API (fallback or first time)
  private async loadFromAPI(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<LoadResult> {
    console.log("🌐 Loading passwords from API...");

    try {
      const response = await fetch("/api/passwords/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const encryptedCiphers = data.ciphers || [];

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
        folders: [], // TODO: Add folder support
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
      if (this.userKeyGetter) {
        const userKeyBytes = this.userKeyGetter();
        if (userKeyBytes) {
          return { key: userKeyBytes };
        }
      }

      console.warn("⚠️ User key not available for decryption");
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
