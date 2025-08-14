import CryptoJS from "crypto-js";
import { PasswordEntry, Category, Folder } from "@/types/password";
import { SupabaseBackupService } from "@/lib/supabase";
import {
  SecurityServiceFactory,
  KdfType,
  SECURITY_CONSTANTS,
  EncryptedString,
  UserKey,
} from "@/lib/security";

export interface BackupRecord {
  id: string;
  userId: string;
  filename: string;
  filePath: string;
  backupType: "auto" | "manual";
  versionName?: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface KBXFileData {
  version: string;
  createdAt: string;
  entries: PasswordEntry[];
  categories: Category[];
  metadata: {
    totalEntries: number;
    totalCategories: number;
    backupType: "auto" | "manual";
    versionName?: string;
  };
}

export class BackupService {
  private static readonly ENCRYPTION_KEY_PREFIX = "keybox_backup_key_";
  private static readonly AUTO_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static autoBackupTimer: NodeJS.Timeout | null = null;

  // 获取用户的预设加密密码
  static getUserBackupKey(userId: string): string {
    const storageKey = `${this.ENCRYPTION_KEY_PREFIX}${userId}`;
    let backupKey = localStorage.getItem(storageKey);

    if (!backupKey) {
      // 生成新的备份密钥
      backupKey = this.generateBackupKey();
      localStorage.setItem(storageKey, backupKey);
    }

    return backupKey;
  }

  // 生成备份密钥
  private static generateBackupKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  // 加密数据
  static encryptData(data: string, password: string): string {
    return CryptoJS.AES.encrypt(data, password).toString();
  }

  // 解密数据
  static decryptData(encryptedData: string, password: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // 创建 KBX 文件数据
  static createKBXData(
    entries: PasswordEntry[],
    categories: Category[],
    backupType: "auto" | "manual",
    versionName?: string
  ): KBXFileData {
    return {
      version: "1.0",
      createdAt: new Date().toISOString(),
      entries,
      categories,
      metadata: {
        totalEntries: entries.length,
        totalCategories: categories.length,
        backupType,
        versionName,
      },
    };
  }

  // 导出加密的 KBX 文件
  static async exportKBXFile(
    entries: PasswordEntry[],
    categories: Category[],
    password: string,
    backupType: "auto" | "manual",
    versionName?: string
  ): Promise<Blob> {
    const kbxData = this.createKBXData(
      entries,
      categories,
      backupType,
      versionName
    );
    const jsonData = JSON.stringify(kbxData, null, 2);
    const encryptedData = this.encryptData(jsonData, password);

    return new Blob([encryptedData], { type: "application/x-kbx" });
  }

  // 解析 KBX 文件
  static async parseKBXFile(
    file: File,
    password: string
  ): Promise<KBXFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const encryptedData = e.target?.result as string;
          const decryptedData = this.decryptData(encryptedData, password);
          const kbxData = JSON.parse(decryptedData) as KBXFileData;

          // 验证数据格式
          if (
            !kbxData.version ||
            !kbxData.entries ||
            !Array.isArray(kbxData.entries)
          ) {
            throw new Error("Invalid KBX file format");
          }

          resolve(kbxData);
        } catch {
          reject(
            new Error(
              "Failed to decrypt or parse KBX file. Please check your password."
            )
          );
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  // 生成文件名
  static generateFilename(
    backupType: "auto" | "manual",
    versionName?: string
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const prefix = backupType === "auto" ? "auto-backup" : "manual-backup";
    const suffix = versionName
      ? `-${versionName.replace(/[^a-zA-Z0-9-_]/g, "-")}`
      : "";

    return `${prefix}-${timestamp}${suffix}.kbx`;
  }

  // 启动自动备份
  static startAutoBackup(
    userId: string,
    getEntries: () => PasswordEntry[],
    getFolders: () => Folder[],
    onBackupComplete?: (filename: string) => void,
    onBackupError?: (error: Error) => void
  ) {
    // 清除现有的定时器
    this.stopAutoBackup();

    // 设置新的定时器
    this.autoBackupTimer = setInterval(async () => {
      try {
        const entries = getEntries();
        const folders = getFolders();
        if (entries.length === 0) return; // 没有数据时不备份

        const backupKey = this.getUserBackupKey(userId);
        const filename = this.generateFilename("auto");
        const blob = await this.exportKBXFile(
          entries,
          folders,
          backupKey,
          "auto"
        );

        // 这里应该上传到 Supabase，暂时先下载到本地
        await this.uploadToSupabase(userId, filename, blob, "auto");

        onBackupComplete?.(filename);
      } catch (error) {
        onBackupError?.(error as Error);
      }
    }, this.AUTO_BACKUP_INTERVAL);
  }

  // 停止自动备份
  static stopAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  // 手动备份
  static async manualBackup(
    userId: string,
    entries: PasswordEntry[],
    categories: Category[],
    versionName: string,
    password?: string
  ): Promise<string> {
    const backupKey = password || this.getUserBackupKey(userId);
    const filename = this.generateFilename("manual", versionName);
    const blob = await this.exportKBXFile(
      entries,
      categories,
      backupKey,
      "manual",
      versionName
    );

    await this.uploadToSupabase(userId, filename, blob, "manual", versionName);

    return filename;
  }

  // 上传到 Supabase
  private static async uploadToSupabase(
    userId: string,
    filename: string,
    blob: Blob,
    backupType: "auto" | "manual",
    versionName?: string
  ): Promise<void> {
    console.log("Uploading to Supabase:", {
      userId,
      filename,
      backupType,
      versionName,
    });

    try {
      // 读取 blob 内容
      const encryptedContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read blob"));
        reader.readAsText(blob);
      });

      // 上传到 Supabase
      const backupId = await SupabaseBackupService.uploadBackup(
        userId,
        filename,
        encryptedContent,
        backupType,
        versionName
      );

      console.log("Backup uploaded to Supabase successfully:", backupId);

      // 清理旧的自动备份
      if (backupType === "auto") {
        await SupabaseBackupService.cleanupOldAutoBackups(userId, 10);
      }

      // 同时保存到本地存储作为备份
      const backupRecord: BackupRecord = {
        id: backupId,
        userId,
        filename,
        filePath: `backups/${userId}/${filename}`,
        backupType,
        versionName,
        fileSize: blob.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingBackups = this.getLocalBackups(userId);
      existingBackups.push(backupRecord);
      localStorage.setItem(
        `keybox_backups_${userId}`,
        JSON.stringify(existingBackups)
      );

      localStorage.setItem(
        `keybox_backup_file_${backupRecord.id}`,
        encryptedContent
      );
    } catch (error) {
      console.error("Failed to upload to Supabase:", error);
      // 如果 Supabase 上传失败，回退到本地存储
      await this.fallbackToLocalStorage(
        userId,
        filename,
        blob,
        backupType,
        versionName
      );
    }
  }

