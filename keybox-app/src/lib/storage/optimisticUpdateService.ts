// Optimistic Update Service for Instant Password Operations
// Saves to IndexedDB immediately, syncs to Supabase in background

import { PasswordEntry, Folder } from "@/types/password";
import { EncryptedCacheService } from "./encryptedCacheService";
import { SecurityServiceFactory } from "../security";
import { UserKey } from "../security/types";

export interface PendingOperation {
  id: string;
  type: "create" | "update" | "delete";
  timestamp: number;
  data?: PasswordEntry;
  userId: string;
  retryCount: number;
  maxRetries: number;
  status: "pending" | "syncing" | "synced" | "failed";
}

export interface OptimisticUpdateConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  syncInterval: number;
}

export class OptimisticUpdateService {
  private static instance: OptimisticUpdateService;
  private db: IDBDatabase | null = null;
  private cacheService: EncryptedCacheService;
  private syncTimer: NodeJS.Timeout | null = null;
  private config: OptimisticUpdateConfig;
  private userKeyGetter: (() => Uint8Array | null) | null = null;
  private readonly DB_NAME = "KeyboxOptimisticUpdates";
  private readonly DB_VERSION = 2;
  private readonly PENDING_STORE = "pendingOperations";
  private readonly LOCAL_STORE = "localPasswords";
  private readonly LOCAL_FOLDER = "localFolders";

  private constructor() {
    this.cacheService = EncryptedCacheService.getInstance();
    this.config = {
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      batchSize: 10,
      syncInterval: 5000, // 5 seconds - fast and efficient sync
    };
  }

