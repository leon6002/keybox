// 文件夹管理工具类
export class FolderManager {
  // Fixed UUIDs for common folders (shared across all users)
  static readonly COMMON_FOLDER_IDS = {
    WORK: "00000000-0000-4000-8000-000000000001",
    PERSONAL: "00000000-0000-4000-8000-000000000002",
    SOCIAL: "00000000-0000-4000-8000-000000000003",
    FINANCE: "00000000-0000-4000-8000-000000000004",
    SHOPPING: "00000000-0000-4000-8000-000000000005",
    ENTERTAINMENT: "00000000-0000-4000-8000-000000000006",
    EDUCATION: "00000000-0000-4000-8000-000000000007",
    HEALTH: "00000000-0000-4000-8000-000000000008",
  };

  // 生成唯一 ID (UUID format for database compatibility)
  static generateId(): string {
    // Generate a UUID v4 compatible string for custom folders
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}

// Legacy export for backward compatibility
export const CategoryManager = FolderManager;
