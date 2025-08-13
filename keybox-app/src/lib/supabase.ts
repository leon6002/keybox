import { createClient } from "@supabase/supabase-js";

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 创建 Supabase 客户端 (用户端)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 创建 Supabase 管理员客户端 (服务端，绕过 RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// 备份记录类型定义
export interface SupabaseBackupRecord {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  backup_type: "auto" | "manual";
  version_name?: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

// 不再需要备份文件内容表，使用 Supabase Storage

// Supabase 备份服务
export class SupabaseBackupService {
  private static readonly BUCKET_NAME = "backups";

  // 检查存储桶状态（存储桶已手动创建）
  private static async checkBucketStatus(): Promise<void> {
    try {
      console.log(`Using storage bucket: ${this.BUCKET_NAME}`);

      // 测试存储桶访问
      const { error: listError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list("", { limit: 1 });

      if (listError) {
        console.warn("Storage bucket access test failed:", listError);
      } else {
        console.log("Storage bucket access test successful");
      }
    } catch (error) {
      console.warn("Error checking bucket status:", error);
    }
  }

  // 上传备份到 Supabase Storage
  static async uploadBackup(
    userId: string,
    filename: string,
    encryptedContent: string,
    backupType: "auto" | "manual",
    versionName?: string
  ): Promise<string> {
    try {
      // 检查存储桶状态
      await this.checkBucketStatus();

      const filePath = `${userId}/${filename}`;
      const fileSize = new Blob([encryptedContent]).size;

      console.log(`Uploading backup file:`, {
        bucket: this.BUCKET_NAME,
        filePath,
        fileSize,
        contentLength: encryptedContent.length,
      });

      // 1. 上传文件到 Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, encryptedContent, {
          contentType: "application/octet-stream",
          upsert: true, // 允许覆盖同名文件
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(
          `Failed to upload file to storage: ${uploadError.message}`
        );
      }

      console.log("File uploaded successfully:", uploadData);

      // 2. 插入备份记录到数据库
      const { data: backupRecord, error: backupError } = await supabase
        .from("keybox_backups")
        .insert({
          user_id: userId,
          filename,
          file_path: filePath,
          backup_type: backupType,
          version_name: versionName,
          file_size: fileSize,
        })
        .select()
        .single();

      if (backupError) {
        // 如果数据库插入失败，删除已上传的文件
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
        throw new Error(
          `Failed to create backup record: ${backupError.message}`
        );
      }

      console.log("Backup uploaded to Supabase Storage successfully:", {
        backupId: backupRecord.id,
        filename,
        filePath,
        fileSize,
        backupType,
        versionName,
      });

      return backupRecord.id;
    } catch (error) {
      console.error("Failed to upload backup to Supabase:", error);
      throw error;
    }
  }

  // 获取用户的备份列表
  static async getUserBackups(userId: string): Promise<SupabaseBackupRecord[]> {
    try {
      const { data, error } = await supabase
        .from("keybox_backups")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch backups: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Failed to fetch user backups:", error);
      throw error;
    }
  }

  // 获取备份文件内容
  static async getBackupContent(backupId: string): Promise<string> {
    try {
      // 1. 先获取备份记录以获得文件路径
      const { data: backupRecord, error: recordError } = await supabase
        .from("keybox_backups")
        .select("file_path")
        .eq("id", backupId)
        .single();

      if (recordError) {
        throw new Error(
          `Failed to fetch backup record: ${recordError.message}`
        );
      }

      // 2. 从 Storage 下载文件
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(backupRecord.file_path);

      if (downloadError) {
        throw new Error(
          `Failed to download backup file: ${downloadError.message}`
        );
      }

      // 3. 将 Blob 转换为文本
      const encryptedContent = await fileData.text();

      console.log(
        `Downloaded backup content from Storage: ${backupRecord.file_path}`
      );
      return encryptedContent;
    } catch (error) {
      console.error("Failed to fetch backup content:", error);
      throw error;
    }
  }

  // 删除备份
  static async deleteBackup(backupId: string): Promise<void> {
    try {
      // 1. 先获取备份记录以获得文件路径
      const { data: backupRecord, error: recordError } = await supabase
        .from("keybox_backups")
        .select("file_path")
        .eq("id", backupId)
        .single();

      if (recordError) {
        throw new Error(
          `Failed to fetch backup record: ${recordError.message}`
        );
      }

      // 2. 从 Storage 删除文件
      const { error: deleteFileError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([backupRecord.file_path]);

      if (deleteFileError) {
        console.warn(
          `Failed to delete file from storage: ${deleteFileError.message}`
        );
        // 继续删除数据库记录，即使文件删除失败
      }

      // 3. 删除数据库记录
      const { error: deleteRecordError } = await supabase
        .from("keybox_backups")
        .delete()
        .eq("id", backupId);

      if (deleteRecordError) {
        throw new Error(
          `Failed to delete backup record: ${deleteRecordError.message}`
        );
      }

      console.log("Backup deleted from Supabase successfully:", {
        backupId,
        filePath: backupRecord.file_path,
      });
    } catch (error) {
      console.error("Failed to delete backup:", error);
      throw error;
    }
  }

  // 清理旧的自动备份（保留最近的 N 个）
  static async cleanupOldAutoBackups(
    userId: string,
    keepCount: number = 10
  ): Promise<void> {
    try {
      // 获取用户的自动备份，按创建时间倒序
      const { data: backups, error: fetchError } = await supabase
        .from("keybox_backups")
        .select("id, file_path")
        .eq("user_id", userId)
        .eq("backup_type", "auto")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch auto backups: ${fetchError.message}`);
      }

      // 如果备份数量超过保留数量，删除多余的
      if (backups && backups.length > keepCount) {
        const backupsToDelete = backups.slice(keepCount);

        // 删除 Storage 中的文件
        const filePaths = backupsToDelete.map((backup) => backup.file_path);
        if (filePaths.length > 0) {
          const { error: deleteFilesError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .remove(filePaths);

          if (deleteFilesError) {
            console.warn(
              `Failed to delete some files from storage: ${deleteFilesError.message}`
            );
          }
        }

        // 删除数据库记录
        const idsToDelete = backupsToDelete.map((backup) => backup.id);
        const { error: deleteError } = await supabase
          .from("keybox_backups")
          .delete()
          .in("id", idsToDelete);

        if (deleteError) {
          throw new Error(
            `Failed to cleanup old backups: ${deleteError.message}`
          );
        }

        console.log(
          `Cleaned up ${idsToDelete.length} old auto backups for user ${userId}`
        );
      }
    } catch (error) {
      console.error("Failed to cleanup old auto backups:", error);
      // 不抛出错误，因为清理失败不应该影响主要功能
    }
  }

  // 测试连接
  static async testConnection(): Promise<boolean> {
    try {
      // 测试数据库连接
      const { error: dbError } = await supabase
        .from("keybox_backups")
        .select("count")
        .limit(1);

      if (dbError) {
        console.error("Database connection test failed:", dbError);
        return false;
      }

      // 测试存储连接
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list("", { limit: 1 });

      if (storageError) {
        console.error("Storage connection test failed:", storageError);
        return false;
      }

      console.log("Supabase connection test successful");
      return true;
    } catch (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }
  }

  // 下载备份文件
  static async downloadBackup(backupId: string): Promise<string> {
    try {
      // 1. 从数据库获取备份记录
      const { data: backup, error: fetchError } = await supabase
        .from("keybox_backups")
        .select("*")
        .eq("id", backupId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch backup record: ${fetchError.message}`);
      }

      if (!backup) {
        throw new Error("Backup not found");
      }

      console.log("Downloading backup file:", {
        backupId,
        filePath: backup.file_path,
        filename: backup.filename,
      });

      // 2. 从 Storage 下载文件
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(backup.file_path);

      if (downloadError) {
        console.error("Storage download error:", downloadError);
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      if (!fileData) {
        throw new Error("No file data received");
      }

      // 3. 将 Blob 转换为文本
      const content = await fileData.text();
      console.log("File downloaded successfully, size:", content.length);

      return content;
    } catch (error) {
      console.error("Failed to download backup:", error);
      throw error;
    }
  }

  // 下载备份文件并触发浏览器下载
  static async downloadBackupFile(backupId: string): Promise<void> {
    try {
      // 1. 获取备份记录
      const { data: backup, error: fetchError } = await supabase
        .from("keybox_backups")
        .select("*")
        .eq("id", backupId)
        .single();

      if (fetchError || !backup) {
        throw new Error("Backup not found");
      }

      // 2. 下载文件内容
      const content = await this.downloadBackup(backupId);

      // 3. 创建下载链接
      const blob = new Blob([content], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      // 4. 触发下载
      const link = document.createElement("a");
      link.href = url;
      link.download = backup.filename;
      document.body.appendChild(link);
      link.click();

      // 5. 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("File download triggered:", backup.filename);
    } catch (error) {
      console.error("Failed to download backup file:", error);
      throw error;
    }
  }

  // 获取用户的所有备份记录
  static async getBackups(userId: string): Promise<any[]> {
    try {
      const { data: backups, error } = await supabase
        .from("keybox_backups")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch backups: ${error.message}`);
      }

      return backups || [];
    } catch (error) {
      console.error("Failed to get backups:", error);
      throw error;
    }
  }

  // 批量下载所有备份文件
  static async downloadAllBackups(userId: string): Promise<void> {
    try {
      console.log("Starting batch download for user:", userId);

      // 1. 获取用户的所有备份
      const backups = await this.getBackups(userId);

      if (backups.length === 0) {
        throw new Error("No backups found");
      }

      console.log(`Found ${backups.length} backups to download`);

      // 2. 逐个下载文件
      for (let i = 0; i < backups.length; i++) {
        const backup = backups[i];
        console.log(
          `Downloading ${i + 1}/${backups.length}: ${backup.filename}`
        );

        try {
          await this.downloadBackupFile(backup.id);
          // 添加小延迟避免浏览器阻止多个下载
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to download ${backup.filename}:`, error);
          // 继续下载其他文件，不中断整个过程
        }
      }

      console.log("Batch download completed");
    } catch (error) {
      console.error("Failed to download all backups:", error);
      throw error;
    }
  }

  // 测试上传功能
  static async testUpload(userId: string): Promise<boolean> {
    try {
      const testContent = "test-backup-content";
      const testFilename = `test-${Date.now()}.txt`;

      console.log("Testing upload functionality...");

      const backupId = await this.uploadBackup(
        userId,
        testFilename,
        testContent,
        "manual",
        "Test Upload"
      );

      console.log("Test upload successful, backup ID:", backupId);

      // 清理测试文件
      await this.deleteBackup(backupId);
      console.log("Test cleanup successful");

      return true;
    } catch (error) {
      console.error("Upload test failed:", error);
      return false;
    }
  }
}
