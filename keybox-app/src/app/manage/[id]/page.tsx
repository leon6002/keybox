"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus, Edit3 } from "lucide-react";
import { PasswordEntry, Category } from "@/types/password";
import { StorageManager } from "@/utils/storage";
import { SearchEngine } from "@/utils/search";
import PasswordEditForm from "@/components/PasswordEditForm";
import { useConfirm } from "@/hooks/useConfirm";

export default function ManagePasswordWithIdPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;

  // 智能返回函数
  const handleGoBack = () => {
    // 检查是否有历史记录
    if (window.history.length > 1) {
      router.back();
    } else {
      // 如果没有历史记录，跳转到密码列表页面
      router.push("/passwords");
    }
  };

  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<PasswordEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  // 加载数据
  useEffect(() => {
    const loadedData = StorageManager.loadFromLocalStorage();
    setEntries(loadedData.entries);
    setCategories(loadedData.categories);
    setFilteredEntries(loadedData.entries);

    // 根据URL参数选中对应条目
    if (entryId && loadedData.entries.length > 0) {
      const entryToEdit = loadedData.entries.find(
        (entry) => entry.id === entryId
      );
      if (entryToEdit) {
        setSelectedEntry(entryToEdit);
      } else {
        // 如果找不到指定条目，跳转到首页
        router.replace("/");
      }
    } else if (loadedData.entries.length === 0) {
      // 如果没有任何密码，跳转到添加页面
      router.replace("/add");
    } else {
      // 如果没有ID参数但有密码，跳转到首页
      router.replace("/");
    }
  }, [entryId, router]);

  // 搜索功能
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEntries(entries);
    } else {
      const results = SearchEngine.search(entries, searchQuery);
      setFilteredEntries(results);
    }
  }, [entries, searchQuery]);

  // 保存条目
  const handleSaveEntry = (updatedEntry: PasswordEntry) => {
    const updatedEntries = entries.map((entry) =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    );
    setEntries(updatedEntries);
    setSelectedEntry(updatedEntry);
    StorageManager.saveToLocalStorage(updatedEntries, categories);
  };

  // 删除条目
  const handleDeleteEntry = async (entryId: string) => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
      handleGoBack();
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

      // 删除后返回上一页
      handleGoBack();
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "未知时间";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "无效日期";
      return date.toLocaleString("zh-CN");
    } catch {
      return "日期错误";
    }
  };

  if (!selectedEntry) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">加载中...</h2>
            <Button onClick={() => router.push("/manage")}>返回管理页面</Button>
          </div>
        </div>
      </div>
    );
  }

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
                  编辑密码
                </button>
                <button
                  onClick={() => (window.location.href = "/add")}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  添加密码
                </button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleGoBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
              <Button onClick={() => router.push("/add")}>
                <Plus className="w-4 h-4 mr-2" />
                添加密码
              </Button>
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
          </div>

          {/* Password List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEntries.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "未找到匹配的密码" : "暂无密码条目"}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredEntries.map((entry) => {
                  const category = categories.find(
                    (cat) => cat.id === entry.categoryId
                  );
                  const isSelected = selectedEntry?.id === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => router.push(`/manage/${entry.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {category && (
                              <span className="text-lg">{category.icon}</span>
                            )}
                            <h3 className="font-medium text-sm truncate">
                              {entry.title}
                            </h3>
                          </div>
                          {entry.username && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {entry.username}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(entry.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Edit Form */}
        <div className="flex-1 flex flex-col">
          {selectedEntry && (
            <PasswordEditForm
              entry={selectedEntry}
              categories={categories}
              onSave={handleSaveEntry}
              onDelete={handleDeleteEntry}
              onCancel={handleGoBack}
            />
          )}
        </div>
      </div>

      <ConfirmDialog />
    </div>
  );
}
