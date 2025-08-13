// 文件夹定义
export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  fields: FolderField[];
  createdAt: string;
  updatedAt: string;
}

// 文件夹字段定义
export interface FolderField {
  id: string;
  name: string;
  type:
    | "text"
    | "password"
    | "email"
    | "url"
    | "textarea"
    | "number"
    | "date"
    | "phone";
  isRequired: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: string[]; // 用于选择类型
}

// 自定义字段类型
export interface CustomField {
  id: string;
  name: string;
  value: string;
  type:
    | "text"
    | "password"
    | "email"
    | "url"
    | "textarea"
    | "number"
    | "date"
    | "phone";
  isRequired?: boolean;
  placeholder?: string;
}

// 密码条目接口
export interface PasswordEntry {
  id: string;
  title: string;
  folderId: string;
  username?: string;
  password?: string;
  website?: string;
  description: string;
  notes: string;
  customFields: CustomField[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  passwordType?: string; // Type of password entry (website, banking, credit-card, etc.)
  // Legacy field for backward compatibility
  categoryId?: string;
}

// 密码数据库接口
export interface PasswordDatabase {
  version: string;
  entries: PasswordEntry[];
  folders: Folder[];
  exportedAt: string;
  // Legacy field for backward compatibility during migration
  categories?: any[];
}

// 搜索结果接口
export interface SearchResult {
  entry: PasswordEntry;
  matchedFields: string[];
  score: number;
}

// 表单数据接口
export interface PasswordFormData {
  title: string;
  username: string;
  password: string;
  website: string;
  description: string;
  notes: string;
  customFields: CustomField[];
  tags: string[];
  isFavorite: boolean;
}

// 导入/导出选项
export interface ImportOptions {
  mergeStrategy: "replace" | "merge" | "skip";
  validateData: boolean;
}

export interface ExportOptions {
  includePasswords: boolean;
  format: "json" | "csv";
  selectedEntries?: string[];
  encrypt?: boolean;
  password?: string;
}

// 应用状态接口
export interface AppState {
  entries: PasswordEntry[];
  folders: Folder[];
  searchQuery: string;
  filteredEntries: PasswordEntry[];
  selectedEntry: PasswordEntry | null;
  selectedFolder: string | null;
  isEditing: boolean;
  showAddForm: boolean;
  showFolderManager: boolean;
  sortBy: "title" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
  viewMode: "list" | "grid" | "table";
  // Legacy fields for backward compatibility (removed)
  // categories?: any[];
  // selectedCategory?: string | null;
  // showCategoryManager?: boolean;
}

// 工具函数类型
export type PasswordGenerator = {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  isMemorableFriendly: boolean;
  memorableOptions?: {
    wordCount: number;
    separator: string;
    includeNumbers: boolean;
    capitalizeWords: boolean;
  };
};
