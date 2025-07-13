"use client";

import { useState, useEffect } from "react";
import { PasswordEntry, Category } from "@/types/password";
import { StorageManager } from "@/utils/storage";
import { SearchEngine } from "@/utils/search";

import SearchBar from "@/components/SearchBar";
import PasswordList from "@/components/PasswordList";
import PasswordViewModal from "@/components/PasswordViewModal";
import ImportExport from "@/components/ImportExport";
import CategoryManager from "@/components/CategoryManager";
import QuickImportExport from "@/components/QuickImportExport";
import CategoryFilter from "@/components/CategoryFilter";

export default function PasswordsPage() {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [filteredEntries, setFilteredEntries] = useState<PasswordEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(
    null
  );
  const [showPasswordView, setShowPasswordView] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showQuickImportExport, setShowQuickImportExport] = useState<
    "import" | "export" | null
  >(null);

  // 加载数据
  useEffect(() => {
    const loadedData = StorageManager.loadFromLocalStorage();
    setEntries(loadedData.entries);
    setCategories(loadedData.categories);
    setFilteredEntries(loadedData.entries);
  }, []);

  // 搜索和类目过滤
  useEffect(() => {
    let filtered = entries;

    // 先按类目筛选
    if (selectedCategoryId !== "all") {
      filtered = filtered.filter(
        (entry) => entry.categoryId === selectedCategoryId
      );
    }

    // 再按搜索查询筛选
    if (searchQuery.trim() !== "") {
      const results = SearchEngine.search(filtered, searchQuery);
      filtered = results.map((result) => result.entry);
    }

    setFilteredEntries(filtered);
  }, [entries, searchQuery, selectedCategoryId]);

  // 删除条目
  const handleDeleteEntry = (entryId: string) => {
    const updatedEntries = entries.filter((entry) => entry.id !== entryId);
    setEntries(updatedEntries);
    StorageManager.saveToLocalStorage(updatedEntries, categories);
  };

  // 处理导入数据
  const handleImportData = (importedEntries: PasswordEntry[]) => {
    // 合并导入的条目和现有条目
    const mergedEntries = [...entries, ...importedEntries];
    setEntries(mergedEntries);

    // 保存到 localStorage
    StorageManager.saveToLocalStorage(mergedEntries, categories);

    // 更新过滤后的条目
    if (searchQuery.trim() === "") {
      setFilteredEntries(mergedEntries);
    } else {
      const results = SearchEngine.search(mergedEntries, searchQuery);
      setFilteredEntries(results.map((result) => result.entry));
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
                <button className="px-3 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                  密码列表
                </button>
                <button
                  onClick={() => (window.location.href = "/manage")}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  密码管理
                </button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">
                共{entries.length} 个密码
              </span>
              <button
                onClick={() => setShowCategoryManager(true)}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                分类管理
              </button>
              <button
                onClick={() => setShowImportExport(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 cursor-pointer text-sm"
              >
                导入/导出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        {entries.length > 0 ? (
          <>
            {/* 搜索和筛选区域 */}
            <div className="mb-6 space-y-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索密码条目..."
              />

              {/* 类目筛选器和统计信息 */}
              <div className="flex items-center justify-between">
                <CategoryFilter
                  categories={categories}
                  entries={entries}
                  selectedCategoryId={selectedCategoryId}
                  onCategoryChange={setSelectedCategoryId}
                />

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedCategoryId === "all" ? (
                    <span>显示全部 {filteredEntries.length} 个密码</span>
                  ) : (
                    <span>
                      筛选结果：{filteredEntries.length} 个密码
                      {searchQuery && ` (搜索: "${searchQuery}")`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <PasswordList
              entries={filteredEntries}
              categories={categories}
              searchQuery={searchQuery}
              onDelete={handleDeleteEntry}
              onView={(entry) => {
                setSelectedEntry(entry);
                setShowPasswordView(true);
              }}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-white"
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              欢迎使用 PandaKeyBox
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
              您还没有保存任何密码。开始创建您的第一个密码条目，让 PandaKeyBox
              帮您安全管理所有密码。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => (window.location.href = "/manage")}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 cursor-pointer"
              >
                开始管理密码
              </button>
              <button
                onClick={() => setShowQuickImportExport("import")}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                导入现有密码
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 弹窗组件 */}
      {showPasswordView && selectedEntry && (
        <PasswordViewModal
          isOpen={showPasswordView}
          entry={selectedEntry}
          categories={categories}
          onClose={() => {
            setShowPasswordView(false);
            setSelectedEntry(null);
          }}
        />
      )}

      {showImportExport && (
        <ImportExport
          entries={entries}
          categories={categories}
          onClose={() => setShowImportExport(false)}
          onImport={handleImportData}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onSave={(newCategories: Category[]) => {
            setCategories(newCategories);
            StorageManager.saveToLocalStorage(entries, newCategories);
          }}
        />
      )}

      {showQuickImportExport && (
        <QuickImportExport
          mode={showQuickImportExport}
          entries={entries}
          categories={categories}
          onClose={() => setShowQuickImportExport(null)}
          onImport={handleImportData}
        />
      )}
    </div>
  );
}
