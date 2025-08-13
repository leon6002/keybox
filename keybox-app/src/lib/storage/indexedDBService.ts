// IndexedDB service for optimized password storage
// Provides efficient storage and retrieval for large password datasets

import { PasswordEntry, Folder, Category } from "@/types/password";

export interface IndexedDBConfig {
  dbName: string;
  version: number;
  stores: {
    passwords: string;
    folders: string;
    metadata: string;
    searchIndex: string;
  };
}

export interface StorageMetadata {
  version: string;
  lastUpdated: string;
  totalEntries: number;
  totalFolders: number;
}

export interface SearchIndexEntry {
  id: string;
  title: string;
  username: string;
  website: string;
  tags: string[];
  folderId: string;
  searchText: string; // Combined searchable text
  lastModified: number;
}

export class IndexedDBStorageService {
  private static instance: IndexedDBStorageService;
  private db: IDBDatabase | null = null;
  private config: IndexedDBConfig;

  private constructor() {
    this.config = {
      dbName: "KeyboxPasswordDB",
      version: 1,
      stores: {
        passwords: "passwords",
        folders: "folders", 
        metadata: "metadata",
        searchIndex: "searchIndex",
      },
    };
  }

  public static getInstance(): IndexedDBStorageService {
    if (!IndexedDBStorageService.instance) {
      IndexedDBStorageService.instance = new IndexedDBStorageService();
    }
    return IndexedDBStorageService.instance;
  }

  // Initialize IndexedDB
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        console.error("❌ Failed to open IndexedDB:", request.error);
        reject(new Error("Failed to initialize IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ IndexedDB initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log("🔄 Upgrading IndexedDB schema...");

        // Create passwords store
        if (!db.objectStoreNames.contains(this.config.stores.passwords)) {
          const passwordStore = db.createObjectStore(this.config.stores.passwords, {
            keyPath: "id",
          });
          passwordStore.createIndex("folderId", "folderId", { unique: false });
          passwordStore.createIndex("title", "title", { unique: false });
          passwordStore.createIndex("createdAt", "createdAt", { unique: false });
          passwordStore.createIndex("updatedAt", "updatedAt", { unique: false });
          passwordStore.createIndex("isFavorite", "isFavorite", { unique: false });
        }

        // Create folders store
        if (!db.objectStoreNames.contains(this.config.stores.folders)) {
          const folderStore = db.createObjectStore(this.config.stores.folders, {
            keyPath: "id",
          });
          folderStore.createIndex("name", "name", { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(this.config.stores.metadata)) {
          db.createObjectStore(this.config.stores.metadata, {
            keyPath: "key",
          });
        }

        // Create search index store
        if (!db.objectStoreNames.contains(this.config.stores.searchIndex)) {
          const searchStore = db.createObjectStore(this.config.stores.searchIndex, {
            keyPath: "id",
          });
          searchStore.createIndex("searchText", "searchText", { unique: false });
          searchStore.createIndex("folderId", "folderId", { unique: false });
          searchStore.createIndex("lastModified", "lastModified", { unique: false });
        }
      };
    });
  }

  // Password operations
  async savePassword(entry: PasswordEntry): Promise<void> {
    if (!this.db) throw new Error("IndexedDB not initialized");

    const transaction = this.db.transaction([
      this.config.stores.passwords,
      this.config.stores.searchIndex,
      this.config.stores.metadata,
    ], "readwrite");

    try {
      // Save password entry
      const passwordStore = transaction.objectStore(this.config.stores.passwords);
      await this.promisifyRequest(passwordStore.put(entry));

      // Update search index
      const searchEntry: SearchIndexEntry = {
        id: entry.id,
        title: entry.title,
        username: entry.username || "",
        website: entry.website || "",
        tags: entry.tags,
        folderId: entry.folderId,
        searchText: this.createSearchText(entry),
        lastModified: Date.now(),
      };
      
      const searchStore = transaction.objectStore(this.config.stores.searchIndex);
      await this.promisifyRequest(searchStore.put(searchEntry));

      // Update metadata
      await this.updateMetadata();

      console.log("✅ Password saved to IndexedDB:", entry.id);
    } catch (error) {
      console.error("❌ Failed to save password to IndexedDB:", error);
      throw error;
    }
  }

