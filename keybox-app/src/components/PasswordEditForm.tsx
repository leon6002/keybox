"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Copy,
  Star,
  StarOff,
  Calendar,
  Tag,
  Shield,
  Globe,
  User,
  Lock,
  FileText,
  Heart,
  Sparkles,
} from "lucide-react";
import { PasswordEntry, Folder, CustomField } from "@/types/password";
import FolderSelector from "./FolderSelector";
import PasswordGeneratorModal from "./PasswordGeneratorModal";
import { useTranslation } from "react-i18next";
import { FolderManager } from "@/utils/folders";
import { PasswordTypeManager } from "@/utils/PasswordTypes";

interface PasswordEditFormProps {
  entry: PasswordEntry;
  folders: Folder[];
  onSave: (entry: PasswordEntry) => void;
  onDelete: () => void;
  onCreateFolder?: (folderName: string) => void;
  isDeleting?: boolean; // Loading state for delete operation
}

export default function PasswordEditForm({
  entry,
  folders,
  onSave,
  onDelete,
  onCreateFolder,
  isDeleting = false,
}: PasswordEditFormProps) {
  console.log("rendering PasswordEditForm ");
  const { t } = useTranslation();
  const [formData, setFormData] = useState(() => {
    console.log("initing password form: ", entry);
    return {
      title: entry.title || "",
      folderId: entry.folderId || FolderManager.getDefaultFolderId(),
      customFields:
        entry.customFields || PasswordTypeManager.getDefaultFields(),
      tags: entry.tags || [],
      isFavorite: entry.isFavorite || false,
      passwordType: entry.passwordType || "website",
    };
  });
  const [showPasswords, setShowPasswords] = useState<{
    [key: string]: boolean;
  }>({});
  const [tagInput, setTagInput] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [currentPasswordFieldId, setCurrentPasswordFieldId] = useState<
    string | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);

  // 使用 useMemo 来计算是否有变化，避免无限循环
  const hasFormChanges = useMemo(() => {
    // For existing entries, compare with original values
    return (
      formData.title !== (entry.title || "") ||
      formData.folderId !== (entry.folderId || "") ||
      formData.isFavorite !== (entry.isFavorite || false) ||
      JSON.stringify(formData.customFields) !==
        JSON.stringify(entry.customFields || []) ||
      JSON.stringify(formData.tags) !== JSON.stringify(entry.tags || [])
    );
  }, [
    formData.title,
    formData.folderId,
    formData.isFavorite,
    formData.customFields,
    formData.tags,
    entry.title,
    entry.folderId,
    entry.isFavorite,
    entry.customFields,
    entry.tags,
  ]);

  // 监听表单变化
  useEffect(() => {
    setHasChanges(hasFormChanges);
  }, [hasFormChanges]);

  // 创建一个稳定的 entry 标识符，只有真正变化时才会改变
  const entrySignature = useMemo(() => {
    return {
      id: entry.id,
      title: entry.title,
      folderId: entry.folderId,
      isFavorite: entry.isFavorite,
      customFieldsHash: JSON.stringify(entry.customFields || []),
      tagsHash: JSON.stringify(entry.tags || []),
    };
  }, [
    entry.id,
    entry.title,
    entry.folderId,
    entry.isFavorite,
    entry.customFields,
    entry.tags,
  ]);

  // reset form when selected entry changes
  useEffect(() => {
    const customFields = JSON.parse(entrySignature.customFieldsHash);
    setFormData({
      title: entrySignature.title || "",
      folderId: entrySignature.folderId || FolderManager.getDefaultFolderId(),
      customFields: customFields || PasswordTypeManager.getDefaultFields(),
      tags: JSON.parse(entrySignature.tagsHash),
      isFavorite: entrySignature.isFavorite || false,
      passwordType: entry.passwordType || "website",
    });
    setHasChanges(false);
    setShowPasswords({});
  }, [entrySignature, entry.passwordType]);

  // Ensure custom fields are properly initialized based on password type
  useEffect(() => {
    // For new entries, always initialize fields based on password type
    if (!formData.customFields || formData.customFields.length === 0) {
      const fieldsForType = PasswordTypeManager.getFieldsForType(
        formData.passwordType
      );
      if (fieldsForType.length > 0) {
        setFormData((prev) => ({
          ...prev,
          customFields: fieldsForType,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.passwordType]); // Run when password type changes or when creating new

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Password type definitions
  const getPasswordTypes = () => [
    { id: "website", name: "Website", icon: "🌐" },
    { id: "banking", name: "Banking", icon: "🏦" },
    { id: "credit-card", name: "Credit Card", icon: "💳" },
    { id: "social", name: "Social Media", icon: "👥" },
    { id: "email", name: "Email", icon: "📧" },
    { id: "database", name: "Database", icon: "🗄️" },
    { id: "server", name: "Server", icon: "🖥️" },
    { id: "wifi", name: "WiFi", icon: "📶" },
    { id: "software", name: "Software", icon: "💿" },
    { id: "other", name: "Other", icon: "🔧" },
  ];

  // Handle type change
  const handleTypeChange = (typeId: string) => {
    const newFields = PasswordTypeManager.getFieldsForType(typeId);

    // Preserve existing field values when changing types
    const mergedFields = newFields.map((newField) => {
      const existingField = formData.customFields.find(
        (f) => f.id === newField.id
      );
      return {
        ...newField,
        value: existingField?.value || newField.value || "",
      };
    });

    setFormData((prev) => ({
      ...prev,
      passwordType: typeId,
      customFields: mergedFields,
    }));
  };

  const updateCustomField = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.map((field) =>
        field.id === id ? { ...field, value } : field
      ),
    }));
  };

  const togglePasswordVisibility = (fieldId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 这里可以添加 toast 通知
      console.log(`${fieldName} Copied`);
    } catch (err) {
      console.error(t("password.copyFailed"), err);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange("tags", [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handlePasswordGenerated = (password: string) => {
    if (currentPasswordFieldId) {
      updateCustomField(currentPasswordFieldId, password);
    }
    setShowPasswordGenerator(false);
    setCurrentPasswordFieldId(null);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Add a small delay for smooth animation
      await new Promise((resolve) => setTimeout(resolve, 100));

      const now = new Date().toISOString();

      // Clean up orphaned folder references
      const cleanedFormData =
        formData.folderId &&
        folders &&
        !folders.find((f) => f.id === formData.folderId)
          ? {
              ...formData,
              folderId: folders[0]?.id || "", // Use first available folder
              categoryId: folders[0]?.id || "",
            }
          : formData;

      if (cleanedFormData !== formData) {
        console.warn(
          `🧹 Cleaning up orphaned folder reference: ${formData.folderId}`
        );
      }

      const updatedEntry: PasswordEntry = {
        ...entry,
        ...cleanedFormData,
        updatedAt: now,
      };

      // 从 customFields 中提取常用字段
      formData.customFields.forEach((field) => {
        switch (field.name.toLowerCase()) {
          case "用户名":
          case "username":
            updatedEntry.username = field.value;
            break;
          case "密码":
          case "password":
            updatedEntry.password = field.value;
            break;
          case "网站地址":
          case "website":
          case "url":
            updatedEntry.website = field.value;
            break;
          case "备注":
          case "notes":
            updatedEntry.notes = field.value;
            break;
          case "描述":
          case "description":
            updatedEntry.description = field.value;
            break;
        }
      });

      await onSave(updatedEntry);
    } finally {
      setIsSaving(false);
    }
  };

  const renderDynamicField = (field: CustomField) => {
    const fieldId = `field-${field.id}`;

    // Get field icon based on type
    const getFieldIcon = () => {
      switch (field.type) {
        case "password":
          return <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />;
        case "email":
          return <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
        case "url":
          return (
            <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
          );
        case "textarea":
          return (
            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          );
        default:
          return <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      }
    };

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-4 col-span-full">
            <div className="flex items-center justify-between min-h-[32px]">
              <div className="flex items-center space-x-2">
                {getFieldIcon()}
                <Label
                  htmlFor={fieldId}
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  {field.name}{" "}
                  {field.isRequired && <span className="text-red-500">*</span>}
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(field.value, field.name)}
                className={`h-8 px-3 rounded-lg transition-all duration-200 ${
                  field.value
                    ? "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="relative">
              <Textarea
                id={fieldId}
                value={field.value || ""}
                onChange={(e) => updateCustomField(field.id, e.target.value)}
                placeholder={
                  field.placeholder || `Enter ${field.name.toLowerCase()}...`
                }
                required={field.isRequired}
                rows={3}
                className="bg-white/50 dark:bg-gray-900/50 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 hover:bg-white dark:hover:bg-gray-900"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-indigo-500/5 pointer-events-none" />
            </div>
          </div>
        );

      case "password":
        return (
          <div key={field.id} className="space-y-3">
            <div className="flex items-center justify-between min-h-[32px]">
              <div className="flex items-center space-x-2">
                {getFieldIcon()}
                <Label
                  htmlFor={fieldId}
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  {field.name}{" "}
                  {field.isRequired && <span className="text-red-500">*</span>}
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(field.value, field.name)}
                className={`h-8 px-3 rounded-lg transition-all duration-200 ${
                  field.value
                    ? "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="flex space-x-3">
              <div className="relative flex-1">
                <Input
                  id={fieldId}
                  type={showPasswords[field.id] ? "text" : "password"}
                  value={field.value || ""}
                  onChange={(e) => updateCustomField(field.id, e.target.value)}
                  placeholder={
                    field.placeholder || `Enter ${field.name.toLowerCase()}...`
                  }
                  required={field.isRequired}
                  className="h-12 pr-12 font-mono bg-white/50 dark:bg-gray-900/50 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 hover:bg-white dark:hover:bg-gray-900"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => togglePasswordVisibility(field.id)}
                >
                  {showPasswords[field.id] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPasswordFieldId(field.id);
                  setShowPasswordGenerator(true);
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-3">
            <div className="flex items-center justify-between min-h-[32px]">
              <div className="flex items-center space-x-2">
                {getFieldIcon()}
                <Label
                  htmlFor={fieldId}
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  {field.name}{" "}
                  {field.isRequired && <span className="text-red-500">*</span>}
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(field.value, field.name)}
                className={`h-8 px-3 rounded-lg transition-all duration-200 ${
                  field.value
                    ? "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="relative">
              <Input
                id={fieldId}
                type={field.type}
                value={field.value || ""}
                onChange={(e) => updateCustomField(field.id, e.target.value)}
                placeholder={
                  field.placeholder || `Enter ${field.name.toLowerCase()}...`
                }
                required={field.isRequired}
                className="h-12 bg-white/50 dark:bg-gray-900/50 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 hover:bg-white dark:hover:bg-gray-900"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-green-500/5 pointer-events-none" />
            </div>
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t("password.unknownTime");
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t("password.invalidDate");
      return date.toLocaleString("zh-CN");
    } catch {
      return t("password.dateError");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">{entry.title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleInputChange("isFavorite", !formData.isFavorite)
              }
              className={formData.isFavorite ? "text-yellow-500" : ""}
            >
              {formData.isFavorite ? (
                <Star className="w-4 h-4 fill-current" />
              ) : (
                <StarOff className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="relative overflow-hidden"
            >
              <motion.div
                className="flex items-center"
                animate={isDeleting ? { scale: 0.95 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isDeleting ? (
                  <motion.div
                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {isDeleting ? "Deleting..." : t("common.delete")}
              </motion.div>
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="relative overflow-hidden"
            >
              <motion.div
                className="flex items-center"
                animate={isSaving ? { scale: 0.95 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isSaving ? (
                  <motion.div
                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? "Saving..." : t("common.save")}
              </motion.div>
            </Button>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>
              {t("password.created")}：{formatDate(entry.createdAt)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>
              {t("password.updated")}：{formatDate(entry.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50/50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-950/30">
        <motion.div
          className="max-w-5xl mx-auto p-8 space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Header Section */}
          <motion.div
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Edit Password
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Update your password information
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Title Field */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <Label
                    htmlFor="title"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Title <span className="text-red-500">*</span>
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter a descriptive title..."
                    required
                    className="h-12 pl-4 pr-4 bg-white/50 dark:bg-gray-900/50 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 hover:bg-white dark:hover:bg-gray-900"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
                </div>
              </motion.div>

              {/* Favorite Toggle */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Favorite
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange("isFavorite", !formData.isFavorite)
                  }
                  className={`h-12 px-6 rounded-xl border-2 transition-all duration-200 flex items-center space-x-3 w-full ${
                    formData.isFavorite
                      ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300"
                      : "border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:border-pink-300 dark:hover:border-pink-600"
                  }`}
                >
                  {formData.isFavorite ? (
                    <Star className="w-5 h-5 fill-current" />
                  ) : (
                    <StarOff className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    {formData.isFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"}
                  </span>
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* Folder Selection */}
          <motion.div
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Folder
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Choose a folder to organize this password
                </p>
              </div>
            </div>

            {/* Check for orphaned folder reference */}
            {/* {formData.folderId &&
              formData.folderId.trim() !== "" &&
              !folders.find((f) => f.id === formData.folderId) && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                    <span className="text-sm">
                      ⚠️ The folder for this password no longer exists. It has
                      been moved to &ldquo;
                      {folders[0]?.name || "Default"}&rdquo; folder.
                    </span>
                  </div>
                </div>
              )} */}

            <FolderSelector
              folders={folders}
              selectedFolder={
                // If folder exists, use it; otherwise fall back to first available folder
                formData.folderId &&
                folders.find((f) => f.id === formData.folderId)
                  ? formData.folderId
                  : folders[0]?.id || ""
              }
              onSelect={(folderId) => {
                handleInputChange("folderId", folderId || "");
              }}
              showAll={false}
              allowCreate={true}
              onCreateFolder={onCreateFolder}
            />
          </motion.div>

          {/* Dynamic Fields */}
          <AnimatePresence>
            (
            <motion.div
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Secure Information
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your encrypted password details
                  </p>
                </div>
              </div>

              {/* Type Selector */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2 mb-3">
                  <span>Entry Type</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {getPasswordTypes().map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeChange(type.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                        formData.passwordType === type.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-2xl">{type.icon}</div>
                        <div className="text-xs font-medium text-center">
                          <div
                            className={`${
                              formData.passwordType === type.id
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {type.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {formData.customFields?.map(renderDynamicField)}
              </div>
            </motion.div>
            )
            {/* {formData.customFields &&
              formData.customFields.filter(
                (field) =>
                  field.id !== "notes" &&
                  !field.name.toLowerCase().includes("notes") &&
                  !field.name.toLowerCase().includes("备注")
              ).length > 0 && } */}
          </AnimatePresence>

          {/* Tags and Notes */}
          <motion.div
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Additional Details
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Tags and notes for better organization
                </p>
              </div>
            </div>
            <div className="space-y-6">
              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>{t("password.tagsLabel")}</span>
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <span className="ml-1 text-muted-foreground hover:text-foreground">
                        ×
                      </span>
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={tagInput || ""}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder={t("password.addTagPlaceholder")}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    className="h-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    className="h-10 px-4"
                  >
                    {t("password.addTagButton")}
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Notes</span>
                </Label>
                <Textarea
                  value={(() => {
                    // Find notes field from customFields
                    const notesField = formData.customFields.find(
                      (field) =>
                        field.id === "notes" ||
                        field.name.toLowerCase().includes("notes") ||
                        field.name.toLowerCase().includes("备注")
                    );
                    return notesField?.value || "";
                  })()}
                  onChange={(e) => {
                    // Update notes field in customFields
                    const updatedFields = formData.customFields.map((field) => {
                      if (
                        field.id === "notes" ||
                        field.name.toLowerCase().includes("notes") ||
                        field.name.toLowerCase().includes("备注")
                      ) {
                        return { ...field, value: e.target.value };
                      }
                      return field;
                    });

                    // If no notes field exists, create one
                    const hasNotesField = formData.customFields.some(
                      (field) =>
                        field.id === "notes" ||
                        field.name.toLowerCase().includes("notes") ||
                        field.name.toLowerCase().includes("备注")
                    );

                    if (!hasNotesField) {
                      updatedFields.push({
                        id: "notes",
                        name: "Notes",
                        type: "textarea",
                        value: e.target.value,
                        isRequired: false,
                        placeholder: "Add notes here...",
                      });
                    }

                    handleInputChange("customFields", updatedFields);
                  }}
                  placeholder="Add notes, comments, or additional information..."
                  rows={4}
                  className="bg-white/50 dark:bg-gray-900/50 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 hover:bg-white dark:hover:bg-gray-900"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* 密码生成器模态框 */}
      <PasswordGeneratorModal
        isOpen={showPasswordGenerator}
        onClose={() => {
          setShowPasswordGenerator(false);
          setCurrentPasswordFieldId(null);
        }}
        onPasswordGenerated={handlePasswordGenerated}
      />
    </div>
  );
}
