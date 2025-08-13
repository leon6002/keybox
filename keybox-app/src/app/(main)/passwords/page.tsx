"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { PasswordEntry } from "@/types/password";
import { StorageManager } from "@/utils/storage";
import { SearchEngine } from "@/utils/search";

import SearchBar from "@/components/SearchBar";
import PasswordList from "@/components/PasswordList";
import PasswordViewModal from "@/components/PasswordViewModal";
import ImportExport from "@/components/ImportExport";
import QuickImportExport from "@/components/QuickImportExport";
import PasswordGuard from "@/components/auth/PasswordGuard";

export default function PasswordsPage() {
  return (
    <PasswordGuard>
      <PasswordsPageContent />
    </PasswordGuard>
  );
}

function PasswordsPageContent() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [isLoading, setIsLoading] = useState(true);
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(false);

      // 模拟加载延迟，让用户看到骨架屏效果
      await new Promise((resolve) => setTimeout(resolve, 800));

      const loadedData = StorageManager.loadFromLocalStorage();

      // 按创建时间倒序排序（最新的在前面）
      const sortedEntries = [...loadedData.entries].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setEntries(sortedEntries);
      setFilteredEntries(sortedEntries);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // 搜索和类目过滤
  useEffect(() => {
    let filtered = entries;

    // 再按搜索查询筛选
    if (searchQuery.trim() !== "") {
      const results = SearchEngine.search(filtered, searchQuery);
      filtered = results.map((result) => result.entry);
    }

    // 按创建时间倒序排序（最新的在前面）
    const sortedFiltered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredEntries(sortedFiltered);
  }, [entries, searchQuery]);

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

    // 按创建时间倒序排序（最新的在前面）
    const sortedEntries = [...mergedEntries].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    setEntries(sortedEntries);

    // 保存到 localStorage
    StorageManager.saveToLocalStorage(mergedEntries, categories);

    // 更新过滤后的条目
    if (searchQuery.trim() === "" && selectedCategoryId === "all") {
      setFilteredEntries(sortedEntries);
    } else {
      // 重新应用搜索和筛选
      let filtered = sortedEntries;

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
    }
  };

  return (
    <>
      <motion.main
        className="container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
      >
        {/* 搜索和筛选区域 - 始终显示 */}
        <motion.div
          className="mb-6 space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t("password.searchPlaceholder")}
            />
          </motion.div>

          {/* 类目筛选器和统计信息 */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <motion.div
              className="text-sm text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {isLoading ? (
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : selectedCategoryId === "all" ? (
                <span>
                  {t("password.showingAll", {
                    count: filteredEntries.length,
                  })}
                </span>
              ) : (
                <span>
                  {t("password.filterResults", {
                    count: filteredEntries.length,
                  })}
                  {searchQuery &&
                    t("password.searchInFilter", { query: searchQuery })}
                </span>
              )}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* 密码网格 */}
        {isLoading ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              >
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {entries.length > 0 ? (
              <motion.div
                key="passwords"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
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
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  whileHover={{
                    scale: 1.1,
                    rotate: 5,
                    transition: { duration: 0.2 },
                  }}
                >
                  <motion.svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </motion.svg>
                </motion.div>

                <motion.h2
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {t("password.welcomeTitle")}
                </motion.h2>

                <motion.p
                  className="text-gray-600 dark:text-gray-400 mb-8 max-w-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {t("password.welcomeDescription")}
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <motion.button
                    onClick={() => setShowQuickImportExport("import")}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {t("password.importExisting")}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* 弹窗组件 */}
        <AnimatePresence>
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
        </AnimatePresence>
      </motion.main>
    </>
  );
}