  async getPassword(id: string): Promise<PasswordEntry | null> {
    if (!this.db) throw new Error("IndexedDB not initialized");

    const transaction = this.db.transaction([this.config.stores.passwords], "readonly");
    const store = transaction.objectStore(this.config.stores.passwords);
    
    try {
      const result = await this.promisifyRequest(store.get(id));
      return result || null;
    } catch (error) {
      console.error("❌ Failed to get password from IndexedDB:", error);
      return null;
    }
  }

  async getAllPasswords(options?: {
    limit?: number;
    offset?: number;
    sortBy?: "title" | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
    folderId?: string;
  }): Promise<PasswordEntry[]> {
    if (!this.db) throw new Error("IndexedDB not initialized");

    const transaction = this.db.transaction([this.config.stores.passwords], "readonly");
    const store = transaction.objectStore(this.config.stores.passwords);

    try {
      let cursor: IDBRequest<IDBCursorWithValue | null>;
      
      if (options?.folderId) {
        const index = store.index("folderId");
        cursor = index.openCursor(IDBKeyRange.only(options.folderId));
      } else if (options?.sortBy) {
        const index = store.index(options.sortBy);
        const direction = options.sortOrder === "desc" ? "prev" : "next";
        cursor = index.openCursor(null, direction);
      } else {
        cursor = store.openCursor();
      }

      const results: PasswordEntry[] = [];
      let count = 0;
      const limit = options?.limit || Infinity;
      const offset = options?.offset || 0;

      return new Promise((resolve, reject) => {
        cursor.onsuccess = () => {
          const cursorResult = cursor.result;
          if (cursorResult && count < limit + offset) {
            if (count >= offset) {
              results.push(cursorResult.value);
            }
            count++;
            cursorResult.continue();
          } else {
            resolve(results);
          }
        };

        cursor.onerror = () => {
          reject(new Error("Failed to retrieve passwords"));
        };
      });
    } catch (error) {
      console.error("❌ Failed to get passwords from IndexedDB:", error);
      return [];
    }
  }

  async deletePassword(id: string): Promise<void> {
    if (!this.db) throw new Error("IndexedDB not initialized");

    const transaction = this.db.transaction([
      this.config.stores.passwords,
      this.config.stores.searchIndex,
      this.config.stores.metadata,
    ], "readwrite");

    try {
      // Delete password
      const passwordStore = transaction.objectStore(this.config.stores.passwords);
      await this.promisifyRequest(passwordStore.delete(id));

      // Delete from search index
      const searchStore = transaction.objectStore(this.config.stores.searchIndex);
      await this.promisifyRequest(searchStore.delete(id));

      // Update metadata
      await this.updateMetadata();

      console.log("✅ Password deleted from IndexedDB:", id);
    } catch (error) {
      console.error("❌ Failed to delete password from IndexedDB:", error);
      throw error;
    }
  }

  // Search operations
  async searchPasswords(query: string, options?: {
    limit?: number;
    folderId?: string;
  }): Promise<PasswordEntry[]> {
    if (!this.db || !query.trim()) return [];

    const transaction = this.db.transaction([
      this.config.stores.searchIndex,
      this.config.stores.passwords,
    ], "readonly");

    try {
      const searchStore = transaction.objectStore(this.config.stores.searchIndex);
      const passwordStore = transaction.objectStore(this.config.stores.passwords);
      
      const searchResults: SearchIndexEntry[] = [];
      const cursor = searchStore.openCursor();

      // Get matching search entries
      await new Promise<void>((resolve, reject) => {
        cursor.onsuccess = () => {
          const cursorResult = cursor.result;
          if (cursorResult) {
            const entry = cursorResult.value as SearchIndexEntry;
            const searchText = entry.searchText.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (searchText.includes(queryLower)) {
              if (!options?.folderId || entry.folderId === options.folderId) {
                searchResults.push(entry);
              }
            }
            cursorResult.continue();
          } else {
            resolve();
          }
        };
        cursor.onerror = () => reject(cursor.error);
      });

      // Get full password entries
      const passwords: PasswordEntry[] = [];
      const limit = options?.limit || 50;
      
      for (let i = 0; i < Math.min(searchResults.length, limit); i++) {
        const searchEntry = searchResults[i];
        const passwordRequest = passwordStore.get(searchEntry.id);
        const password = await this.promisifyRequest(passwordRequest);
        if (password) {
          passwords.push(password);
        }
      }

      return passwords;
    } catch (error) {
      console.error("❌ Failed to search passwords in IndexedDB:", error);
      return [];
    }
  }

