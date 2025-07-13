"use client";

import { useState, useEffect } from "react";
import { PasswordEntry, CustomField, Category } from "@/types/password";

import CategorySelector from "./CategorySelector";
import PasswordGeneratorModal from "./PasswordGeneratorModal";

interface PasswordFormProps {
  entry: PasswordEntry | null;
  categories: Category[];
  onSave: (data: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export default function PasswordForm({
  entry,
  categories,
  onSave,
  onCancel,
}: PasswordFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    categoryId: categories.length > 0 ? categories[0].id : "",
    username: "",
    password: "",
    website: "",
    description: "",
    notes: "",
    customFields: [] as CustomField[],
    tags: [] as string[],
    isFavorite: false,
  });

  // 获取当前选择的类目
  const selectedCategory = categories.find(
    (cat) => cat.id === formData.categoryId
  );

  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [currentPasswordFieldId, setCurrentPasswordFieldId] = useState<
    string | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // 根据类目字段生成 customFields
  const generateCustomFieldsFromCategory = (
    category: Category | undefined,
    existingFields: CustomField[] = []
  ) => {
    if (!category) return [];

    return category.fields.map((categoryField) => {
      // 查找是否已有对应的字段数据
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

  // 初始化表单数据
  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        categoryId: entry.categoryId,
        username: entry.username || "",
        password: entry.password || "",
        website: entry.website || "",
        description: entry.description,
        notes: entry.notes,
        customFields: entry.customFields,
        tags: entry.tags,
        isFavorite: entry.isFavorite,
      });
    } else {
      // 新建条目时，根据默认类目生成字段
      const defaultCategory = categories.length > 0 ? categories[0] : undefined;
      setFormData((prev) => ({
        ...prev,
        customFields: generateCustomFieldsFromCategory(defaultCategory),
      }));
    }
  }, [entry, categories]);

  // 当类目变化时，更新 customFields
  useEffect(() => {
    if (!entry && selectedCategory) {
      setFormData((prev) => ({
        ...prev,
        customFields: generateCustomFieldsFromCategory(
          selectedCategory,
          prev.customFields
        ),
      }));
    }
  }, [selectedCategory, entry]);

  // 渲染动态字段
  const renderDynamicField = (field: CustomField) => {
    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.name}{" "}
              {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={field.value}
              onChange={(e) => updateCustomField(field.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={field.placeholder || `输入${field.name}`}
              rows={3}
              required={field.isRequired}
            />
          </div>
        );

      case "password":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.name}{" "}
              {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={field.value}
                  onChange={(e) => updateCustomField(field.id, e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  placeholder={field.placeholder || `输入${field.name}`}
                  required={field.isRequired}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                      d={
                        showPassword
                          ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      }
                    />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentPasswordFieldId(field.id);
                  setShowPasswordGenerator(true);
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="生成密码"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.name}{" "}
              {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              value={field.value}
              onChange={(e) => updateCustomField(field.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={field.placeholder || `输入${field.name}`}
              required={field.isRequired}
            />
          </div>
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("请输入标题");
      return;
    }
    onSave(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordGenerated = (password: string) => {
    if (currentPasswordFieldId) {
      updateCustomField(currentPasswordFieldId, password);
    }
    setShowPasswordGenerator(false);
    setCurrentPasswordFieldId(null);
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

  const updateCustomField = (id: string, value: string) => {
    handleInputChange(
      "customFields",
      formData.customFields.map((field) =>
        field.id === id ? { ...field, value } : field
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {entry ? "编辑密码" : "添加密码"}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                类目 *
              </label>
              <CategorySelector
                categories={categories}
                selectedCategory={formData.categoryId}
                onSelect={(categoryId) =>
                  handleInputChange("categoryId", categoryId || "")
                }
                showAll={false}
              />
            </div>

            {/* Title Field (Always shown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="输入标题"
                required
              />
            </div>

            {/* Dynamic Fields based on Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.customFields.map((field) => renderDynamicField(field))}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="添加标签"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                备注
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="添加备注..."
              />
            </div>

            {/* Favorite Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="favorite"
                checked={formData.isFavorite}
                onChange={(e) =>
                  handleInputChange("isFavorite", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="favorite"
                className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                标记为收藏
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {entry ? "更新" : "保存"}
            </button>
          </div>
        </form>
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
