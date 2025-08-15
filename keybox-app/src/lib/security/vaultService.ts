// Vault service for encrypting/decrypting cipher data
// Implements secure storage and retrieval of password entries

import {
  VaultService,
  EncryptedCipher,
  EncryptedFolder,
  UserKey,
  EncryptedString,
} from "./types";
import { WebCryptoService } from "./cryptoService";
import { Folder, PasswordEntry } from "../../types/password";

export class KeyboxVaultService implements VaultService {
  private static instance: KeyboxVaultService;
  private cryptoService: WebCryptoService;

  public static getInstance(): KeyboxVaultService {
    if (!KeyboxVaultService.instance) {
      KeyboxVaultService.instance = new KeyboxVaultService();
    }
    return KeyboxVaultService.instance;
  }

  private constructor() {
    this.cryptoService = WebCryptoService.getInstance();
  }

  // Cipher operations
  async encryptCipher(
    cipher: PasswordEntry,
    userKey: UserKey
  ): Promise<EncryptedCipher> {
    // Encrypt sensitive fields using the default encryption type (XChaCha20-Poly1305)
    const encryptedName = await this.cryptoService.encrypt(
      cipher.title,
      userKey.key
      // Using default encryption type (XChaCha20-Poly1305)
    );

    // Prepare cipher data for encryption
    const cipherData = {
      username: cipher.username || "",
      password: cipher.password || "",
      website: cipher.website || "",
      customFields: cipher.customFields || [],
      tags: cipher.tags || [],
      passwordType: cipher.passwordType || "website", // Include password type
    };

    const encryptedData = await this.cryptoService.encrypt(
      JSON.stringify(cipherData),
      userKey.key
      // Using default encryption type (XChaCha20-Poly1305)
    );

    // Encrypt notes if present
    let encryptedNotes: EncryptedString | undefined;
    if (cipher.notes) {
      encryptedNotes = await this.cryptoService.encrypt(
        cipher.notes,
        userKey.key
        // Using default encryption type (XChaCha20-Poly1305)
      );
    }

    return {
      id: cipher.id,
      type: "password", // Could be extended for other types
      name: encryptedName,
      data: encryptedData,
      notes: encryptedNotes,
      favorite: cipher.isFavorite,
      reprompt: false, // Could be configurable
      folderId: cipher.folderId, // Include folder ID for persistence
      createdAt: cipher.createdAt,
      updatedAt: cipher.updatedAt,
    };
  }

