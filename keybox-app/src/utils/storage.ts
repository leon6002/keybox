import {
  PasswordEntry,
  PasswordDatabase,
  ImportOptions,
  ExportOptions,
  Category,
} from "@/types/password";
import { EncryptionUtil } from "./encryption";
import { CategoryManager } from "./categories";

const STORAGE_KEY = "keybox_passwords";
const CURRENT_VERSION = "1.0.0";

// 本地存储管理类
export class StorageManager {
  // 保存密码数据到 localStorage
  static saveToLocalStorage(
    entries: PasswordEntry[],
    categories: Category[] = []
  ): void {
    try {
      const database: PasswordDatabase = {
        version: CURRENT_VERSION,
        entries,
        categories,
        exportedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
      throw new Error("保存数据失败");
    }
  }

  // 从 localStorage 加载密码数据
  static loadFromLocalStorage(): {
    entries: PasswordEntry[];
    categories: Category[];
  } {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // 如果没有数据，返回默认类目
        return {
          entries: [],
          categories: CategoryManager.getDefaultCategories(),
        };
      }

      const database: PasswordDatabase = JSON.parse(data);

      // 确保所有条目都有必要的属性
      const entries = (database.entries || []).map((entry, index) => ({
        ...entry,
        id: entry.id || `entry-${Date.now()}-${index}`, // 确保有唯一 ID
        title: entry.title || "",
        categoryId: entry.categoryId || "",
        customFields: entry.customFields || [],
        tags: entry.tags || [],
        isFavorite: entry.isFavorite || false,
        username: entry.username || "",
        password: entry.password || "",
        website: entry.website || "",
        description: entry.description || "",
        notes: entry.notes || "",
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: entry.updatedAt || new Date().toISOString(),
      }));

      return {
        entries,
        categories:
          database.categories || CategoryManager.getDefaultCategories(),
      };
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return {
        entries: [],
        categories: CategoryManager.getDefaultCategories(),
      };
    }
  }

  // 导出数据到 JSON 文件
  static async exportToFile(
    entries: PasswordEntry[],
    categories: Category[] = [],
    options: ExportOptions = { includePasswords: true, format: "json" }
  ): Promise<void> {
    try {
      let dataToExport = entries;

      // 如果选择了特定条目
      if (options.selectedEntries && options.selectedEntries.length > 0) {
        dataToExport = entries.filter((entry) =>
          options.selectedEntries!.includes(entry.id)
        );
      }

      // 如果不包含密码，则移除密码字段
      if (!options.includePasswords) {
        dataToExport = dataToExport.map((entry) => ({
          ...entry,
          password: "",
          customFields: entry.customFields.map((field) => ({
            ...field,
            value: field.type === "password" ? "" : field.value,
          })),
        }));
      }

      const database: PasswordDatabase = {
        version: CURRENT_VERSION,
        entries: dataToExport,
        categories,
        exportedAt: new Date().toISOString(),
      };

      let dataStr = JSON.stringify(database, null, 2);
      let fileName = `keybox-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      let mimeType = "application/json";

      // 如果需要加密
      if (options.encrypt && options.password) {
        if (!EncryptionUtil.isWebCryptoSupported()) {
          throw new Error("当前浏览器不支持加密功能");
        }

        const encryptedData = await EncryptionUtil.encryptData(
          dataStr,
          options.password
        );
        const metadata = EncryptionUtil.createEncryptedFileMetadata();

        const encryptedFile = {
          metadata,
          data: encryptedData,
          hash: await EncryptionUtil.generateFileHash(dataStr),
        };

        dataStr = JSON.stringify(encryptedFile, null, 2);
        fileName = `keybox-export-${
          new Date().toISOString().split("T")[0]
        }.kbx`;
        mimeType = "application/octet-stream";
      }

      const dataBlob = new Blob([dataStr], { type: mimeType });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Failed to export data:", error);
      throw new Error(
        "导出数据失败: " + (error instanceof Error ? error.message : "未知错误")
      );
    }
  }

  // 从文件导入数据
  static async importFromFile(
    file: File,
    options: ImportOptions = { mergeStrategy: "merge", validateData: true },
    password?: string
  ): Promise<PasswordEntry[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          let database: PasswordDatabase;

          // 检查是否是加密文件
          if (file.name.endsWith(".kbx")) {
            if (!password) {
              reject(new Error("加密文件需要提供密码"));
              return;
            }

            if (!EncryptionUtil.isWebCryptoSupported()) {
              reject(new Error("当前浏览器不支持解密功能"));
              return;
            }

            try {
              const encryptedFile = JSON.parse(content);

              // 验证加密文件格式
              if (
                !encryptedFile.metadata ||
                !encryptedFile.data ||
                !encryptedFile.hash
              ) {
                throw new Error("加密文件格式不正确");
              }

              // 解密数据
              const decryptedData = await EncryptionUtil.decryptData(
                encryptedFile.data,
                password
              );

              // 验证文件完整性
              const isValid = await EncryptionUtil.verifyFileIntegrity(
                decryptedData,
                encryptedFile.hash
              );
              if (!isValid) {
                throw new Error("文件完整性验证失败，文件可能已损坏");
              }

              database = JSON.parse(decryptedData);
            } catch (error) {
              console.error("Failed to decrypt file:", error);
              reject(
                new Error(error instanceof Error ? error.message : "解密失败")
              );
              return;
            }
          } else {
            // 普通 JSON 文件
            database = JSON.parse(content);
          }

          // 验证数据格式
          if (options.validateData && !this.validateImportData(database)) {
            throw new Error("导入文件格式不正确");
          }

          const importedEntries = database.entries || [];

          // 为导入的条目生成新的 ID 和时间戳
          const processedEntries = importedEntries.map((entry) => ({
            ...entry,
            id: this.generateId(),
            updatedAt: new Date().toISOString(),
            // 如果没有创建时间，使用当前时间
            createdAt: entry.createdAt || new Date().toISOString(),
          }));

          resolve(processedEntries);
        } catch (error) {
          console.error("Failed to import data:", error);
          reject(
            new Error(
              "导入数据失败：" +
                (error instanceof Error ? error.message : "文件格式不正确")
            )
          );
        }
      };

      reader.onerror = () => {
        reject(new Error("读取文件失败"));
      };

      reader.readAsText(file);
    });
  }

  // 验证导入数据格式
  private static validateImportData(database: unknown): boolean {
    if (!database || typeof database !== "object") return false;
    const db = database as Record<string, unknown>;
    if (!Array.isArray(db.entries)) return false;

    // 验证每个条目的基本字段
    return db.entries.every((entry: unknown) => {
      if (!entry || typeof entry !== "object") return false;
      const entryObj = entry as Record<string, unknown>;
      return (
        typeof entryObj.title === "string" &&
        typeof entryObj.username === "string" &&
        typeof entryObj.password === "string" &&
        typeof entryObj.website === "string" &&
        Array.isArray(entryObj.customFields)
      );
    });
  }

  // 生成唯一 ID
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // 清空所有数据
  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // 获取存储使用情况
  static getStorageInfo(): { used: number; total: number; percentage: number } {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const used = data ? new Blob([data]).size : 0;
      const total = 5 * 1024 * 1024; // 假设 localStorage 限制为 5MB

      return {
        used,
        total,
        percentage: (used / total) * 100,
      };
    } catch {
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}

// 文件拖拽处理工具
export class FileDropHandler {
  static setupDropZone(
    element: HTMLElement,
    onFileDrop: (files: FileList) => void
  ): () => void {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.add("drag-over");
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove("drag-over");
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove("drag-over");

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        onFileDrop(files);
      }
    };

    element.addEventListener("dragover", handleDragOver);
    element.addEventListener("dragleave", handleDragLeave);
    element.addEventListener("drop", handleDrop);

    // 返回清理函数
    return () => {
      element.removeEventListener("dragover", handleDragOver);
      element.removeEventListener("dragleave", handleDragLeave);
      element.removeEventListener("drop", handleDrop);
    };
  }
}
