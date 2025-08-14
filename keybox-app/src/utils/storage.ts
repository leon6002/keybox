const STORAGE_KEY = "keybox_passwords";

// 本地存储管理类
export class StorageManager {
  // 生成唯一 ID
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // 清空所有数据
  static clearAllData(): void {
    try {
      if (
        typeof window !== "undefined" &&
        typeof localStorage !== "undefined"
      ) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn("⚠️ Failed to clear localStorage:", error);
    }
  }

  // 获取存储使用情况
  static getStorageInfo(): { used: number; total: number; percentage: number } {
    try {
      if (
        typeof window === "undefined" ||
        typeof localStorage === "undefined"
      ) {
        return { used: 0, total: 0, percentage: 0 };
      }

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
