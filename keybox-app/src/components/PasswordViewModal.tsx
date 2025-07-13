"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Eye,
  EyeOff,
  Edit3,
  ExternalLink,
  Calendar,
  Tag,
  Star,
  Check,
  X,
} from "lucide-react";
import { PasswordEntry, Category } from "@/types/password";

interface PasswordViewModalProps {
  isOpen: boolean;
  entry: PasswordEntry | null;
  categories: Category[];
  onClose: () => void;
}

export default function PasswordViewModal({
  isOpen,
  entry,
  categories,
  onClose,
}: PasswordViewModalProps) {
  const [showPasswords, setShowPasswords] = useState<{
    [key: string]: boolean;
  }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen || !entry) return null;

  // 获取类目信息
  const category = categories.find((cat) => cat.id === entry.categoryId);

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

  // 渲染自定义字段
  const renderCustomField = (field: any) => {
    const fieldId = `field-${field.id}`;
    const isPassword = field.type === "password";

    return (
      <div
        key={field.id}
        className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg p-3 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {field.name}
          </span>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {field.value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(field.value, field.name)}
                className="h-6 w-6 p-0"
                title="复制"
              >
                {copiedField === field.name ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            )}
            {isPassword && field.value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePasswordVisibility(fieldId)}
                className="h-6 w-6 p-0"
                title={showPasswords[fieldId] ? "隐藏" : "显示"}
              >
                {showPasswords[fieldId] ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center min-h-[24px]">
          {field.value ? (
            <span
              className={`text-sm text-gray-900 dark:text-white break-all ${
                isPassword ? "font-mono" : ""
              } ${field.type === "textarea" ? "whitespace-pre-wrap" : ""}`}
            >
              {isPassword && !showPasswords[fieldId]
                ? "••••••••••••"
                : field.value}
            </span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500 italic">
              无内容
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {/* 网站图标 */}
              <div className="flex-shrink-0 w-10 h-10">
                {entry.website && getWebsiteFavicon(entry.website) ? (
                  <img
                    src={getWebsiteFavicon(entry.website)!}
                    alt=""
                    className="w-10 h-10 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  {entry.title}
                  {entry.isFavorite && (
                    <Star className="w-5 h-5 text-yellow-500 ml-2 fill-current" />
                  )}
                </h2>
                {category && (
                  <div className="flex items-center mt-1">
                    <span className="text-lg mr-1">{category.icon}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {category.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/manage?id=${entry.id}`);
                  onClose();
                }}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                编辑
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 基本信息 */}
          {(entry.website || entry.username || entry.description) && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">基本信息</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {entry.website && (
                  <div className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg p-3 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        网站地址
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(entry.website!, "网站地址")
                          }
                          className="h-6 w-6 p-0"
                          title="复制"
                        >
                          {copiedField === "网站地址" ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
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
                          className="h-6 w-6 p-0"
                          title="访问网站"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center min-h-[24px]">
                      <span className="text-sm text-blue-600 dark:text-blue-400 break-all">
                        {entry.website}
                      </span>
                    </div>
                  </div>
                )}

                {entry.username && (
                  <div className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg p-3 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        用户名
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(entry.username!, "用户名")
                          }
                          className="h-6 w-6 p-0"
                          title="复制"
                        >
                          {copiedField === "用户名" ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center min-h-[24px]">
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {entry.username}
                      </span>
                    </div>
                  </div>
                )}

                {entry.description && (
                  <div className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg p-3 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        描述
                      </span>
                    </div>
                    <div className="flex items-center min-h-[24px]">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {entry.description}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 自定义字段 */}
          {entry.customFields && entry.customFields.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">详细信息</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {entry.customFields.map(renderCustomField)}
              </CardContent>
            </Card>
          )}

          {/* 标签和备注 */}
          {((entry.tags && entry.tags.length > 0) || entry.notes) && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">附加信息</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {entry.tags && entry.tags.length > 0 && (
                  <div className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg p-3 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center">
                        <Tag className="w-3 h-3 mr-1" />
                        标签
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {entry.notes && (
                  <div className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg p-3 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        备注
                      </span>
                    </div>
                    <div className="flex items-start min-h-[24px]">
                      <span className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {entry.notes}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 元数据 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">元数据</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg p-3 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      创建时间
                    </span>
                  </div>
                  <div className="flex items-center min-h-[24px]">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg p-3 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      更新时间
                    </span>
                  </div>
                  <div className="flex items-center min-h-[24px]">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(entry.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
