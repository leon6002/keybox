"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Calendar,
  Tag,
  Star,
  Check,
  X,
} from "lucide-react";
import { PasswordEntry } from "@/types/password";

interface PasswordViewModalProps {
  isOpen: boolean;
  entry: PasswordEntry | null;
  onClose: () => void;
}

export default function PasswordViewModal({
  isOpen,
  entry,
  onClose,
}: PasswordViewModalProps) {
  const [showPasswords, setShowPasswords] = useState<{
    [key: string]: boolean;
  }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen || !entry) return null;

  // 复制到剪贴板
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  // 切换密码显示
  const togglePasswordVisibility = (fieldId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
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

  // 获取网站图标
  const getWebsiteFavicon = (website: string) => {
    try {
      const url = new URL(
        website.startsWith("http") ? website : `https://${website}`
      );
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Semi-transparent backdrop - less intrusive than modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40"
            onClick={onClose}
          />

          {/* NordPass-style side panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto border-l border-gray-200 dark:border-gray-700"
          >
            {/* NordPass-style header with close button */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.push(`/manage?id=${entry.id}`);
                    onClose();
                  }}
                  className="text-sm"
                >
                  Edit
                </Button>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6">
              {/* Site info header - NordPass style */}
              <div className="text-center mb-8">
                {/* Large site icon */}
                <div className="flex justify-center mb-4">
                  {entry.website && getWebsiteFavicon(entry.website) ? (
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center p-3">
                      <img
                        src={getWebsiteFavicon(entry.website)!}
                        alt=""
                        className="w-10 h-10 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ExternalLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>

                {/* Site title */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center">
                  {entry.title}
                  {entry.isFavorite && (
                    <Star className="w-6 h-6 text-yellow-500 ml-2 fill-current" />
                  )}
                </h1>

                {/* Website URL if available */}
                {entry.website && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                    {entry.website}
                  </p>
                )}
              </div>

              {/* Basic Information - NordPass style */}
              <div className="space-y-4 mb-6">
                {/* Username field */}
                {entry.username && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Email or Username
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(entry.username!, "username")
                        }
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy username"
                      >
                        {copiedField === "username" ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="text-base font-medium text-gray-900 dark:text-white">
                      {entry.username}
                    </div>
                  </div>
                )}

                {/* Password field */}
                {entry.password && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Password
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(entry.password!, "password")
                          }
                          className="h-8 w-8 p-0"
                          title="Copy password"
                        >
                          {copiedField === "password" ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            togglePasswordVisibility("main-password")
                          }
                          className="h-8 w-8 p-0"
                          title={
                            showPasswords["main-password"] ? "Hide" : "Show"
                          }
                        >
                          {showPasswords["main-password"] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-base font-mono text-gray-900 dark:text-white">
                      {showPasswords["main-password"]
                        ? entry.password
                        : "••••••••••••"}
                    </div>
                  </div>
                )}

                {/* Website field */}
                {entry.website && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Website Address
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(entry.website!, "website")
                          }
                          className="h-8 w-8 p-0"
                          title="Copy website"
                        >
                          {copiedField === "website" ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              entry.website!.startsWith("http")
                                ? entry.website!
                                : `https://${entry.website!}`,
                              "_blank"
                            )
                          }
                          className="h-8 w-8 p-0"
                          title="Visit website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-base text-blue-600 dark:text-blue-400 break-all">
                      {entry.website}
                    </div>
                  </div>
                )}
              </div>

              {/* Description field */}
              {entry.description && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Description
                    </span>
                  </div>
                  <div className="text-base text-gray-900 dark:text-white">
                    {entry.description}
                  </div>
                </div>
              )}

              {/* Custom Fields - NordPass style */}
              {entry.customFields && entry.customFields.length > 0 && (
                <div className="space-y-4 mb-6">
                  {entry.customFields.map((field) => {
                    const fieldId = `custom-${field.id}`;
                    const isPassword = field.type === "password";

                    return (
                      <div
                        key={field.id}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {field.name}
                          </span>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {field.value && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(field.value, field.name)
                                }
                                className="h-8 w-8 p-0"
                                title="Copy"
                              >
                                {copiedField === field.name ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            {isPassword && field.value && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  togglePasswordVisibility(fieldId)
                                }
                                className="h-8 w-8 p-0"
                                title={showPasswords[fieldId] ? "Hide" : "Show"}
                              >
                                {showPasswords[fieldId] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="text-base text-gray-900 dark:text-white">
                          {field.value ? (
                            <span
                              className={`${isPassword ? "font-mono" : ""} ${
                                field.type === "textarea"
                                  ? "whitespace-pre-wrap"
                                  : ""
                              }`}
                            >
                              {isPassword && !showPasswords[fieldId]
                                ? "••••••••••••"
                                : field.value}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">
                              No content
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <Tag className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {entry.notes && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Notes
                    </span>
                  </div>
                  <div className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                    {entry.notes}
                  </div>
                </div>
              )}

              {/* Metadata - NordPass style */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      Modified
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(entry.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
