"use client";

import { useState } from "react";
import { Category, PasswordEntry } from "@/types/password";
import { ChevronDown, Filter, X } from "lucide-react";

interface CategoryFilterProps {
  categories: Category[];
  entries: PasswordEntry[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategoryFilter({
  categories,
  entries,
  selectedCategoryId,
  onCategoryChange,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 获取有密码条目的类目
  const categoriesWithEntries = categories.filter((category) =>
    entries.some((entry) => entry.categoryId === category.id)
  );

  // 计算每个类目的条目数量
  const getCategoryCount = (categoryId: string) => {
    return entries.filter((entry) => entry.categoryId === categoryId).length;
  };

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setIsOpen(false);
  };

  const clearFilter = () => {
    onCategoryChange("all");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 筛选按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
          selectedCategoryId === "all"
            ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            : "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">
          {selectedCategoryId === "all"
            ? "所有类目"
            : selectedCategory?.name || "未知类目"}
        </span>
        {selectedCategoryId !== "all" && (
          <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
            {getCategoryCount(selectedCategoryId)}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉内容 */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {/* 全部选项 */}
            <button
              onClick={() => handleCategorySelect("all")}
              className={`cursor-pointer w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedCategoryId === "all"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="font-medium">所有类目</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {entries.length}
              </span>
            </button>

            {/* 分割线 */}
            {categoriesWithEntries.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            )}

            {/* 类目选项 */}
            {categoriesWithEntries.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`cursor-pointer w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedCategoryId === category.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getCategoryCount(category.id)}
                </span>
              </button>
            ))}

            {/* 无类目提示 */}
            {categoriesWithEntries.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无可筛选的类目</p>
                <p className="text-xs mt-1">添加密码条目后即可按类目筛选</p>
              </div>
            )}

            {/* 清除筛选 */}
            {selectedCategoryId !== "all" && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={clearFilter}
                  className="cursor-pointer w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">清除筛选</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
