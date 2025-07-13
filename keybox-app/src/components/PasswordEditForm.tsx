"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { PasswordEntry, Category, CustomField } from "@/types/password";
import CategorySelector from "./CategorySelector";
import PasswordGeneratorModal from "./PasswordGeneratorModal";

interface PasswordEditFormProps {
  entry: PasswordEntry;
  categories: Category[];
  onSave: (entry: PasswordEntry) => void;
  onDelete: () => void;
  isCreatingNew?: boolean;
}

export default function PasswordEditForm({
  entry,
  categories,
  onSave,
  onDelete,
  isCreatingNew = false,
}: PasswordEditFormProps) {
  const [formData, setFormData] = useState({
    title: entry.title || "",
    categoryId: entry.categoryId || "",
    customFields: entry.customFields || [],
    tags: entry.tags || [],
    isFavorite: entry.isFavorite || false,
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

  // 监听表单变化
  useEffect(() => {
    const hasFormChanges =
      formData.title !== entry.title ||
      formData.categoryId !== entry.categoryId ||
      formData.isFavorite !== entry.isFavorite ||
      JSON.stringify(formData.customFields) !==
        JSON.stringify(entry.customFields) ||
      JSON.stringify(formData.tags) !== JSON.stringify(entry.tags);

    setHasChanges(hasFormChanges);
  }, [formData, entry]);

  // 根据类目字段生成 customFields
  const generateCustomFieldsFromCategory = (
    category: Category | undefined,
    existingFields: CustomField[] = []
  ) => {
    if (!category) return [];

    // 只生成新类目的字段，保留已有值
    const newFields = category.fields.map((categoryField) => {
      const existingField = existingFields.find(
        (field) => field.name === categoryField.name
      );

      return {
        id: existingField?.id || categoryField.id,
        name: categoryField.name,
        value: existingField?.value || "",
        type: categoryField.type,
        isRequired: categoryField.isRequired,
        placeholder: categoryField.placeholder,
      } as CustomField;
    });

    return newFields;
  };

  // 当选中的条目变化时，重置表单
  useEffect(() => {
    setFormData({
      title: entry.title || "",
      categoryId: entry.categoryId || "",
      customFields: entry.customFields || [],
      tags: entry.tags || [],
      isFavorite: entry.isFavorite || false,
    });
    setHasChanges(false);
    setShowPasswords({});
  }, [entry.id]);

  // 当类目变化时，更新 customFields
  useEffect(() => {
    const selectedCategory = categories.find(
      (cat) => cat.id === formData.categoryId
    );
    if (selectedCategory) {
      setFormData((prev) => ({
        ...prev,
        customFields: generateCustomFieldsFromCategory(
          selectedCategory,
          prev.customFields
        ),
      }));
    }
  }, [formData.categoryId, categories]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      console.log(`${fieldName} 已复制到剪贴板`);
    } catch (err) {
      console.error("复制失败:", err);
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

  const handleSave = () => {
    const now = new Date().toISOString();
    const updatedEntry: PasswordEntry = {
      ...entry,
      ...formData,
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

    onSave(updatedEntry);
  };

  const renderDynamicField = (field: CustomField) => {
    const fieldId = `field-${field.id}`;

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label
              htmlFor={fieldId}
              className="flex items-center justify-between"
            >
              <span>
                {field.name}{" "}
                {field.isRequired && <span className="text-red-500">*</span>}
              </span>
              {field.value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(field.value, field.name)}
                  className="h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </Label>
            <Textarea
              id={fieldId}
              value={field.value || ""}
              onChange={(e) => updateCustomField(field.id, e.target.value)}
              placeholder={field.placeholder || `输入${field.name}`}
              required={field.isRequired}
              rows={3}
            />
          </div>
        );

      case "password":
        return (
          <div key={field.id} className="space-y-2">
            <Label
              htmlFor={fieldId}
              className="flex items-center justify-between"
            >
              <span>
                {field.name}{" "}
                {field.isRequired && <span className="text-red-500">*</span>}
              </span>
              {field.value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(field.value, field.name)}
                  className="h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id={fieldId}
                  type={showPasswords[field.id] ? "text" : "password"}
                  value={field.value || ""}
                  onChange={(e) => updateCustomField(field.id, e.target.value)}
                  placeholder={field.placeholder || `输入${field.name}`}
                  required={field.isRequired}
                  className="pr-10 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
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
          <div key={field.id} className="space-y-2">
            <Label
              htmlFor={fieldId}
              className="flex items-center justify-between"
            >
              <span>
                {field.name}{" "}
                {field.isRequired && <span className="text-red-500">*</span>}
              </span>
              {field.value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(field.value, field.name)}
                  className="h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </Label>
            <Input
              id={fieldId}
              type={field.type}
              value={field.value || ""}
              onChange={(e) => updateCustomField(field.id, e.target.value)}
              placeholder={field.placeholder || `输入${field.name}`}
              required={field.isRequired}
            />
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "未知时间";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "无效日期";
      return date.toLocaleString("zh-CN");
    } catch (error) {
      return "日期错误";
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">
              {isCreatingNew ? "创建新密码" : entry.title}
            </h2>
            {!isCreatingNew && (
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
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              {isCreatingNew ? "取消" : "删除"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges && !isCreatingNew}
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreatingNew ? "创建" : "保存"}
            </Button>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>创建：{formatDate(entry.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>更新：{formatDate(entry.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="输入标题"
                  required
                />
              </div>

              {/* 类目选择 */}
              <div className="space-y-2">
                <Label>类目 *</Label>
                <CategorySelector
                  categories={categories}
                  selectedCategory={formData.categoryId}
                  onSelect={(categoryId) =>
                    handleInputChange("categoryId", categoryId || "")
                  }
                  showAll={false}
                />
              </div>

              {/* 动态字段 */}
              {formData.customFields?.map(renderDynamicField)}

              {/* 标签 */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <Tag className="w-3 h-3" />
                  <span>标签</span>
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
                    placeholder="添加标签"
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    添加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
