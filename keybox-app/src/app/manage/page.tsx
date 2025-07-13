"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed unused Card imports
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Plus, Edit3 } from "lucide-react";
import { PasswordEntry, Category } from "@/types/password";
import { StorageManager } from "@/utils/storage";
import { SearchEngine } from "@/utils/search";
import PasswordEditForm from "@/components/PasswordEditForm";
import { useConfirm } from "@/hooks/useConfirm";

function ManagePasswordsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("id");

  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<PasswordEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  // 智能返回函数
  const handleGoBack = () => {
    // 检查是否有历史记录
    if (window.history.length > 1) {
      router.back();
    } else {
      // 如果没有历史记录，跳转到首页
      router.push("/");
    }
  };

  // 选择条目并更新 URL
  const handleSelectEntry = (entry: PasswordEntry) => {
    setSelectedEntry(entry);
    // 更新 URL 但不刷新页面
    const newUrl = `/manage?id=${entry.id}`;
    window.history.replaceState(null, "", newUrl);
  };

  // 加载数据
  useEffect(() => {
    const loadedData = StorageManager.loadFromLocalStorage();

    // 调试信息
    console.log("原始加载数据:", loadedData);
    console.log("条目数量:", loadedData.entries.length);
    if (loadedData.entries.length > 0) {
      console.log("第一个条目详情:", loadedData.entries[0]);
      console.log("第一个条目的所有属性:", Object.keys(loadedData.entries[0]));
    }

    setEntries(loadedData.entries);
    setCategories(loadedData.categories);
    setFilteredEntries(loadedData.entries);

    // 根据 URL 参数选择条目
    if (entryId && loadedData.entries.length > 0) {
      const entryToEdit = loadedData.entries.find(
        (entry) => entry.id === entryId
      );
      if (entryToEdit) {
        setSelectedEntry(entryToEdit);
      } else {
        // 如果找不到指定的条目，跳转到密码列表页面
        router.push("/passwords");
      }
    } else if (loadedData.entries.length > 0) {
      setSelectedEntry(loadedData.entries[0]);
    }
  }, [entryId, router]);

  // 搜索过滤
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = SearchEngine.search(entries, searchQuery);
      const filteredResults = results.map((result) => result.entry);
      setFilteredEntries(filteredResults);

      // 如果当前选中的条目不在搜索结果中，选择第一个结果
      if (
        filteredResults.length > 0 &&
        selectedEntry &&
        !filteredResults.find((e) => e.id === selectedEntry.id)
      ) {
        setSelectedEntry(filteredResults[0]);
      }
    } else {
      setFilteredEntries(entries);
    }
  }, [entries, searchQuery, selectedEntry]);

  // 获取类目信息
  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "未分类";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "未分类";
  };

  // 获取用户名信息
  const getUsernameDisplay = (entry: PasswordEntry) => {
    // 调试信息
    console.log("处理条目:", entry.title);
    console.log("username字段:", entry.username);
    console.log("customFields:", entry.customFields);

    // 优先使用 username 字段
    if (entry.username) return entry.username;

    // 从 customFields 中查找用户名相关字段
    if (entry.customFields && entry.customFields.length > 0) {
      console.log("搜索customFields中的用户名字段...");

      const usernameField = entry.customFields.find((f) => {
        console.log("检查字段:", f.name, "值:", f.value);
        if (!f.name) return false;

        const fieldName = f.name.toLowerCase();
        return (
          fieldName.includes("用户") ||
          fieldName.includes("username") ||
          fieldName.includes("账号") ||
          fieldName.includes("邮箱") ||
          fieldName.includes("email") ||
          fieldName.includes("登录") ||
          fieldName.includes("login") ||
          fieldName === "用户名" ||
          fieldName === "username" ||
          fieldName === "邮箱" ||
          fieldName === "email"
        );
      });

      console.log("找到的用户名字段:", usernameField);

      if (usernameField && usernameField.value) {
        return usernameField.value;
      }

      // 如果没找到用户名字段，尝试显示第一个有值的字段
      const firstFieldWithValue = entry.customFields.find(
        (f) => f.value && f.value.trim()
      );
      if (firstFieldWithValue) {
        console.log("使用第一个有值的字段:", firstFieldWithValue);
        return `${firstFieldWithValue.name}: ${firstFieldWithValue.value}`;
      }
    }

    return "无用户名";
  };

  // 创建示例数据
  const createSampleData = () => {
    const now = new Date().toISOString();
    const websiteCategory = categories.find((cat) => cat.name === "网站账号");
    const bankCategory = categories.find((cat) => cat.name === "银行卡");
    const generalCategory = categories.find((cat) => cat.name === "通用");

    const sampleEntries: PasswordEntry[] = [
      {
        id: StorageManager.generateId(),
        title: "GitHub",
        categoryId: websiteCategory?.id || categories[0]?.id || "",
        customFields: [
          {
            id: "username",
            name: "用户名",
            value: "john.doe@example.com",
            type: "text",
            isRequired: true,
          },
          {
            id: "password",
            name: "密码",
            value: "MySecurePassword123!",
            type: "password",
            isRequired: true,
          },
          {
            id: "website",
            name: "网站地址",
            value: "https://github.com",
            type: "url",
            isRequired: false,
          },
        ],
        tags: ["开发", "代码"],
        isFavorite: true,
        username: "john.doe@example.com",
        password: "MySecurePassword123!",
        website: "https://github.com",
        description: "GitHub 开发账号",
        notes: "用于开源项目开发",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: StorageManager.generateId(),
        title: "Gmail",
        categoryId: websiteCategory?.id || categories[0]?.id || "",
        customFields: [
          {
            id: "username",
            name: "用户名",
            value: "john.doe@gmail.com",
            type: "text",
            isRequired: true,
          },
          {
            id: "password",
            name: "密码",
            value: "EmailPassword456!",
            type: "password",
            isRequired: true,
          },
          {
            id: "website",
            name: "网站地址",
            value: "https://gmail.com",
            type: "url",
            isRequired: false,
          },
        ],
        tags: ["邮箱", "个人"],
        isFavorite: false,
        username: "john.doe@gmail.com",
        password: "EmailPassword456!",
        website: "https://gmail.com",
        description: "个人邮箱账号",
        notes: "主要邮箱地址",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: StorageManager.generateId(),
        title: "工商银行",
        categoryId:
          bankCategory?.id || generalCategory?.id || categories[0]?.id || "",
        customFields: [
          {
            id: "cardNumber",
            name: "卡号",
            value: "6222 0000 0000 0000",
            type: "text",
            isRequired: true,
          },
          {
            id: "holder",
            name: "持卡人",
            value: "张三",
            type: "text",
            isRequired: true,
          },
          {
            id: "expiry",
            name: "有效期",
            value: "12/28",
            type: "text",
            isRequired: true,
          },
          {
            id: "cvv",
            name: "CVV",
            value: "123",
            type: "password",
            isRequired: true,
          },
        ],
        tags: ["银行", "储蓄卡"],
        isFavorite: false,
        username: "张三",
        password: "",
        website: "",
        description: "工商银行储蓄卡",
        notes: "主要银行卡",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const updatedEntries = [...entries, ...sampleEntries];
    setEntries(updatedEntries);
    setFilteredEntries(updatedEntries);
    StorageManager.saveToLocalStorage(updatedEntries, categories);

    // 选择第一个示例条目
    if (sampleEntries.length > 0) {
      setSelectedEntry(sampleEntries[0]);
    }
  };

  // 创建新密码
  const handleCreateNew = () => {
    const now = new Date().toISOString();
    const newEntry: PasswordEntry = {
      id: StorageManager.generateId(),
      title: "新密码",
      categoryId: categories.length > 0 ? categories[0].id : "",
      customFields:
        categories.length > 0
          ? categories[0].fields.map((field) => ({
              id: field.id,
              name: field.name,
              value: "",
              type: field.type,
              isRequired: field.isRequired,
              placeholder: field.placeholder,
            }))
          : [],
      tags: [],
      isFavorite: false,
      username: "",
      password: "",
      website: "",
      description: "",
      notes: "",
      createdAt: now,
      updatedAt: now,
    };

    setSelectedEntry(newEntry);
    setIsCreatingNew(true);
    setSearchQuery(""); // 清空搜索以显示所有条目
  };

  // 保存条目
  const handleSaveEntry = (updatedEntry: PasswordEntry) => {
    let updatedEntries;

    if (isCreatingNew) {
      // 添加新条目
      updatedEntries = [...entries, updatedEntry];
      setIsCreatingNew(false);
    } else {
      // 更新现有条目
      updatedEntries = entries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      );
    }

    setEntries(updatedEntries);
    setSelectedEntry(updatedEntry);
    StorageManager.saveToLocalStorage(updatedEntries, categories);
  };

  // 删除条目
  const handleDeleteEntry = async (entryId: string) => {
    if (isCreatingNew) {
      // 如果是新创建的条目，直接取消创建
      setIsCreatingNew(false);
      setSelectedEntry(entries.length > 0 ? entries[0] : null);
      return;
    }

    const confirmed = await confirm({
      title: "删除密码条目",
      description: "确定要删除这个密码条目吗？此操作无法撤销。",
      confirmText: "删除",
      cancelText: "取消",
      variant: "destructive",
    });

    if (confirmed) {
      const updatedEntries = entries.filter((entry) => entry.id !== entryId);
      setEntries(updatedEntries);
      StorageManager.saveToLocalStorage(updatedEntries, categories);

      // 如果删除的是当前选中的条目，选择下一个
      if (selectedEntry?.id === entryId) {
        const currentIndex = filteredEntries.findIndex((e) => e.id === entryId);
        const nextEntry =
          filteredEntries[currentIndex + 1] ||
          filteredEntries[currentIndex - 1] ||
          null;
        setSelectedEntry(nextEntry);
      }
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "未知时间";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "无效日期";
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "日期错误";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PandaKeyBox
                </span>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => (window.location.href = "/")}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  首页
                </button>
                <button
                  onClick={() => (window.location.href = "/passwords")}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  密码列表
                </button>
                <button className="px-3 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                  密码管理
                </button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {entries.length} 个条目
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleGoBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
              <div className="flex items-center space-x-2">
                {entries.length === 0 && (
                  <Button variant="outline" onClick={createSampleData}>
                    创建示例数据
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: "清除所有数据",
                      description: "确定要清除所有数据吗？此操作无法撤销。",
                      confirmText: "清除",
                      cancelText: "取消",
                      variant: "destructive",
                    });
                    if (confirmed) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  清除数据
                </Button>
                <Button onClick={() => router.push("/add")}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加新密码
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Password List */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索密码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleCreateNew}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加新密码
            </Button>
          </div>

          {/* Password List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEntries.length === 0 && !isCreatingNew ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "没有找到匹配的密码" : "还没有密码条目"}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {/* 显示新创建的条目 */}
                {isCreatingNew && selectedEntry && (
                  <div
                    key="new-entry"
                    className="p-3 rounded-lg cursor-pointer transition-colors bg-blue-50 border-2 border-dashed border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-blue-900 dark:text-blue-100">
                          {selectedEntry.title}
                        </h3>
                        <p className="text-sm opacity-70 truncate text-blue-700 dark:text-blue-300">
                          新建密码
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                          >
                            {getCategoryName(selectedEntry.categoryId)}
                          </Badge>
                          <span className="text-xs opacity-60 text-blue-600 dark:text-blue-400">
                            刚刚创建
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 显示现有条目 */}
                {filteredEntries.map((entry, index) => (
                  <div
                    key={entry.id || `entry-${index}`}
                    onClick={() => {
                      handleSelectEntry(entry);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedEntry?.id === entry.id && !isCreatingNew
                        ? "bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                        : "hover:bg-muted border border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium truncate ${
                            selectedEntry?.id === entry.id && !isCreatingNew
                              ? "text-blue-900 dark:text-blue-100"
                              : ""
                          }`}
                        >
                          {entry.title}
                        </h3>
                        <p
                          className={`text-sm opacity-70 truncate ${
                            selectedEntry?.id === entry.id && !isCreatingNew
                              ? "text-blue-700 dark:text-blue-300"
                              : ""
                          }`}
                        >
                          {getUsernameDisplay(entry)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              selectedEntry?.id === entry.id && !isCreatingNew
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                : ""
                            }`}
                          >
                            {getCategoryName(entry.categoryId)}
                          </Badge>
                          <span
                            className={`text-xs opacity-60 ${
                              selectedEntry?.id === entry.id && !isCreatingNew
                                ? "text-blue-600 dark:text-blue-400"
                                : ""
                            }`}
                          >
                            {formatDate(entry.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Content - Edit Form */}
        <div className="flex-1 flex flex-col">
          {selectedEntry ? (
            <PasswordEditForm
              entry={selectedEntry}
              categories={categories}
              onSave={handleSaveEntry}
              onDelete={() => handleDeleteEntry(selectedEntry.id)}
              isCreatingNew={isCreatingNew}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">选择一个密码条目</h3>
                <p>从左侧列表中选择一个密码条目来开始编辑</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog />
    </div>
  );
}

export default function ManagePasswordsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      }
    >
      <ManagePasswordsContent />
    </Suspense>
  );
}
