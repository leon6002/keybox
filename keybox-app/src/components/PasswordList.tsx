"use client";

import { useState } from "react";
import { PasswordEntry, Category } from "@/types/password";
// import { SearchEngine } from "@/utils/search";
import PasswordCard from "./PasswordCard";

interface PasswordListProps {
  entries: PasswordEntry[];
  categories: Category[];
  searchQuery: string;
  onDelete: (id: string) => void;
  onView: (entry: PasswordEntry) => void;
}

export default function PasswordList({
  entries,
  categories,
  searchQuery,
  onDelete,
  onView,
}: PasswordListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"title" | "createdAt" | "updatedAt">(
    "title"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 排序条目
  const sortedEntries = [...entries].sort((a, b) => {
    let aValue: string | Date;
    let bValue: string | Date;

    switch (sortBy) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case "updatedAt":
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
      default:
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // const handleSort = (field: "title" | "createdAt" | "updatedAt") => {
  //   if (sortBy === field) {
  //     setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  //   } else {
  //     setSortBy(field);
  //     setSortOrder("asc");
  //   }
  // };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {searchQuery ? "未找到匹配的密码条目" : "还没有密码条目"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {searchQuery
            ? "尝试使用不同的搜索关键词"
            : '点击"添加密码"按钮创建您的第一个密码条目'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          显示 {entries.length} 个条目
          {searchQuery && (
            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              搜索结果
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              排序:
            </span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-") as [
                  typeof sortBy,
                  typeof sortOrder
                ];
                setSortBy(field);
                setSortOrder(order);
              }}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="title-asc">标题 A-Z</option>
              <option value="title-desc">标题 Z-A</option>
              <option value="createdAt-desc">创建时间 (新到旧)</option>
              <option value="createdAt-asc">创建时间 (旧到新)</option>
              <option value="updatedAt-desc">更新时间 (新到旧)</option>
              <option value="updatedAt-asc">更新时间 (旧到新)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`cursor-pointer p-2 rounded-md transition-colors duration-200 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              title="网格视图"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`cursor-pointer p-2 rounded-md transition-colors duration-200 ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              title="列表视图"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Password Cards */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }
      >
        {sortedEntries.map((entry) => (
          <PasswordCard
            key={entry.id}
            entry={entry}
            categories={categories}
            searchQuery={searchQuery}
            onDelete={onDelete}
            onView={onView}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}