  async decryptCipher(
    encryptedCipher: EncryptedCipher,
    userKey: UserKey
  ): Promise<PasswordEntry> {
    try {
      // Decrypt name
      const title = await this.cryptoService.decrypt(
        encryptedCipher.name,
        userKey.key
      );

      // Decrypt cipher data
      const dataJson = await this.cryptoService.decrypt(
        encryptedCipher.data,
        userKey.key
      );

      let cipherData;
      try {
        cipherData = JSON.parse(dataJson);
      } catch (parseError) {
        console.error(
          `Failed to parse cipher data for ${encryptedCipher.id}:`,
          parseError
        );
        throw new Error(
          `Invalid cipher data format for entry ${encryptedCipher.id}`
        );
      }

      // Decrypt notes if present
      let notes = "";
      if (encryptedCipher.notes) {
        try {
          notes = await this.cryptoService.decrypt(
            encryptedCipher.notes,
            userKey.key
          );
        } catch (notesError) {
          console.warn(
            `Failed to decrypt notes for ${encryptedCipher.id}:`,
            notesError
          );
          notes = ""; // Continue without notes if decryption fails
        }
      }

      return {
        id: encryptedCipher.id,
        title,
        folderId: encryptedCipher.folderId || "default", // Use actual folder ID
        username: cipherData.username || "",
        password: cipherData.password || "",
        website: cipherData.website || "",
        description: "", // Legacy field
        notes,
        customFields: cipherData.customFields || [],
        tags: cipherData.tags || [],
        createdAt: encryptedCipher.createdAt,
        updatedAt: encryptedCipher.updatedAt,
        isFavorite: encryptedCipher.favorite,
        passwordType: cipherData.passwordType || "website", // Restore password type
      };
    } catch (error) {
      console.error(`Failed to decrypt cipher ${encryptedCipher.id}:`, error);
      throw new Error(
        `Failed to decrypt password entry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Folder operations (for categories)
  async encryptFolder(
    folder: Folder,
    userKey: UserKey
  ): Promise<EncryptedFolder> {
    const encryptedName = await this.cryptoService.encrypt(
      folder.name,
      userKey.key
      // Using default encryption type (XChaCha20-Poly1305)
    );

    return {
      id: folder.id,
      name: encryptedName,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  async decryptFolder(
    encryptedFolder: EncryptedFolder,
    userKey: UserKey
  ): Promise<Folder> {
    const name = await this.cryptoService.decrypt(
      encryptedFolder.name,
      userKey.key
    );

    // Return a basic category structure
    // In a full implementation, you'd store more encrypted category data
    return {
      id: encryptedFolder.id,
      name,
      icon: "folder", // Default icon
      color: "#6366f1", // Default color
      description: "",
      createdAt: encryptedFolder.createdAt,
      updatedAt: encryptedFolder.updatedAt,
    };
  }

  // Bulk operations
  async encryptCiphers(
    ciphers: PasswordEntry[],
    userKey: UserKey
  ): Promise<EncryptedCipher[]> {
    const encryptedCiphers: EncryptedCipher[] = [];

    for (const cipher of ciphers) {
      try {
        const encrypted = await this.encryptCipher(cipher, userKey);
        encryptedCiphers.push(encrypted);
      } catch (error) {
        console.error(`Failed to encrypt cipher ${cipher.id}:`, error);
        // In production, you might want to handle this differently
        throw new Error(`Failed to encrypt cipher: ${cipher.title}`);
      }
    }

    return encryptedCiphers;
  }

  async decryptCiphers(
    encryptedCiphers: EncryptedCipher[],
    userKey: UserKey
  ): Promise<PasswordEntry[]> {
    const decryptedCiphers: PasswordEntry[] = [];

    for (const encryptedCipher of encryptedCiphers) {
      try {
        const decrypted = await this.decryptCipher(encryptedCipher, userKey);
        decryptedCiphers.push(decrypted);
      } catch (error) {
        console.error(`Failed to decrypt cipher ${encryptedCipher.id}:`, error);
        // In production, you might want to handle this differently
        throw new Error(`Failed to decrypt cipher: ${encryptedCipher.id}`);
      }
    }

    return decryptedCiphers;
  }

  // Advanced encryption operations
  async encryptWithIndividualKey(
    data: string,
    userKey: UserKey,
    generateNewKey: boolean = false
  ): Promise<{
    encryptedData: EncryptedString;
    encryptedKey?: EncryptedString;
  }> {
    if (generateNewKey) {
      // Generate a new key for this specific data
      const individualKey = this.cryptoService.generateKey();

      // Encrypt the data with the individual key
      const encryptedData = await this.cryptoService.encrypt(
        data,
        individualKey
        // Using default encryption type (XChaCha20-Poly1305)
      );

      // Encrypt the individual key with the user key
      const encryptedKey = await this.cryptoService.encryptKey(
        individualKey,
        userKey.key
      );

      // Clean up the individual key from memory
      this.cryptoService.secureZero(individualKey);

      return { encryptedData, encryptedKey };
    } else {
      // Use the user key directly
      const encryptedData = await this.cryptoService.encrypt(
        data,
        userKey.key
        // Using default encryption type (XChaCha20-Poly1305)
      );

      return { encryptedData };
    }
  }

  async decryptWithIndividualKey(
    encryptedData: EncryptedString,
    encryptedKey: EncryptedString,
    userKey: UserKey
  ): Promise<string> {
    // Decrypt the individual key
    const individualKey = await this.cryptoService.decryptKey(
      encryptedKey,
      userKey.key
    );

    try {
      // Decrypt the data with the individual key
      const decryptedData = await this.cryptoService.decrypt(
        encryptedData,
        individualKey
      );
      return decryptedData;
    } finally {
      // Clean up the individual key from memory
      this.cryptoService.secureZero(individualKey);
    }
  }

  // Utility methods for data validation
  validateEncryptedCipher(encryptedCipher: EncryptedCipher): boolean {
    return !!(
      encryptedCipher.id &&
      encryptedCipher.name &&
      encryptedCipher.data &&
      encryptedCipher.createdAt &&
      encryptedCipher.updatedAt
    );
  }

  validatePasswordEntry(entry: PasswordEntry): boolean {
    return !!(entry.id && entry.title && entry.createdAt && entry.updatedAt);
  }

  // Search in encrypted data (limited functionality)
  async searchEncryptedCiphers(
    encryptedCiphers: EncryptedCipher[],
    searchTerm: string,
    userKey: UserKey,
    maxResults: number = 50
  ): Promise<PasswordEntry[]> {
    const results: PasswordEntry[] = [];
    let count = 0;

    for (const encryptedCipher of encryptedCiphers) {
      if (count >= maxResults) break;

      try {
        const decrypted = await this.decryptCipher(encryptedCipher, userKey);

        // Simple search in decrypted data
        const searchLower = searchTerm.toLowerCase();
        if (
          decrypted.title.toLowerCase().includes(searchLower) ||
          decrypted.username?.toLowerCase().includes(searchLower) ||
          decrypted.website?.toLowerCase().includes(searchLower) ||
          decrypted.notes.toLowerCase().includes(searchLower)
        ) {
          results.push(decrypted);
          count++;
        }
      } catch (error) {
        console.error(
          `Failed to decrypt cipher for search: ${encryptedCipher.id}`,
          error
        );
        // Continue with other ciphers
      }
    }

    return results;
  }

  // Export/Import helpers
  async exportEncryptedVault(
    encryptedCiphers: EncryptedCipher[],
    encryptedFolders: EncryptedFolder[]
  ): Promise<string> {
    const vaultData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      ciphers: encryptedCiphers,
      folders: encryptedFolders,
    };

    return JSON.stringify(vaultData, null, 2);
  }

  async importEncryptedVault(vaultJson: string): Promise<{
    ciphers: EncryptedCipher[];
    folders: EncryptedFolder[];
  }> {
    const vaultData = JSON.parse(vaultJson);

    if (vaultData.version !== "1.0") {
      throw new Error(`Unsupported vault export version: ${vaultData.version}`);
    }

    // Validate imported data
    const ciphers = vaultData.ciphers || [];
    const folders = vaultData.folders || [];

    for (const cipher of ciphers) {
      if (!this.validateEncryptedCipher(cipher)) {
        throw new Error(`Invalid encrypted cipher data: ${cipher.id}`);
      }
    }

    return { ciphers, folders };
  }

  // Add missing method for encrypting folders
  async encryptFolders(folders: any[], userKey: UserKey): Promise<any[]> {
    const encryptedFolders: any[] = [];

    for (const folder of folders) {
      const encryptedFolder = await this.encryptFolder(folder, userKey);
      encryptedFolders.push(encryptedFolder);
    }

    return encryptedFolders;
  }

  // String operations
  async encryptString(
    plaintext: string,
    userKey: UserKey
  ): Promise<EncryptedString> {
    return await this.cryptoService.encrypt(
      plaintext,
      userKey.key
      // Using default encryption type (XChaCha20-Poly1305)
    );
  }

  async decryptString(
    encryptedString: EncryptedString,
    userKey: UserKey
  ): Promise<string> {
    return await this.cryptoService.decrypt(encryptedString, userKey.key);
  }
}