  public static getInstance(): OptimisticUpdateService {
    if (!OptimisticUpdateService.instance) {
      OptimisticUpdateService.instance = new OptimisticUpdateService();
    }
    return OptimisticUpdateService.instance;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error("❌ Failed to open optimistic update DB:", request.error);
        reject(new Error("Failed to initialize optimistic updates"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ Optimistic update service initialized");
        this.startBackgroundSync();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;
        console.log(
          `🔄 Upgrading optimistic update schema from v${oldVersion} to v${newVersion}...`
        );

        // Store for pending operations
        if (!db.objectStoreNames.contains(this.PENDING_STORE)) {
          console.log("📦 Creating pending operations store...");
          const pendingStore = db.createObjectStore(this.PENDING_STORE, {
            keyPath: "id",
          });
          pendingStore.createIndex("userId", "userId", { unique: false });
          pendingStore.createIndex("timestamp", "timestamp", { unique: false });
          pendingStore.createIndex("status", "status", { unique: false });
        }

        // Store for local password data (optimistic updates)
        if (!db.objectStoreNames.contains(this.LOCAL_STORE)) {
          console.log("📦 Creating local passwords store...");
          const localStore = db.createObjectStore(this.LOCAL_STORE, {
            keyPath: "id",
          });
          localStore.createIndex("userId", "userId", { unique: false });
          localStore.createIndex("updatedAt", "updatedAt", { unique: false });
          localStore.createIndex("syncStatus", "syncStatus", { unique: false });
        }

        // Store for local folder data (optimistic updates)
        if (!db.objectStoreNames.contains(this.LOCAL_FOLDER)) {
          console.log("📦 Creating local folders store...");
          const localFolderStore = db.createObjectStore(this.LOCAL_FOLDER, {
            keyPath: "id",
          });
          localFolderStore.createIndex("userId", "userId", { unique: false });
          localFolderStore.createIndex("updatedAt", "updatedAt", {
            unique: false,
          });
          localFolderStore.createIndex("syncStatus", "syncStatus", {
            unique: false,
          });
        }
      };
    });
  }

  // Optimistic password creation
  async createPasswordOptimistically(
    entry: PasswordEntry,
    userId: string
  ): Promise<PasswordEntry> {
    if (!this.db) throw new Error("Optimistic update service not initialized");

    try {
      // Get user key for local encryption
      const userKey = await this.getUserKey();
      if (!userKey) {
        throw new Error("User key not available for local encryption");
      }

      // 1. Encrypt the entry before storing locally
      const vaultService = SecurityServiceFactory.getVaultService();
      const encryptedCipher = await vaultService.encryptCipher(entry, userKey);

      // Store encrypted data in IndexedDB
      const localEntry = {
        id: entry.id,
        userId,
        encryptedData: encryptedCipher, // Store encrypted cipher
        syncStatus: "pending" as const,
        localTimestamp: Date.now(),
        // Keep some metadata unencrypted for indexing/searching
        folderId: entry.folderId,
        isFavorite: entry.isFavorite,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };

      const transaction = this.db.transaction([this.LOCAL_STORE], "readwrite");
      const store = transaction.objectStore(this.LOCAL_STORE);
      await this.promisifyRequest(store.put(localEntry));

      // 2. Queue for background sync
      const operation: PendingOperation = {
        id: `create_${entry.id}_${Date.now()}`,
        type: "create",
        timestamp: Date.now(),
        data: entry,
        userId,
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        status: "pending",
      };

      await this.queueOperation(operation);

      console.log("⚡ Password created optimistically:", entry.id);
      return entry;
    } catch (error) {
      console.error("❌ Failed optimistic password creation:", error);
      throw error;
    }
  }

  // Optimistic password update
  async updatePasswordOptimistically(
    entry: PasswordEntry,
    userId: string
  ): Promise<PasswordEntry> {
    if (!this.db) throw new Error("Optimistic update service not initialized");

    try {
      // Get user key for local encryption
      const userKey = await this.getUserKey();
      if (!userKey) {
        throw new Error("User key not available for local encryption");
      }

      // 1. Encrypt the entry before storing locally
      const vaultService = SecurityServiceFactory.getVaultService();
      const encryptedCipher = await vaultService.encryptCipher(entry, userKey);

      // Store encrypted data in IndexedDB
      const localEntry = {
        id: entry.id,
        userId,
        encryptedData: encryptedCipher, // Store encrypted cipher
        syncStatus: "pending" as const,
        localTimestamp: Date.now(),
        // Keep some metadata unencrypted for indexing/searching
        folderId: entry.folderId,
        isFavorite: entry.isFavorite,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };

      const transaction = this.db.transaction([this.LOCAL_STORE], "readwrite");
      const store = transaction.objectStore(this.LOCAL_STORE);
      await this.promisifyRequest(store.put(localEntry));

      // 2. Queue for background sync
      const operation: PendingOperation = {
        id: `update_${entry.id}_${Date.now()}`,
        type: "update",
        timestamp: Date.now(),
        data: entry,
        userId,
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        status: "pending",
      };

      await this.queueOperation(operation);

      console.log("⚡ Password updated optimistically:", entry.id);
      return entry;
    } catch (error) {
      console.error("❌ Failed optimistic password update:", error);
      throw error;
    }
  }

  // Optimistic password deletion
  async deletePasswordOptimistically(
    entryId: string,
    userId: string
  ): Promise<void> {
    if (!this.db) throw new Error("Optimistic update service not initialized");

    try {
      // 1. Mark as deleted in local IndexedDB
      const transaction = this.db.transaction([this.LOCAL_STORE], "readwrite");
      const store = transaction.objectStore(this.LOCAL_STORE);

      // Get the entry first
      const entry = await this.promisifyRequest(store.get(entryId));
      if (entry) {
        // Mark as deleted instead of removing (keep encrypted data for sync)
        const deletedEntry = {
          ...entry,
          syncStatus: "deleted" as const,
          localTimestamp: Date.now(),
        };
        await this.promisifyRequest(store.put(deletedEntry));
      }

      // 2. Queue for background sync
      const operation: PendingOperation = {
        id: `delete_${entryId}_${Date.now()}`,
        type: "delete",
        timestamp: Date.now(),
        data: { id: entryId } as PasswordEntry,
        userId,
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        status: "pending",
      };

      await this.queueOperation(operation);

      console.log("⚡ Password deleted optimistically:", entryId);
    } catch (error) {
      console.error("❌ Failed optimistic password deletion:", error);
      throw error;
    }
  }

  // Get local passwords (including optimistic updates)
  async getLocalPasswords(userId: string): Promise<PasswordEntry[]> {
    if (!this.db) {
      console.log("📦 getLocalPasswords: No database connection");
      return [];
    }

    try {
      // Get user key for decryption
      const userKey = await this.getUserKey();
      if (!userKey) {
        console.warn(
          "⚠️ User key not available for decryption, returning empty array"
        );
        return [];
      }

      const transaction = this.db.transaction([this.LOCAL_STORE], "readonly");
      const store = transaction.objectStore(this.LOCAL_STORE);
      const index = store.index("userId");

      const entries = await this.promisifyRequest(index.getAll(userId));
      console.log(
        `📦 getLocalPasswords: Found ${entries.length} encrypted entries for user ${userId}`
      );

      // Filter out deleted entries and decrypt active ones
      const activeEntries: PasswordEntry[] = [];
      const vaultService = SecurityServiceFactory.getVaultService();

      for (const entry of entries) {
        if (entry.syncStatus === "deleted") {
          console.log(`📦 Filtering out deleted entry: ${entry.id}`);
          continue; // Skip deleted entries
        }

        try {
          // Decrypt the stored cipher
          const decryptedEntry = await vaultService.decryptCipher(
            entry.encryptedData,
            userKey
          );

          // Merge with metadata that was stored unencrypted
          const fullEntry: PasswordEntry = {
            ...decryptedEntry,
            id: entry.id,
            folderId: entry.folderId,
            isFavorite: entry.isFavorite,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          };

          activeEntries.push(fullEntry);
        } catch (decryptError) {
          console.error(
            `❌ Failed to decrypt entry ${entry.id}:`,
            decryptError
          );
          // Skip entries that can't be decrypted
        }
      }

      console.log(
        `📦 getLocalPasswords: Returning ${activeEntries.length} decrypted entries`
      );
      return activeEntries;
    } catch (error) {
      console.error("❌ Failed to get local passwords:", error);
      return [];
    }
  }

  // Helper method to get encrypted data from local storage
  private async getEncryptedDataFromLocal(
    entryId: string
  ): Promise<any | null> {
    if (!this.db) return null;

    try {
      const transaction = this.db.transaction([this.LOCAL_STORE], "readonly");
      const store = transaction.objectStore(this.LOCAL_STORE);
      const entry = await this.promisifyRequest(store.get(entryId));

      return entry?.encryptedData || null;
    } catch (error) {
      console.error(
        "❌ Failed to get encrypted data from local storage:",
        error
      );
      return null;
    }
  }

  async getLocalFolders(userId: string): Promise<Folder[]> {
    if (!this.db) return [];
    try {
      const transaction = this.db.transaction([this.LOCAL_FOLDER], "readonly");
      const store = transaction.objectStore(this.LOCAL_FOLDER);
      const index = store.index("userId");

      const folders = await this.promisifyRequest(index.getAll(userId));

      return folders;
    } catch (error) {
      console.error("❌ Failed to get local folders:", error);
      return [];
    }
  }

  // Queue operation for background sync
  private async queueOperation(operation: PendingOperation): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.PENDING_STORE], "readwrite");
    const store = transaction.objectStore(this.PENDING_STORE);
    await this.promisifyRequest(store.put(operation));
  }

  // Background sync process
  private startBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      await this.processPendingOperations();
    }, this.config.syncInterval);

    // Also process immediately
    setTimeout(() => this.processPendingOperations(), 1000);
  }

  // Check network connectivity
  private async isOnline(): Promise<boolean> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return false;
    }

    try {
      // Try a simple fetch to check connectivity
      const response = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async processPendingOperations(): Promise<void> {
    if (!this.db) return;

    // Check network connectivity first
    const online = await this.isOnline();
    if (!online) {
      console.log("📴 Offline, skipping sync operations");
      return;
    }

    try {
      const transaction = this.db.transaction([this.PENDING_STORE], "readonly");
      const store = transaction.objectStore(this.PENDING_STORE);
      const index = store.index("status");

      const pendingOps = await this.promisifyRequest(index.getAll("pending"));

      if (pendingOps.length === 0) return;

      console.log(`🔄 Processing ${pendingOps.length} pending operations...`);

      // Process operations in batches
      const batches = this.chunkArray(pendingOps, this.config.batchSize);

      for (const batch of batches) {
        await Promise.allSettled(batch.map((op) => this.syncOperation(op)));
      }
    } catch (error) {
      console.error("❌ Failed to process pending operations:", error);
    }
  }

  private async syncOperation(operation: PendingOperation): Promise<void> {
    try {
      // Mark as syncing
      await this.updateOperationStatus(operation.id, "syncing");

      let success = false;

      switch (operation.type) {
        case "create":
          success = await this.syncCreate(operation);
          break;
        case "update":
          success = await this.syncUpdate(operation);
          break;
        case "delete":
          success = await this.syncDelete(operation);
          break;
      }

      if (success) {
        await this.updateOperationStatus(operation.id, "synced");
        await this.removeOperation(operation.id);
        console.log(
          `✅ Synced operation: ${operation.type} ${operation.data?.id}`
        );
      } else {
        throw new Error(`Failed to sync ${operation.type} operation`);
      }
    } catch (error) {
      console.error(`❌ Failed to sync operation ${operation.id}:`, error);

      // Increment retry count
      operation.retryCount++;

      if (operation.retryCount >= operation.maxRetries) {
        await this.updateOperationStatus(operation.id, "failed");
        console.error(`💥 Operation failed permanently: ${operation.id}`);
      } else {
        await this.updateOperationStatus(operation.id, "pending");
        console.log(
          `🔄 Will retry operation ${operation.id} (${operation.retryCount}/${operation.maxRetries})`
        );
      }
    }
  }

  private async syncCreate(operation: PendingOperation): Promise<boolean> {
    if (!operation.data) {
      console.error("❌ No operation data for sync create");
      return false;
    }

    try {
      console.log("🔄 Starting sync create for:", operation.data.id);

      // Get the encrypted data from local IndexedDB instead of re-encrypting
      const encryptedCipher = await this.getEncryptedDataFromLocal(
        operation.data.id
      );
      if (!encryptedCipher) {
        console.error("❌ Could not find encrypted data in local storage");
        return false;
      }

      console.log("📤 Using pre-encrypted data from IndexedDB for sync");

      console.log("📤 Sending encrypted data to API:", {
        userId: operation.userId,
        entryId: operation.data.id,
        hasEncryptedCipher: !!encryptedCipher,
        hasName: !!encryptedCipher?.name,
        hasData: !!encryptedCipher?.data,
        encryptedCipherId: encryptedCipher?.id,
        isUpdate: false,
      });

      // For optimistic creates, always use create mode (not update)
      // The local UUID doesn't exist in the database yet
      const response = await fetch("/api/passwords/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: operation.userId,
          encryptedCipher, // Send encrypted data
          isUpdate: false, // Always create for optimistic entries
          entryId: null, // Don't pass the local UUID
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        // Handle specific error cases
        if (response.status >= 500) {
          // Server error - retry later
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        } else if (response.status === 401 || response.status === 403) {
          // Authentication error - don't retry
          console.error("❌ Authentication error, marking operation as failed");
          return false;
        } else {
          // Client error - don't retry
          console.error("❌ Client error, marking operation as failed");
          return false;
        }
      }

      const result = await response.json();
      console.log("✅ Sync create successful:", {
        localId: operation.data.id,
        serverCipher: result.cipher?.id,
      });

      // Update local entry as synced
      await this.markLocalEntrySynced(operation.data.id);

      // Invalidate cache to force refresh
      const cacheKey = EncryptedCacheService.generateCacheKey(
        "passwords/load",
        operation.userId
      );
      await this.cacheService.invalidateCache(cacheKey);

      return true;
    } catch (error) {
      console.error("❌ Failed to sync create operation:", error);
      return false;
    }
  }

  private async syncUpdate(operation: PendingOperation): Promise<boolean> {
    if (!operation.data) return false;

    try {
      // Get the encrypted data from local IndexedDB instead of re-encrypting
      const encryptedCipher = await this.getEncryptedDataFromLocal(
        operation.data.id
      );
      if (!encryptedCipher) {
        console.error("❌ Could not find encrypted data in local storage");
        return false;
      }

      console.log("📤 Using pre-encrypted data from IndexedDB for update sync");

      console.log("📤 Sending update data to API:", {
        userId: operation.userId,
        entryId: operation.data.id,
        hasEncryptedCipher: !!encryptedCipher,
        encryptedCipherId: encryptedCipher?.id,
        isUpdate: true,
      });

      // Try update first, but if it fails due to missing entry, try create
      let response = await fetch("/api/passwords/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: operation.userId,
          encryptedCipher, // Send encrypted data
          isUpdate: true, // This is an update operation
          entryId: operation.data.id,
        }),
      });

      // If update fails because entry doesn't exist, try creating it
      if (!response.ok) {
        const errorText = await response.text();
        console.warn("⚠️ Update failed, trying create instead:", errorText);

        response = await fetch("/api/passwords/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: operation.userId,
            encryptedCipher, // Send encrypted data
            isUpdate: false, // Try as create operation
            entryId: null,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Update local entry as synced
      await this.markLocalEntrySynced(operation.data.id);

      // Invalidate cache
      const cacheKey = EncryptedCacheService.generateCacheKey(
        "passwords/load",
        operation.userId
      );
      await this.cacheService.invalidateCache(cacheKey);

      return true;
    } catch (error) {
      console.error("❌ Failed to sync update operation:", error);
      return false;
    }
  }

  private async syncDelete(operation: PendingOperation): Promise<boolean> {
    if (!operation.data?.id) return false;

    try {
      console.log("🗑️ Syncing delete operation:", {
        userId: operation.userId,
        entryId: operation.data.id,
      });

      const response = await fetch("/api/passwords/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: operation.userId,
          entryId: operation.data.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("⚠️ Delete API failed:", {
          status: response.status,
          error: errorText,
        });

        // If the entry doesn't exist in the database, that's actually success
        // (it means it was never synced, so deleting locally is sufficient)
        if (
          response.status === 404 ||
          errorText.includes("not found") ||
          errorText.includes("already deleted")
        ) {
          console.log(
            "✅ Entry not found or already deleted in database, considering delete successful"
          );
        } else {
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }
      } else {
        const result = await response.json();
        console.log(
          "✅ Delete API successful:",
          result.message || "Password deleted"
        );
      }

      // Remove from local storage
      await this.removeLocalEntry(operation.data.id);

      // Invalidate cache
      const cacheKey = EncryptedCacheService.generateCacheKey(
        "passwords/load",
        operation.userId
      );
      await this.cacheService.invalidateCache(cacheKey);

      return true;
    } catch (error) {
      console.error("❌ Failed to sync delete operation:", error);
      return false;
    }
  }

  // Utility methods
  private async markLocalEntrySynced(entryId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.LOCAL_STORE], "readwrite");
    const store = transaction.objectStore(this.LOCAL_STORE);

    const entry = await this.promisifyRequest(store.get(entryId));
    if (entry) {
      entry.syncStatus = "synced";
      await this.promisifyRequest(store.put(entry));
    }
  }

  private async removeLocalEntry(entryId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.LOCAL_STORE], "readwrite");
    const store = transaction.objectStore(this.LOCAL_STORE);
    await this.promisifyRequest(store.delete(entryId));
  }

  private async updateOperationStatus(
    operationId: string,
    status: PendingOperation["status"]
  ): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.PENDING_STORE], "readwrite");
    const store = transaction.objectStore(this.PENDING_STORE);

    const operation = await this.promisifyRequest(store.get(operationId));
    if (operation) {
      operation.status = status;
      await this.promisifyRequest(store.put(operation));
    }
  }

  private async removeOperation(operationId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.PENDING_STORE], "readwrite");
    const store = transaction.objectStore(this.PENDING_STORE);
    await this.promisifyRequest(store.delete(operationId));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get sync status for UI
  async getSyncStatus(userId: string): Promise<{
    pendingCount: number;
    failedCount: number;
    lastSyncTime: number;
  }> {
    if (!this.db) return { pendingCount: 0, failedCount: 0, lastSyncTime: 0 };

    try {
      const transaction = this.db.transaction([this.PENDING_STORE], "readonly");
      const store = transaction.objectStore(this.PENDING_STORE);
      const index = store.index("userId");

      const operations = await this.promisifyRequest(index.getAll(userId));

      const pendingCount = operations.filter(
        (op) => op.status === "pending"
      ).length;
      const failedCount = operations.filter(
        (op) => op.status === "failed"
      ).length;
      const lastSyncTime = Math.max(...operations.map((op) => op.timestamp), 0);

      return { pendingCount, failedCount, lastSyncTime };
    } catch (error) {
      console.error("❌ Failed to get sync status:", error);
      return { pendingCount: 0, failedCount: 0, lastSyncTime: 0 };
    }
  }

  // Force sync all pending operations
  async forceSyncAll(): Promise<void> {
    console.log("🚀 Force syncing all pending operations...");
    await this.processPendingOperations();
  }

  // Get user key for encryption (needs to be provided by the calling context)
  private async getUserKey(): Promise<UserKey | null> {
    try {
      // Try to get from stored function first
      if (this.userKeyGetter) {
        const userKeyBytes = this.userKeyGetter();
        if (userKeyBytes) {
          console.log("🔑 Got user key from stored getter");
          return { key: userKeyBytes };
        }
      }

      // Fallback to window context (if available)
      if (typeof window !== "undefined" && (window as any).getUserKey) {
        const userKeyBytes = (window as any).getUserKey();
        if (userKeyBytes) {
          console.log("🔑 Got user key from window context");
          return { key: userKeyBytes };
        }
      }

      // For now, return null if key is not available
      // The sync will be retried later when the key becomes available
      console.warn("⚠️ User key not available for background sync");
      return null;
    } catch (error) {
      console.error("❌ Failed to get user key:", error);
      return null;
    }
  }

  // Set user key getter function (called from the main app)
  setUserKeyGetter(getUserKeyFn: () => Uint8Array | null): void {
    console.log("🔑 Setting user key getter for optimistic service");
    this.userKeyGetter = getUserKeyFn;

    // Also set on window for backward compatibility
    if (typeof window !== "undefined") {
      (window as any).getUserKey = getUserKeyFn;
    }
  }

  // Clear all optimistic update data
  async clearAllData(): Promise<void> {
    if (!this.db) {
      console.warn(
        "⚠️ OptimisticUpdateService not initialized, skipping clear"
      );
      return;
    }

    try {
      const transaction = this.db.transaction(
        [this.PENDING_STORE, this.LOCAL_STORE],
        "readwrite"
      );
      const pendingStore = transaction.objectStore(this.PENDING_STORE);
      const localStore = transaction.objectStore(this.LOCAL_STORE);

      await Promise.all([
        this.promisifyRequest(pendingStore.clear()),
        this.promisifyRequest(localStore.clear()),
      ]);

      console.log("🗑️ All optimistic update data cleared");
    } catch (error) {
      console.error("❌ Failed to clear optimistic update data:", error);
      throw error;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}