  // 回退到本地存储
  private static async fallbackToLocalStorage(
    userId: string,
    filename: string,
    blob: Blob,
    backupType: "auto" | "manual",
    versionName?: string
  ): Promise<void> {
    console.log("Falling back to local storage");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const backupRecord: BackupRecord = {
            id: crypto.randomUUID(),
            userId,
            filename,
            filePath: `backups/${userId}/${filename}`,
            backupType,
            versionName,
            fileSize: blob.size,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const existingBackups = this.getLocalBackups(userId);
          existingBackups.push(backupRecord);
          localStorage.setItem(
            `keybox_backups_${userId}`,
            JSON.stringify(existingBackups)
          );

          localStorage.setItem(
            `keybox_backup_file_${backupRecord.id}`,
            reader.result as string
          );

          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read blob"));
      reader.readAsText(blob);
    });
  }

  // 获取备份记录（优先从 Supabase，回退到本地）
  static async getBackups(userId: string): Promise<BackupRecord[]> {
    try {
      // 尝试从 Supabase 获取
      const supabaseBackups = await SupabaseBackupService.getUserBackups(
        userId
      );

      // 转换格式
      const backups: BackupRecord[] = supabaseBackups.map((backup) => ({
        id: backup.id,
        userId: backup.user_id,
        filename: backup.filename,
        filePath: backup.file_path,
        backupType: backup.backup_type,
        versionName: backup.version_name,
        fileSize: backup.file_size,
        createdAt: backup.created_at,
        updatedAt: backup.updated_at,
      }));

      console.log(`Loaded ${backups.length} backups from Supabase`);
      return backups;
    } catch (error) {
      console.error(
        "Failed to load backups from Supabase, falling back to local:",
        error
      );
      return this.getLocalBackups(userId);
    }
  }

  // 获取本地备份记录
  static getLocalBackups(userId: string): BackupRecord[] {
    const backupsJson = localStorage.getItem(`keybox_backups_${userId}`);
    return backupsJson ? JSON.parse(backupsJson) : [];
  }

  // 获取备份文件内容（优先从 Supabase，回退到本地）
  static async getBackupFileContent(backupId: string): Promise<string | null> {
    try {
      // 尝试从 Supabase 获取
      const content = await SupabaseBackupService.getBackupContent(backupId);
      console.log(`Loaded backup content from Supabase for backup ${backupId}`);
      return content;
    } catch (error) {
      console.error(
        "Failed to load backup content from Supabase, falling back to local:",
        error
      );
      return localStorage.getItem(`keybox_backup_file_${backupId}`);
    }
  }

  // 删除备份（从 Supabase 和本地）
  static async deleteBackup(userId: string, backupId: string): Promise<void> {
    try {
      // 尝试从 Supabase 删除
      await SupabaseBackupService.deleteBackup(backupId);
      console.log(`Deleted backup from Supabase: ${backupId}`);
    } catch (error) {
      console.error("Failed to delete backup from Supabase:", error);
    }

    // 同时从本地删除
    const backups = this.getLocalBackups(userId);
    const updatedBackups = backups.filter((backup) => backup.id !== backupId);
    localStorage.setItem(
      `keybox_backups_${userId}`,
      JSON.stringify(updatedBackups)
    );
    localStorage.removeItem(`keybox_backup_file_${backupId}`);
  }
}