  // Folder operations
  async saveFolder(folder: Folder): Promise<void> {
    if (!this.db) throw new Error("IndexedDB not initialized");

    const transaction = this.db.transaction([this.config.stores.folders], "readwrite");
    const store = transaction.objectStore(this.config.stores.folders);
    
    try {
      await this.promisifyRequest(store.put(folder));
      console.log("✅ Folder saved to IndexedDB:", folder.id);
    } catch (error) {
      console.error("❌ Failed to save folder to IndexedDB:", error);
      throw error;
    }
  }

  async getAllFolders(): Promise<Folder[]> {
    if (!this.db) throw new Error("IndexedDB not initialized");

    const transaction = this.db.transaction([this.config.stores.folders], "readonly");
    const store = transaction.objectStore(this.config.stores.folders);
    
    try {
      const result = await this.promisifyRequest(store.getAll());
      return result || [];
    } catch (error) {
      console.error("❌ Failed to get folders from IndexedDB:", error);
      return [];
    }
  }

  // Utility methods
  private createSearchText(entry: PasswordEntry): string {
    const searchableFields = [
      entry.title,
      entry.username || "",
      entry.website || "",
      entry.description || "",
      entry.notes || "",
      ...entry.tags,
      ...entry.customFields.map(f => `${f.name} ${f.value}`),
    ];
    
    return searchableFields.join(" ").toLowerCase();
  }

  private async updateMetadata(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([
      this.config.stores.passwords,
      this.config.stores.folders,
      this.config.stores.metadata,
    ], "readwrite");

    try {
      const passwordStore = transaction.objectStore(this.config.stores.passwords);
      const folderStore = transaction.objectStore(this.config.stores.folders);
      const metadataStore = transaction.objectStore(this.config.stores.metadata);

      const passwordCount = await this.promisifyRequest(passwordStore.count());
      const folderCount = await this.promisifyRequest(folderStore.count());

      const metadata: StorageMetadata = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        totalEntries: passwordCount,
        totalFolders: folderCount,
      };

      await this.promisifyRequest(metadataStore.put({ key: "main", ...metadata }));
    } catch (error) {
      console.error("❌ Failed to update metadata:", error);
    }
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup and maintenance
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error("IndexedDB not initialized");

    const transaction = this.db.transaction([
      this.config.stores.passwords,
      this.config.stores.folders,
      this.config.stores.metadata,
      this.config.stores.searchIndex,
    ], "readwrite");

    try {
      await Promise.all([
        this.promisifyRequest(transaction.objectStore(this.config.stores.passwords).clear()),
        this.promisifyRequest(transaction.objectStore(this.config.stores.folders).clear()),
        this.promisifyRequest(transaction.objectStore(this.config.stores.metadata).clear()),
        this.promisifyRequest(transaction.objectStore(this.config.stores.searchIndex).clear()),
      ]);

      console.log("✅ All IndexedDB data cleared");
    } catch (error) {
      console.error("❌ Failed to clear IndexedDB data:", error);
      throw error;
    }
  }

  async getStorageInfo(): Promise<{
    totalEntries: number;
    totalFolders: number;
    dbSize: number;
    lastUpdated: string;
  }> {
    if (!this.db) throw new Error("IndexedDB not initialized");

    try {
      const transaction = this.db.transaction([this.config.stores.metadata], "readonly");
      const store = transaction.objectStore(this.config.stores.metadata);
      const metadata = await this.promisifyRequest(store.get("main"));

      // Estimate database size (rough calculation)
      const estimate = await navigator.storage?.estimate?.();
      const dbSize = estimate?.usage || 0;

      return {
        totalEntries: metadata?.totalEntries || 0,
        totalFolders: metadata?.totalFolders || 0,
        dbSize,
        lastUpdated: metadata?.lastUpdated || new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Failed to get storage info:", error);
      return {
        totalEntries: 0,
        totalFolders: 0,
        dbSize: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }
}
