"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react";
import { PasswordEntry, Category, CustomField } from "@/types/password";
import { StorageManager } from "@/utils/storage";
import CategorySelector from "@/components/CategorySelector";

const STORAGE_KEY_PREFIX = "keybox_draft_edit_";

export default function EditPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [originalEntry, setOriginalEntry] = useState<PasswordEntry | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    customFields: [] as CustomField[],
    tags: [] as string[],
    isFavorite: false,
  });
  const [showPasswords, setShowPasswords] = useState<{
    [key: string]: boolean;
  }>({});
  const [tagInput, setTagInput] = useState("");

  const storageKey = `${STORAGE_KEY_PREFIX}${entryId}`;

  // 加载数据
  useEffect(() => {
    const loadedData = StorageManager.loadFromLocalStorage();
    setCategories(loadedData.categories);

    // 查找要编辑的条目
    const entry = loadedData.entries.find((e) => e.id === entryId);
    if (!entry) {
      router.push("/");
      return;
    }

    setOriginalEntry(entry);

    // 从草稿或原始条目加载数据
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
      } catch (error) {
        console.error("Failed to load draft:", error);
        loadFromOriginalEntry(entry);
      }
    } else {
      loadFromOriginalEntry(entry);
    }
  }, [entryId, router, storageKey]);

  const loadFromOriginalEntry = (entry: PasswordEntry) => {
    setFormData({
      title: entry.title,
      categoryId: entry.categoryId,
      customFields: entry.customFields,
      tags: entry.tags,
      isFavorite: entry.isFavorite,
    });
  };

  // 保存草稿
  useEffect(() => {
    if (originalEntry) {
      const timer = setTimeout(() => {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [formData, storageKey, originalEntry]);

  // 根据类目字段生成 customFields
  const generateCustomFieldsFromCategory = (
    category: Category | undefined,
    existingFields: CustomField[] = []
  ) => {
    if (!category) return existingFields;

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

    // 保留不在新类目中的现有字段
    const preservedFields = existingFields.filter(
      (field) =>
        !category.fields.some((catField) => catField.name === field.name)
    );

    return [...newFields, ...preservedFields];
  };

  // 当类目变化时，更新 customFields
  useEffect(() => {
    const selectedCategory = categories.find(
      (cat) => cat.id === formData.categoryId
    );
    if (selectedCategory && originalEntry) {
      setFormData((prev) => ({
        ...prev,
        customFields: generateCustomFieldsFromCategory(
          selectedCategory,
          prev.customFields
        ),
      }));
    }
  }, [formData.categoryId, categories, originalEntry]);

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

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert("请输入标题");
      return;
    }

    if (!originalEntry) return;

    const now = new Date().toISOString();
    const updatedEntry: PasswordEntry = {
      ...originalEntry,
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

    // 保存到存储
    const loadedData = StorageManager.loadFromLocalStorage();
    const updatedEntries = loadedData.entries.map((entry) =>
      entry.id === entryId ? updatedEntry : entry
    );
    StorageManager.saveToLocalStorage(updatedEntries, loadedData.categories);

    // 清除草稿
    localStorage.removeItem(storageKey);

    // 返回主页
    router.push("/");
  };

  const handleDelete = () => {
    if (confirm("确定要删除这个密码条目吗？此操作无法撤销。")) {
      const loadedData = StorageManager.loadFromLocalStorage();
      const updatedEntries = loadedData.entries.filter(
        (entry) => entry.id !== entryId
      );
      StorageManager.saveToLocalStorage(updatedEntries, loadedData.categories);

      // 清除草稿
      localStorage.removeItem(storageKey);

      // 返回主页
      router.push("/");
    }
  };

  const handleCancel = () => {
    if (confirm("确定要取消吗？未保存的更改将丢失。")) {
      localStorage.removeItem(storageKey);
      router.push("/");
    }
  };

  const resetToOriginal = () => {
    if (originalEntry && confirm("确定要重置到原始状态吗？所有更改将丢失。")) {
      loadFromOriginalEntry(originalEntry);
      localStorage.removeItem(storageKey);
    }
  };

  const renderDynamicField = (field: CustomField) => {
    const fieldId = `field-${field.id}`;

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.name}{" "}
              {field.isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={field.value}
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
            <Label htmlFor={fieldId}>
              {field.name}{" "}
              {field.isRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id={fieldId}
                  type={showPasswords[field.id] ? "text" : "password"}
                  value={field.value}
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
                  const generatedPassword = "GeneratedPassword123!";
                  updateCustomField(field.id, generatedPassword);
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
            <Label htmlFor={fieldId}>
              {field.name}{" "}
              {field.isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type}
              value={field.value}
              onChange={(e) => updateCustomField(field.id, e.target.value)}
              placeholder={field.placeholder || `输入${field.name}`}
              required={field.isRequired}
            />
          </div>
        );
    }
  };

  if (!originalEntry) {
    return <div>加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
              <h1 className="text-xl font-semibold">编辑密码</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={resetToOriginal}>
                重置
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>编辑信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
            {formData.customFields.map((field) => renderDynamicField(field))}

            {/* 标签 */}
            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="cursor-pointer ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="添加标签"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
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
  );
}
