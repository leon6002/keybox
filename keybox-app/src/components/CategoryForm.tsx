"use client";

import { useState, useEffect } from "react";
import { Category, CategoryField } from "@/types/password";
import { CategoryManager } from "@/utils/categories";

interface CategoryFormProps {
  category: Category | null;
  onSave: (data: Omit<Category, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const FIELD_TYPES = [
  { value: "text", label: "文本", icon: "📝" },
  { value: "password", label: "密码", icon: "🔒" },
  { value: "email", label: "邮箱", icon: "📧" },
  { value: "url", label: "网址", icon: "🔗" },
  { value: "textarea", label: "多行文本", icon: "📄" },
  { value: "number", label: "数字", icon: "🔢" },
  { value: "date", label: "日期", icon: "📅" },
  { value: "phone", label: "电话", icon: "📞" },
] as const;

const CATEGORY_ICONS = [
  "🐧",
  "🗄️",
  "💳",
  "👤",
  "🖥️",
  "📶",
  "🔧",
  "📱",
  "🎮",
  "🏠",
  "🚗",
  "✈️",
  "🏥",
  "🏫",
  "🏢",
  "🛒",
  "📚",
  "🎵",
  "🎬",
  "📷",
  "💼",
  "🔑",
  "📋",
  "📊",
  "📈",
  "📉",
  "📌",
  "📍",
  "🎯",
  "⚡",
  "🌐",
];

const CATEGORY_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F59E0B",
];

export default function CategoryForm({
  category,
  onSave,
  onCancel,
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    icon: "📁",
    color: "#3B82F6",
    description: "",
    fields: [] as CategoryField[],
  });

  const [errors, setErrors] = useState<string[]>([]);

  // 初始化表单数据
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
        description: category.description || "",
        fields: [...category.fields],
      });
    }
  }, [category]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除错误
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const addField = () => {
    const newField: CategoryField = {
      id: CategoryManager.generateId(),
      name: "",
      type: "text",
      isRequired: false,
      placeholder: "",
    };
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const updateField = (fieldId: string, updates: Partial<CategoryField>) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
  };

  const removeField = (fieldId: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    setFormData((prev) => {
      const fields = [...prev.fields];
      const index = fields.findIndex((f) => f.id === fieldId);

      if (direction === "up" && index > 0) {
        [fields[index], fields[index - 1]] = [fields[index - 1], fields[index]];
      } else if (direction === "down" && index < fields.length - 1) {
        [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
      }

      return { ...prev, fields };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 验证表单
    const validation = CategoryManager.validateCategory({
      ...formData,
      id: "temp",
      createdAt: "",
      updatedAt: "",
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-60">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {category ? "编辑类目" : "添加类目"}
            </h3>
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

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="font-medium text-red-800 dark:text-red-200">
                    请修正以下错误：
                  </span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    类目名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="输入类目名称"
                    required
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    图标 *
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="grid grid-cols-10 gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 max-h-32 overflow-y-auto">
                        {CATEGORY_ICONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => handleInputChange("icon", icon)}
                            className={`p-2 text-lg rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                              formData.icon === icon
                                ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500"
                                : ""
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-2xl p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                      {formData.icon}
                    </div>
                  </div>
                </div>
              </div>

              {/* Color and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    颜色 *
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="grid grid-cols-6 gap-2">
                      {CATEGORY_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleInputChange("color", color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.color === color
                              ? "border-gray-800 dark:border-white scale-110"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                      className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="类目描述（可选）"
                  />
                </div>
              </div>

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    字段定义 *
                  </label>
                  <button
                    type="button"
                    onClick={addField}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    添加字段
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Field Name */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            字段名称
                          </label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) =>
                              updateField(field.id, { name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            placeholder="字段名称"
                          />
                        </div>

                        {/* Field Type */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            字段类型
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) =>
                              updateField(field.id, {
                                type: e.target.value as any,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          >
                            {FIELD_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Placeholder */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            占位符
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ""}
                            onChange={(e) =>
                              updateField(field.id, {
                                placeholder: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            placeholder="占位符文本"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-end space-x-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              id={`required-${field.id}`}
                              checked={field.isRequired}
                              onChange={(e) =>
                                updateField(field.id, {
                                  isRequired: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor={`required-${field.id}`}
                              className="text-xs text-gray-600 dark:text-gray-400"
                            >
                              必填
                            </label>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => moveField(field.id, "up")}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="上移"
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
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => moveField(field.id, "down")}
                              disabled={index === formData.fields.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="下移"
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
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => removeField(field.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="删除"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.fields.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <svg
                        className="w-12 h-12 mx-auto mb-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <p>还没有添加字段</p>
                      <p className="text-sm">点击"添加字段"按钮开始创建</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {category ? "更新类目" : "创建类目"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
