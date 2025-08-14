"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordEntry, Folder } from "@/types/password";
import { SearchEngine } from "@/utils/search";
import { useConfirm } from "@/hooks/useConfirm";

interface PasswordCardProps {
  entry: PasswordEntry;
  folders: Folder[];
  searchQuery: string;
  onDelete: (id: string) => void;
  onView: (entry: PasswordEntry) => void;
  viewMode: "grid" | "list";
}

export default function PasswordCard({
  entry,
  folders,
  searchQuery,
  onDelete,
  onView,
  viewMode,
}: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();

  // 获取条目对应的类目信息
  const category = folders.find((folder) => folder.id === entry.folderId);

  // 从 customFields 中提取用户名和密码（如果直接属性为空）
  const getFieldValue = (fieldNames: string[]) => {
    for (const fieldName of fieldNames) {
      const field = entry.customFields.find(
        (f) => f.name.toLowerCase() === fieldName.toLowerCase()
      );
      if (field && field.value) {
        return field.value;
      }
    }
    return "";
  };

  const displayUsername =
    entry.username || getFieldValue(["用户名", "username", "邮箱", "email"]);
  const displayPassword = entry.password || getFieldValue(["密码", "password"]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(type);
      // 2秒后清除复制状态
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getWebsiteFavicon = (url: string) => {
    try {
      const domain = new URL(url.startsWith("http") ? url : `https://${url}`)
        .hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    return SearchEngine.highlightText(text, searchQuery);
  };

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md cursor-pointer"
        onClick={() => onView(entry)}
      >
        {/* Favicon */}
        <div className="flex-shrink-0 w-10 h-10 mr-4">
          {entry.website && getWebsiteFavicon(entry.website) ? (
            <img
              src={getWebsiteFavicon(entry.website)!}
              alt=""
              className="w-8 h-8 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-medium text-gray-900 dark:text-white truncate"
                dangerouslySetInnerHTML={{ __html: highlightText(entry.title) }}
              />
              <div className="flex items-center space-x-2 mt-1 mb-2">
                {category && (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                    <span className="mr-1">{category.icon}</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {category.name}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {displayUsername && (
                  <span
                    className="text-sm text-gray-500 dark:text-gray-400 truncate"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(displayUsername),
                    }}
                  />
                )}
                {entry.website && (
                  <span
                    className="text-sm text-blue-600 dark:text-blue-400 truncate"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(entry.website),
                    }}
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {entry.isFavorite && (
                <svg
                  className="w-4 h-4 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (displayUsername)
                    copyToClipboard(displayUsername, "用户名");
                }}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 cursor-pointer"
                title="复制用户名"
              >
                {copiedField === "用户名" ? (
                  <svg
                    className="w-5 h-5 text-green-600"
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
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (displayPassword) copyToClipboard(displayPassword, "密码");
                }}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 cursor-pointer"
                title="复制密码"
              >
                {copiedField === "密码" ? (
                  <svg
                    className="w-5 h-5 text-green-600"
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
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/manage?id=${entry.id}`);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 cursor-pointer"
                title="编辑"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="relative p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-lg cursor-pointer group"
      onClick={() => onView(entry)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Favicon */}
          <div className="flex-shrink-0">
            {entry.website && getWebsiteFavicon(entry.website) ? (
              <img
                src={getWebsiteFavicon(entry.website)!}
                alt=""
                className="w-8 h-8 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-lg font-semibold text-gray-900 dark:text-white truncate"
            dangerouslySetInnerHTML={{ __html: highlightText(entry.title) }}
          />

          {/* Category */}
          {category && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                <span className="mr-1">{category.icon}</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {category.name}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Favorite Star */}
        {entry.isFavorite && (
          <svg
            className="w-5 h-5 text-yellow-500 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Username */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            用户名
          </span>
          <div className="flex items-center space-x-2">
            <span
              className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32"
              dangerouslySetInnerHTML={{
                __html: highlightText(displayUsername || ""),
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (displayUsername) copyToClipboard(displayUsername, "用户名");
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
              title="复制用户名"
            >
              {copiedField === "用户名" ? (
                <svg
                  className="w-4 h-4 text-green-600"
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
              ) : (
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">密码</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
              {showPassword ? displayPassword : "••••••••"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPassword(!showPassword);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title={showPassword ? "隐藏密码" : "显示密码"}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {showPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-6.415-6.414M14.12 14.12l4.243 4.243M14.12 14.12L18.536 18.536M14.12 14.12l6.415 6.414M4.929 4.929L19.071 19.071"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                )}
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (displayPassword) copyToClipboard(displayPassword, "密码");
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
              title="复制密码"
            >
              {copiedField === "密码" ? (
                <svg
                  className="w-4 h-4 text-green-600"
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
              ) : (
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Website */}
        {entry.website && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              网站
            </span>
            <a
              href={
                entry.website.startsWith("http")
                  ? entry.website
                  : `https://${entry.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-32"
              onClick={(e) => e.stopPropagation()}
              dangerouslySetInnerHTML={{ __html: highlightText(entry.website) }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(entry.updatedAt)}
        </span>

        {/* Action Buttons */}
        <div
          className={`flex items-center space-x-2 transition-opacity ${
            showActions ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/manage?id=${entry.id}`);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 cursor-pointer"
            title="编辑"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          <button
            onClick={async (e) => {
              e.stopPropagation();
              const confirmed = await confirm({
                title: "删除密码条目",
                description: "确定要删除这个密码条目吗？此操作无法撤销。",
                confirmText: "删除",
                cancelText: "取消",
                variant: "destructive",
              });
              if (confirmed) {
                onDelete(entry.id);
              }
            }}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 cursor-pointer"
            title="删除"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
      <ConfirmDialog />
    </div>
  );
}
