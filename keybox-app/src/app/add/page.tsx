"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Eye, EyeOff, RefreshCw } from "lucide-react";
import { PasswordEntry, Category, CustomField } from "@/types/password";
import { StorageManager } from "@/utils/storage";
import CategorySelector from "@/components/CategorySelector";
import PasswordGeneratorModal from "@/components/PasswordGeneratorModal";
import toast from "react-hot-toast";

const STORAGE_KEY = "keybox_draft_entry";

export default function AddPasswordPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);

  // 智能返回函数
  const handleGoBack = () => {
    // 检查是否有历史记录
    if (window.history.length > 1) {
      router.back();
    } else {
      // 如果没有历史记录，跳转到首页
      router.push("/");
    }
  };
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
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [currentPasswordFieldId, setCurrentPasswordFieldId] = useState<
    string | null
  >(null);

  // 加载类目数据
  useEffect(() => {
    const loadedData = StorageManager.loadFromLocalStorage();
    setCategories(loadedData.categories);

    // 设置默认类目
    if (loadedData.categories.length > 0 && !formData.categoryId) {
      setFormData((prev) => ({
        ...prev,
        categoryId: loadedData.categories[0].id,
        customFields: generateCustomFieldsFromCategory(
          loadedData.categories[0]
        ),
      }));
    }
  }, []);

  // 从本地存储加载草稿
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, []);

  // 保存草稿到本地存储
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }, 1000); // 1秒后保存

    return () => clearTimeout(timer);
  }, [formData]);

  // 根据类目字段生成 customFields
  const generateCustomFieldsFromCategory = (
    category: Category | undefined,
    existingFields: CustomField[] = []
  ) => {
    if (!category) return [];

    return category.fields.map((categoryField) => {
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
  };

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
    if (!formData.title.trim()) {
      toast.error(t("password.pleaseEnterTitle"));
      return;
    }

    const now = new Date().toISOString();
    const newEntry: PasswordEntry = {
      ...formData,
      id: StorageManager.generateId(),
      description: "", // 可以从 customFields 中提取或单独添加
      notes: "", // 可以从 customFields 中提取或单独添加
      username: "", // 可以从 customFields 中提取
      password: "", // 可以从 customFields 中提取
      website: "", // 可以从 customFields 中提取
      createdAt: now,
      updatedAt: now,
    };

    // 从 customFields 中提取常用字段
    formData.customFields.forEach((field) => {
      switch (field.name.toLowerCase()) {
        case "用户名":
        case "username":
          newEntry.username = field.value;
          break;
        case "密码":
        case "password":
          newEntry.password = field.value;
          break;
        case "网站地址":
        case "website":
        case "url":
          newEntry.website = field.value;
          break;
        case "备注":
        case "notes":
          newEntry.notes = field.value;
          break;
        case "描述":
        case "description":
          newEntry.description = field.value;
          break;
      }
    });

    // 保存到存储
    const loadedData = StorageManager.loadFromLocalStorage();
    const updatedEntries = [...loadedData.entries, newEntry];
    StorageManager.saveToLocalStorage(updatedEntries, loadedData.categories);

    // 清除草稿
    localStorage.removeItem(STORAGE_KEY);

    // 返回上一页
    handleGoBack();
  };

  const handleCancel = () => {
    if (confirm(t("password.confirmCancel"))) {
      localStorage.removeItem(STORAGE_KEY);
      handleGoBack();
    }
  };

  const clearDraft = () => {
    if (confirm(t("password.confirmClear"))) {
      localStorage.removeItem(STORAGE_KEY);
      setFormData({
        title: "",
        categoryId: categories.length > 0 ? categories[0].id : "",
        customFields:
          categories.length > 0
            ? generateCustomFieldsFromCategory(categories[0])
            : [],
        tags: [],
        isFavorite: false,
      });
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
              placeholder={
                field.placeholder ||
                t("password.enterField", { field: field.name })
              }
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
                  placeholder={
                    field.placeholder ||
                    t("password.enterField", { field: field.name })
                  }
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
            <Label htmlFor={fieldId}>
              {field.name}{" "}
              {field.isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type}
              value={field.value}
              onChange={(e) => updateCustomField(field.id, e.target.value)}
              placeholder={
                field.placeholder ||
                t("password.enterField", { field: field.name })
              }
              required={field.isRequired}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
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
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  KeyBox
                </span>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => (window.location.href = "/")}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  {t("password.home")}
                </button>
                <button
                  onClick={() => (window.location.href = "/passwords")}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  {t("password.passwordList")}
                </button>
                <button
                  onClick={() => (window.location.href = "/manage")}
                  className="cursor-pointer px-3 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg"
                >
                  {t("password.addPassword")}
                </button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("password.back")}
              </Button>
              <Button variant="outline" size="sm" onClick={clearDraft}>
                {t("password.clear")}
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {t("password.save")}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("password.basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("password.titleRequired")}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={t("password.titlePlaceholder")}
                required
              />
            </div>

            {/* 类目选择 */}
            <div className="space-y-2">
              <Label>{t("password.categoryRequired")}</Label>
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
              <Label>{t("password.tagsLabel")}</Label>
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
                  placeholder={t("password.addTagPlaceholder")}
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
