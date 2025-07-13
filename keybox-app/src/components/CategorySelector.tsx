"use client";

import { useState } from "react";
import { Category } from "@/types/password";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
  showAll?: boolean;
}

export default function CategorySelector({
  categories,
  selectedCategory,
  onSelect,
  showAll = true,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategoryData = categories.find(
    (cat) => cat.id === selectedCategory
  );

  const handleSelect = (categoryId: string | null) => {
    onSelect(categoryId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        {selectedCategoryData ? (
          <>
            <span className="text-lg">{selectedCategoryData.icon}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedCategoryData.name}
            </span>
          </>
        ) : (
          <>
            <span className="text-lg">📁</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {showAll ? "全部类目" : "选择类目"}
            </span>
          </>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            <div className="py-1">
              {/* All Categories Option */}
              {showAll && (
                <button
                  onClick={() => handleSelect(null)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    !selectedCategory
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="text-lg">📁</span>
                  <div>
                    <div className="font-medium">全部类目</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      显示所有条目
                    </div>
                  </div>
                  {!selectedCategory && (
                    <svg
                      className="w-4 h-4 ml-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              )}

              {/* Categories */}
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSelect(category.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    selectedCategory === category.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{category.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {category.description}
                    </div>
                  </div>
                  {selectedCategory === category.id && (
                    <svg
                      className="w-4 h-4 ml-auto flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}

              {/* Empty State */}
              {categories.length === 0 && (
                <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-sm">暂无类目</div>
                  <div className="text-xs">请先创建类目</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 简化的类目筛选器（用于头部工具栏）
export function CategoryFilter({
  categories,
  selectedCategory,
  onSelect,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCategoryData = categories.find(
    (cat) => cat.id === selectedCategory
  );

  const handleSelect = (categoryId: string | null) => {
    onSelect(categoryId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
        title="筛选类目"
      >
        <span className="text-sm">
          {selectedCategoryData ? selectedCategoryData.icon : "📁"}
        </span>
        <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCategoryData ? selectedCategoryData.name : "全部"}
        </span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
            <div className="py-1">
              <button
                onClick={() => handleSelect(null)}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  !selectedCategory
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span>📁</span>
                <span>全部类目</span>
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSelect(category.id)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    selectedCategory === category.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span>{category.icon}</span>
                  <span className="truncate">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
