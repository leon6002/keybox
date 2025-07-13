"use client";

import { useState, useRef } from "react";
import { PasswordEntry, Category } from "@/types/password";
import { StorageManager } from "@/utils/storage";

interface QuickImportExportProps {
  entries: PasswordEntry[];
  categories: Category[];
  onImport: (entries: PasswordEntry[]) => void;
  onClose: () => void;
  mode: "import" | "export";
}

export default function QuickImportExport({
  entries,
  categories,
  onImport,
  onClose,
  mode,
}: QuickImportExportProps) {
  const [importStatus, setImportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [importMessage, setImportMessage] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [encryptPassword, setEncryptPassword] = useState("");
  const [decryptPassword, setDecryptPassword] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File, password?: string) => {
    if (!file.name.endsWith(".json") && !file.name.endsWith(".kbx")) {
      setImportStatus("error");
      setImportMessage("请选择 JSON 或 KBX 格式的文件");
      return;
    }

    // 如果是加密文件但没有密码，显示密码输入对话框
    if (file.name.endsWith(".kbx") && !password) {
      setPendingFile(file);
      setShowPasswordDialog(true);
      return;
    }

    setImportStatus("loading");
    setImportMessage("正在导入数据...");

    try {
      const importedEntries = await StorageManager.importFromFile(
        file,
        undefined,
        password
      );
      onImport(importedEntries);
      setImportStatus("success");
      setImportMessage(`成功导入 ${importedEntries.length} 个密码条目`);

      // 清理状态
      setPendingFile(null);
      setDecryptPassword("");
      setShowPasswordDialog(false);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setImportStatus("error");
      setImportMessage(error instanceof Error ? error.message : "导入失败");
    }
  };

  const handleQuickExport = async (
    encrypt: boolean = false,
    password?: string
  ) => {
    try {
      await StorageManager.exportToFile(entries, categories, {
        includePasswords: true,
        format: "json",
        encrypt,
        password,
      });

      // 清理状态
      setEncryptPassword("");
      setShowPasswordDialog(false);
      onClose();
    } catch (error) {
      alert(
        "导出失败: " + (error instanceof Error ? error.message : "未知错误")
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  if (mode === "import") {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              快速导入
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    拖拽文件到这里
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    支持 JSON 和 KBX 格式
                  </p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  选择文件
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.kbx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Import Status */}
            {importStatus !== "idle" && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  importStatus === "loading"
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
                    : importStatus === "success"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                }`}
              >
                <div className="flex items-center">
                  {importStatus === "loading" && (
                    <svg
                      className="animate-spin w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {importStatus === "success" && (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {importStatus === "error" && (
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <span className="text-sm font-medium">{importMessage}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 密码输入对话框 */}
        {showPasswordDialog && pendingFile && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4">
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  输入解密密码
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      文件解密密码
                    </label>
                    <input
                      type="password"
                      value={decryptPassword}
                      onChange={(e) => setDecryptPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="请输入密码"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPasswordDialog(false);
                      setPendingFile(null);
                      setDecryptPassword("");
                    }}
                    className="cursor-pointer px-3 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() =>
                      handleFileSelect(pendingFile, decryptPassword)
                    }
                    disabled={!decryptPassword}
                    className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    解密导入
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Export mode
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            快速导出
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {entries.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              个密码条目
            </div>
          </div>

          <button
            onClick={() => handleQuickExport(false)}
            className="cursor-pointer w-full flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="font-medium text-gray-900 dark:text-white">
              导出完整数据 (JSON)
            </span>
          </button>

          <button
            onClick={() => {
              setShowPasswordDialog(true);
            }}
            className="cursor-pointer w-full flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400 mr-3"
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
            <span className="font-medium text-gray-900 dark:text-white">
              导出加密数据 (KBX)
            </span>
          </button>
        </div>

        {/* 加密密码输入对话框 */}
        {showPasswordDialog && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4">
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  设置加密密码
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      加密密码
                    </label>
                    <input
                      type="password"
                      value={encryptPassword}
                      onChange={(e) => setEncryptPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="请输入密码"
                      autoFocus
                    />
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p>• 密码长度建议至少8位</p>
                    <p>• 请妥善保管密码，丢失后无法恢复数据</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPasswordDialog(false);
                      setEncryptPassword("");
                    }}
                    className="cursor-pointer px-3 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleQuickExport(true, encryptPassword)}
                    disabled={!encryptPassword}
                    className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    加密导出
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
