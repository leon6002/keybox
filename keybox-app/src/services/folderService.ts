import { Folder } from "@/types/password";
import { SecurityServiceFactory } from "@/lib/security";
import { CategoryManager } from "@/utils/folders";

export class FolderService {
  /**
   * Load encrypted folders from database and decrypt them
   */
  static async loadEncryptedFolders(
    userId: string,
    userKey: Uint8Array
  ): Promise<Folder[]> {
    try {
      console.log("📥 Loading encrypted folders from database...");

      // Load encrypted folders from database
      const response = await fetch("/api/folders/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load folders");
      }

      const { folders: encryptedFolders } = await response.json();
      console.log(`📥 Loaded ${encryptedFolders.length} encrypted folders`);

      if (encryptedFolders.length === 0) {
        console.log("📁 No custom folders found, returning common folders");
        return this.getCommonFolders();
      }

      // Decrypt folders
      const vaultService = SecurityServiceFactory.getVaultService();
      const userKeyObj = { key: userKey };
      const decryptedFolders: Folder[] = [];

      for (const encryptedFolder of encryptedFolders) {
        try {
          // Parse the encrypted name
          const encryptedName = JSON.parse(encryptedFolder.name);

          // Decrypt the folder name
          const decryptedName = await vaultService.decryptString(
            encryptedName,
            userKeyObj
          );

          // Create decrypted folder object
          const folder: Folder = {
            id: encryptedFolder.id,
            name: decryptedName,
            icon: this.getDefaultIcon(decryptedName),
            color: this.getDefaultColor(decryptedName),
            description: `Custom folder: ${decryptedName}`,
            fields: CategoryManager.getDefaultCategories()[0]?.fields || [],
            createdAt: encryptedFolder.created_at,
            updatedAt: encryptedFolder.updated_at,
          };

          decryptedFolders.push(folder);
        } catch (error) {
          console.error(
            `❌ Failed to decrypt folder ${encryptedFolder.id}:`,
            error
          );
          // Skip this folder and continue
        }
      }

      console.log(
        `✅ Decrypted ${decryptedFolders.length} folders successfully`
      );

      // If no folders were successfully decrypted, return common folders
      if (decryptedFolders.length === 0) {
        console.log(
          "📁 No folders decrypted successfully, returning common folders"
        );
        return this.getCommonFolders();
      }

      // Return common folders (with fixed UUIDs) + user's custom folders
      const commonFolders = this.getCommonFolders();
      const allFolders = [...commonFolders, ...decryptedFolders];

      return allFolders;
    } catch (error) {
      console.error("❌ Failed to load encrypted folders:", error);
      // Fallback to common folders
      return this.getCommonFolders();
    }
  }

  /**
   * Get common folders with fixed UUIDs (shared across all users)
   */
  static getCommonFolders(): Folder[] {
    return [
      {
        id: CategoryManager.COMMON_FOLDER_IDS.WORK,
        name: "Work",
        icon: "💼",
        color: "#3B82F6",
        description: "Work-related passwords and accounts",
        fields: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: CategoryManager.COMMON_FOLDER_IDS.PERSONAL,
        name: "Personal",
        icon: "🏠",
        color: "#10B981",
        description: "Personal accounts and information",
        fields: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: CategoryManager.COMMON_FOLDER_IDS.SOCIAL,
        name: "Social",
        icon: "👥",
        color: "#8B5CF6",
        description: "Social media and communication",
        fields: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: CategoryManager.COMMON_FOLDER_IDS.FINANCE,
        name: "Finance",
        icon: "💰",
        color: "#F59E0B",
        description: "Banking and financial accounts",
        fields: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: CategoryManager.COMMON_FOLDER_IDS.SHOPPING,
        name: "Shopping",
        icon: "🛒",
        color: "#EF4444",
        description: "E-commerce and shopping accounts",
        fields: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: CategoryManager.COMMON_FOLDER_IDS.ENTERTAINMENT,
        name: "Entertainment",
        icon: "🎬",
        color: "#EC4899",
        description: "Streaming and entertainment services",
        fields: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];
  }

  /**
   * Create default folders in database when none exist
   */
  static async createDefaultFoldersInDatabase(
    userId: string,
    userKey: Uint8Array
  ): Promise<Folder[]> {
    try {
      console.log("🏗️ Creating default folders in database...");

      const vaultService = SecurityServiceFactory.getVaultService();
      const userKeyObj = { key: userKey };
      const createdFolders: Folder[] = [];

      // Define default folders to create
      const defaultFolders = [
        {
          name: "Work",
          icon: "💼",
          color: "#3B82F6",
          description: "Work-related passwords",
        },
        {
          name: "Personal",
          icon: "🏠",
          color: "#10B981",
          description: "Personal accounts",
        },
        {
          name: "Social",
          icon: "👥",
          color: "#8B5CF6",
          description: "Social media accounts",
        },
        {
          name: "Finance",
          icon: "💰",
          color: "#F59E0B",
          description: "Banking and finance",
        },
      ];

      for (const folderData of defaultFolders) {
        try {
          // Create folder object
          const folder: Folder = {
            id: "", // Will be set by database
            name: folderData.name,
            icon: folderData.icon,
            color: folderData.color,
            description: folderData.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Save folder to database (this will encrypt and store it)
          const savedFolder = await this.saveEncryptedFolder(
            userId,
            folder,
            userKey
          );
          createdFolders.push(savedFolder);

          console.log(`✅ Created default folder: ${folderData.name}`);
        } catch (error) {
          console.error(
            `❌ Failed to create default folder ${folderData.name}:`,
            error
          );
        }
      }

      console.log(`🎉 Created ${createdFolders.length} default folders`);
      return createdFolders;
    } catch (error) {
      console.error("❌ Failed to create default folders:", error);
      // Fallback to in-memory default folders if database creation fails
      return CategoryManager.getDefaultFolders();
    }
  }

  /**
   * Save encrypted folder to database
   */
  static async saveEncryptedFolder(
    userId: string,
    folder: Omit<Folder, "id" | "createdAt" | "updatedAt">,
    userKey: Uint8Array,
    folderId?: string
  ): Promise<Folder> {
    try {
      console.log("💾 Saving encrypted folder to database...");

      const vaultService = SecurityServiceFactory.getVaultService();
      const userKeyObj = { key: userKey };

      // Encrypt the folder name
      const encryptedName = await vaultService.encryptString(
        folder.name,
        userKeyObj
      );

      // Create encrypted folder object
      const encryptedFolder = {
        name: encryptedName,
      };

      // Save to database
      const response = await fetch("/api/folders/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          encryptedFolder,
          isUpdate: !!folderId,
          folderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save folder");
      }

      const { folder: savedFolder } = await response.json();
      console.log("✅ Folder saved to encrypted database:", savedFolder.id);

      // Return the decrypted folder object
      return {
        id: savedFolder.id,
        name: folder.name,
        icon: folder.icon,
        color: folder.color,
        description: folder.description,
        fields: folder.fields,
        createdAt: savedFolder.created_at,
        updatedAt: savedFolder.updated_at,
      };
    } catch (error) {
      console.error("❌ Failed to save encrypted folder:", error);
      throw error;
    }
  }

  /**
   * Delete encrypted folder from database
   */
  static async deleteEncryptedFolder(
    userId: string,
    folderId: string
  ): Promise<void> {
    try {
      console.log("🗑️ Deleting encrypted folder from database:", folderId);

      const response = await fetch("/api/folders/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          folderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete folder");
      }

      console.log("✅ Folder deleted from encrypted database");
    } catch (error) {
      console.error("❌ Failed to delete encrypted folder:", error);
      throw error;
    }
  }

  /**
   * Get default icon for folder name
   */
  private static getDefaultIcon(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("work") || lowerName.includes("job")) return "💼";
    if (lowerName.includes("personal") || lowerName.includes("private"))
      return "👤";
    if (lowerName.includes("bank") || lowerName.includes("finance"))
      return "🏦";
    if (lowerName.includes("social") || lowerName.includes("media"))
      return "📱";
    if (lowerName.includes("shop") || lowerName.includes("store")) return "🛒";
    if (lowerName.includes("email") || lowerName.includes("mail")) return "📧";
    if (lowerName.includes("game") || lowerName.includes("entertainment"))
      return "🎮";
    return "📁"; // Default folder icon
  }

  /**
   * Get default color for folder name
   */
  private static getDefaultColor(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("work") || lowerName.includes("job"))
      return "#3B82F6"; // Blue
    if (lowerName.includes("personal") || lowerName.includes("private"))
      return "#10B981"; // Green
    if (lowerName.includes("bank") || lowerName.includes("finance"))
      return "#F59E0B"; // Amber
    if (lowerName.includes("social") || lowerName.includes("media"))
      return "#8B5CF6"; // Purple
    if (lowerName.includes("shop") || lowerName.includes("store"))
      return "#EF4444"; // Red
    if (lowerName.includes("email") || lowerName.includes("mail"))
      return "#06B6D4"; // Cyan
    if (lowerName.includes("game") || lowerName.includes("entertainment"))
      return "#F97316"; // Orange
    return "#6B7280"; // Default gray
  }
}
