"use client";

import { useState } from "react";
import { Category } from "@/types/password";
import {
  CategoryManager as CategoryUtil,
  DEFAULT_CATEGORIES,
} from "@/utils/categories";
import CategoryForm from "./CategoryForm";

interface CategoryManagerProps {
  categories: Category[];
  onSave: (categories: Category[]) => void;
  onClose: () => void;
}

export default function CategoryManager({
  categories,
  onSave,
  onClose,
}: CategoryManagerProps) {
  const [localCategories, setLocalCategories] =
    useState<Category[]>(categories);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "templates">("list");

  const handleSaveCategories = () => {
    onSave(localCategories);
    onClose();
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (
      confirm("确定要删除这个类目吗？删除后该类目下的所有条目将变为未分类。")
    ) {
      setLocalCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
    }
  };

  const handleAddFromTemplate = (template: (typeof DEFAULT_CATEGORIES)[0]) => {
    const newCategory = CategoryUtil.createCategory(template);
    setLocalCategories((prev) => [...prev, newCategory]);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowAddForm(true);
  };

  const handleSaveCategory = (
    categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
  ) => {
    if (selectedCategory) {
      // 编辑现有类目
      const updatedCategory: Category = {
        ...selectedCategory,
        ...categoryData,
        updatedAt: new Date().toISOString(),
      };
      setLocalCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategory.id ? updatedCategory : cat
        )
      );
    } else {
      // 添加新类目
      const newCategory = CategoryUtil.createCategory(categoryData);
      setLocalCategories((prev) => [...prev, newCategory]);
    }

    setSelectedCategory(null);
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            类目管理
          </h2>
          <button
            onClick={onClose}
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "list"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            我的类目 ({localCategories.length})
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "templates"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            模板库
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "list" ? (
            <div className="space-y-4">
              {/* Add Category Button */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowAddForm(true);
                }}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>添加新类目</span>
                </div>
              </button>

              {/* Categories List */}
              {localCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {category.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {category.fields.length} 个字段
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
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
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
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

                  {/* Fields Preview */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {category.fields.slice(0, 4).map((field) => (
                      <span
                        key={field.id}
                        className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-600 text-xs rounded-full border border-gray-200 dark:border-gray-500"
                      >
                        <span className="mr-1">
                          {CategoryUtil.getFieldTypeIcon(field.type)}
                        </span>
                        {field.name}
                        {field.isRequired && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </span>
                    ))}
                    {category.fields.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-600 text-xs rounded-full">
                        +{category.fields.length - 4} 更多
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                选择模板快速创建常用类型的类目
              </p>

              {DEFAULT_CATEGORIES.map((template, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {template.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          包含 {template.fields.length} 个预设字段
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddFromTemplate(template)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      添加
                    </button>
                  </div>

                  {/* Fields Preview */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.fields.map((field, fieldIndex) => (
                      <span
                        key={fieldIndex}
                        className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-600 text-xs rounded-full border border-gray-200 dark:border-gray-500"
                      >
                        <span className="mr-1">
                          {CategoryUtil.getFieldTypeIcon(field.type)}
                        </span>
                        {field.name}
                        {field.isRequired && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSaveCategories}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            保存更改
          </button>
        </div>
      </div>

      {/* Category Form Modal */}
      {showAddForm && (
        <CategoryForm
          category={selectedCategory}
          onSave={handleSaveCategory}
          onCancel={() => {
            setShowAddForm(false);
            setSelectedCategory(null);
          }}
        />
      )}
    </div>
  );
}
