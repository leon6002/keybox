// Encrypted Cache Service for API Response Caching
// Stores only encrypted API responses, never decrypted passwords

import { EncryptedCipher, EncryptedFolder } from "../security/types";

export interface CacheMetadata {
  timestamp: number;
  version: string;
  userId: string;
  responseHash: string; // Hash of the response for integrity checking
}

export interface EncryptedCacheEntry {
  data: any; // Encrypted API response
  metadata: CacheMetadata;
}

export interface CacheConfig {
  maxAge: number; // Cache expiration time in milliseconds
  maxEntries: number; // Maximum number of cached entries
  compressionEnabled: boolean;
}

export class EncryptedCacheService {
  private static instance: EncryptedCacheService;
  private db: IDBDatabase | null = null;
  private config: CacheConfig;
  private readonly DB_NAME = "KeyboxEncryptedCache";
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = "encryptedResponses";

  private constructor() {
    this.config = {
      maxAge: 5 * 60 * 1000, // 5 minutes default
      maxEntries: 1000,
      compressionEnabled: true,
    };
  }

  public static getInstance(): EncryptedCacheService {
    if (!EncryptedCacheService.instance) {
      EncryptedCacheService.instance = new EncryptedCacheService();
    }
    return EncryptedCacheService.instance;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error("❌ Failed to open encrypted cache DB:", request.error);
        reject(new Error("Failed to initialize encrypted cache"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ Encrypted cache initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log("🔄 Upgrading encrypted cache schema...");

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: "key",
          });
          store.createIndex("userId", "metadata.userId", { unique: false });
          store.createIndex("timestamp", "metadata.timestamp", {
            unique: false,
          });
        }
      };
    });
  }

  // Cache encrypted API responses with individual cipher storage
  async cacheEncryptedResponse(
    cacheKey: string,
    encryptedData: EncryptedCipher[] | EncryptedFolder[],
    userId: string
  ): Promise<void> {
    if (!this.db) {
      console.warn("⚠️ Cache not initialized, skipping cache operation");
      return;
    }

    try {
      const responseString = JSON.stringify(encryptedData);
      const responseHash = await this.generateHash(responseString);

      const cacheEntry: EncryptedCacheEntry = {
        data: encryptedData, // Store encrypted data as-is
        metadata: {
          timestamp: Date.now(),
          version: "1.0.0",
          userId,
          responseHash,
        },
      };

      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);

      await this.promisifyRequest(
        store.put({
          key: cacheKey,
          ...cacheEntry,
        })
      );

      console.log(`✅ Cached encrypted response: ${cacheKey}`);

      // Also cache individual ciphers for faster access
      if (Array.isArray(encryptedData) && encryptedData.length > 0) {
        await this.cacheIndividualCiphers(encryptedData, userId);
      }

      // Clean up old entries periodically
      await this.cleanupExpiredEntries();
    } catch (error) {
      console.error("❌ Failed to cache encrypted response:", error);
    }
  }

  // Cache individual encrypted ciphers for faster partial loading
  private async cacheIndividualCiphers(
    encryptedCiphers: any[],
    userId: string
  ): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);

      for (const cipher of encryptedCiphers) {
        if (cipher.id) {
          const cipherKey = `cipher:${userId}:${cipher.id}`;
          const cipherEntry: EncryptedCacheEntry = {
            data: cipher,
            metadata: {
              timestamp: Date.now(),
              version: "1.0.0",
              userId,
              responseHash: await this.generateHash(JSON.stringify(cipher)),
            },
          };

          await this.promisifyRequest(
            store.put({
              key: cipherKey,
              ...cipherEntry,
            })
          );
        }
      }

      console.log(`✅ Cached ${encryptedCiphers.length} individual ciphers`);
    } catch (error) {
      console.error("❌ Failed to cache individual ciphers:", error);
    }
  }

  // Retrieve cached encrypted responses
  async getCachedEncryptedResponse<T = EncryptedCipher[] | EncryptedFolder[]>(
    cacheKey: string,
    userId: string
  ): Promise<T | null> {
    if (!this.db) {
      console.warn("⚠️ Cache not initialized");
      return null;
    }

    try {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);

      const result = await this.promisifyRequest(store.get(cacheKey));

      if (!result) {
        console.log(`📭 No cached data found for: ${cacheKey}`);
        return null;
      }

      const cacheEntry = result as EncryptedCacheEntry & { key: string };

      // Verify user matches
      if (cacheEntry.metadata.userId !== userId) {
        console.warn("⚠️ Cache entry user mismatch, invalidating");
        await this.invalidateCache(cacheKey);
        return null;
      }

      // Check if cache is expired
      const age = Date.now() - cacheEntry.metadata.timestamp;
      if (age > this.config.maxAge) {
        console.log(`⏰ Cache expired for: ${cacheKey}`);
        await this.invalidateCache(cacheKey);
        return null;
      }

      // Verify data integrity
      const responseString = JSON.stringify(cacheEntry.data);
      const currentHash = await this.generateHash(responseString);
      if (currentHash !== cacheEntry.metadata.responseHash) {
        console.warn("⚠️ Cache integrity check failed, invalidating");
        await this.invalidateCache(cacheKey);
        return null;
      }

      console.log(`📦 Retrieved cached encrypted data: ${cacheKey}`);
      return cacheEntry.data as T;
    } catch (error) {
      console.error("❌ Failed to retrieve cached response:", error);
      return null;
    }
  }

  // Invalidate specific cache entry
  async invalidateCache(cacheKey: string): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);

      await this.promisifyRequest(store.delete(cacheKey));
      console.log(`🗑️ Invalidated cache: ${cacheKey}`);
    } catch (error) {
      console.error("❌ Failed to invalidate cache:", error);
    }
  }

  // Invalidate all cache entries for a user
  async invalidateUserCache(userId: string): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index("userId");

      const cursor = index.openCursor(IDBKeyRange.only(userId));

      await new Promise<void>((resolve, reject) => {
        cursor.onsuccess = () => {
          const cursorResult = cursor.result;
          if (cursorResult) {
            cursorResult.delete();
            cursorResult.continue();
          } else {
            resolve();
          }
        };
        cursor.onerror = () => reject(cursor.error);
      });

      console.log(`🗑️ Invalidated all cache for user: ${userId}`);
    } catch (error) {
      console.error("❌ Failed to invalidate user cache:", error);
    }
  }

  // Clean up expired entries
  private async cleanupExpiredEntries(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index("timestamp");

      const cutoffTime = Date.now() - this.config.maxAge;
      const cursor = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

      let deletedCount = 0;

      await new Promise<void>((resolve, reject) => {
        cursor.onsuccess = () => {
          const cursorResult = cursor.result;
          if (cursorResult) {
            cursorResult.delete();
            deletedCount++;
            cursorResult.continue();
          } else {
            resolve();
          }
        };
        cursor.onerror = () => reject(cursor.error);
      });

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired cache entries`);
      }
    } catch (error) {
      console.error("❌ Failed to cleanup expired entries:", error);
    }
  }

  // Generate cache keys
  static generateCacheKey(
    endpoint: string,
    userId: string,
    params?: Record<string, any>
  ): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `${endpoint}:${userId}:${btoa(paramString)}`;
  }

  // Check if cache is available and fresh
  async isCacheValid(cacheKey: string, userId: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);

      const result = await this.promisifyRequest(store.get(cacheKey));

      if (!result) return false;

      const cacheEntry = result as EncryptedCacheEntry & { key: string };

      // Check user match
      if (cacheEntry.metadata.userId !== userId) return false;

      // Check expiration
      const age = Date.now() - cacheEntry.metadata.timestamp;
      return age <= this.config.maxAge;
    } catch (error) {
      console.error("❌ Failed to check cache validity:", error);
      return false;
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    if (!this.db) {
      return { totalEntries: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 };
    }

    try {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);

      const totalEntries = await this.promisifyRequest(store.count());

      // Get size estimate
      const estimate = await navigator.storage?.estimate?.();
      const totalSize = estimate?.usage || 0;

      // Get timestamp range
      const index = store.index("timestamp");
      const oldestCursor = index.openCursor(null, "next");
      const newestCursor = index.openCursor(null, "prev");

      const oldest = await this.promisifyRequest(oldestCursor);
      const newest = await this.promisifyRequest(newestCursor);

      return {
        totalEntries,
        totalSize,
        oldestEntry: oldest?.value?.metadata?.timestamp || 0,
        newestEntry: newest?.value?.metadata?.timestamp || 0,
      };
    } catch (error) {
      console.error("❌ Failed to get cache stats:", error);
      return { totalEntries: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 };
    }
  }

  // Utility methods
  private async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all cache data
  async clearAllCache(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);

      await this.promisifyRequest(store.clear());
      console.log("🗑️ All cache data cleared");
    } catch (error) {
      console.error("❌ Failed to clear cache:", error);
    }
  }

  // Update cache configuration
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("⚙️ Cache configuration updated:", this.config);
  }
}
