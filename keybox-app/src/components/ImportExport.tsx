"use client";

import { useState, useRef } from "react";
import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PasswordEntry, Category } from "@/types/password";
import { StorageManager } from "@/utils/storage";
import { useConfirm } from "@/hooks/useConfirm";
import PasswordGeneratorModal from "@/components/PasswordGeneratorModal";
import { EncryptedCacheService } from "@/lib/storage/encryptedCacheService";
import { OptimisticUpdateService } from "@/lib/storage/optimisticUpdateService";

interface ImportExportProps {
  entries: PasswordEntry[];
  categories: Category[];
  onImport: (entries: PasswordEntry[]) => void;
  onClose: () => void;
}

export default function ImportExport({
  entries,
  categories,
  onImport,
  onClose,
}: ImportExportProps) {
  const { t, ready } = useTranslation();
  const [activeTab, setActiveTab] = useState<"import" | "export">("export");
  const [importStatus, setImportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [importMessage, setImportMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [encryptPassword, setEncryptPassword] = useState("");
  const [decryptPassword, setDecryptPassword] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingExportOptions, setPendingExportOptions] = useState<{
    includePasswords: boolean;
  } | null>(null);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const handleFileSelect = async (file: File, password?: string) => {
    if (!file.name.endsWith(".json") && !file.name.endsWith(".kbx")) {
      setImportStatus("error");
      setImportMessage(
        ready
          ? t("importExport.fileTypeError")
          : "请选择 JSON 或 KBX 格式的文件"
      );
      return;
    }

    // 如果是加密文件但没有密码，显示密码输入对话框
    if (file.name.endsWith(".kbx") && !password) {
      setPendingFile(file);
      setShowPasswordDialog(true);
      return;
    }

    setImportStatus("loading");
    setImportMessage(ready ? t("importExport.importing") : "正在导入数据...");

    try {
      const importedEntries = await StorageManager.importFromFile(
        file,
        undefined,
        password
      );
      onImport(importedEntries);
      setImportStatus("success");
      setImportMessage(
        ready
          ? t("importExport.importSuccess", { count: importedEntries.length })
          : `成功导入 ${importedEntries.length} 个密码条目`
      );

      // 清理状态
      setPendingFile(null);
      setDecryptPassword("");
      setShowPasswordDialog(false);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setImportStatus("error");
      setImportMessage(
        error instanceof Error
          ? error.message
          : ready
          ? t("importExport.importFailed")
          : "导入失败"
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

  const handleExport = (
    includePasswords: boolean = true,
    encrypt: boolean = false
  ) => {
    if (encrypt) {
      setPendingExportOptions({ includePasswords });
      setShowPasswordDialog(true);
    } else {
      performExport(includePasswords, false);
    }
  };

  const performExport = async (
    includePasswords: boolean,
    encrypt: boolean,
    password?: string
  ) => {
    try {
      await StorageManager.exportToFile(entries, categories, {
        includePasswords,
        format: "json",
        encrypt,
        password,
      });

      // 清理状态
      setPendingExportOptions(null);
      setEncryptPassword("");
      setShowPasswordDialog(false);
    } catch (error) {
      await confirm({
        title: ready ? t("error.exportFailed") : "导出失败",
        description:
          (ready ? t("error.exportFailed") : "导出失败") +
          ": " +
          (error instanceof Error
            ? error.message
            : ready
            ? t("error.unknownError")
            : "未知错误"),
        confirmText: ready ? t("common.ok") : "确定",
        cancelText: "",
      });
    }
  };

  const clearAllData = async () => {
    const confirmed = await confirm({
      title: ready ? t("importExport.clearAllData") : "清空所有数据",
      description: ready
        ? t("importExport.clearAllDataConfirm")
        : "确定要清空所有数据吗？此操作不可撤销！",
      confirmText: ready ? t("common.clear") : "清空",
      cancelText: ready ? t("common.cancel") : "取消",
      variant: "destructive",
    });
    if (confirmed) {
      try {
        console.log("🗑️ Clearing all data from ImportExport...");

        // Clear all IndexedDB data
        try {
          const cacheService = EncryptedCacheService.getInstance();
          const optimisticService = OptimisticUpdateService.getInstance();

          await cacheService.clearAllCache();
          console.log("✅ Encrypted cache cleared");

          await optimisticService.clearAllData();
          console.log("✅ Optimistic updates cleared");
        } catch (indexedDBError) {
          console.error("❌ Failed to clear IndexedDB:", indexedDBError);
          // Continue even if IndexedDB clear fails
        }

        // Clear localStorage
        StorageManager.clearAllData();
        localStorage.clear();
        console.log("✅ localStorage cleared");

        // Clear sessionStorage
        sessionStorage.clear();
        console.log("✅ sessionStorage cleared");

        console.log("✅ All data cleared, reloading...");
        window.location.reload();
      } catch (error) {
        console.error("❌ Failed to clear data:", error);
        // Fallback to just clearing localStorage
        StorageManager.clearAllData();
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {ready ? t("importExport.title") : "数据管理"}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
            onClick={() => setActiveTab("import")}
            className={`cursor-pointer flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "import"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {ready ? t("importExport.importData") : "导入数据"}
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`cursor-pointer flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "export"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {ready ? t("importExport.exportData") : "导出数据"}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "import" ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {ready ? t("importExport.importData") : "导入密码数据"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {ready
                    ? t("importExport.supportedFormats")
                    : "支持导入.json后缀和.kbx后缀的密码文件"}
                </p>
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {ready
                        ? t("importExport.dragDropFile")
                        : "拖拽文件到这里"}
                    </p>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
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
                    {ready ? t("importExport.selectFile") : "选择文件"}
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
                  className={`p-4 rounded-lg ${
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
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {ready ? t("importExport.exportData") : "导出密码数据"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {ready
                    ? t("importExport.exportData")
                    : "将您的密码数据导出, 以便在其他设备上恢复数据"}
                </p>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {ready
                        ? t("stats.totalEntries", { count: entries.length })
                        : "当前数据统计"}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {ready
                      ? t("stats.totalEntries", { count: entries.length })
                      : `${entries.length} 个密码条目`}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* <button
                    onClick={() => handleExport(true)}
                    className="cursor-pointer w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex items-center">
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
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          导出完整数据
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          包含所有密码和敏感信息
                        </div>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button> */}

                  {/* <button
                    onClick={() => handleExport(false)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          导出结构数据
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          不包含密码等敏感信息
                        </div>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button> */}

                  <button
                    onClick={() => handleExport(true, true)}
                    className="cursor-pointer w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <div className="flex items-center">
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
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {ready
                            ? t("importExport.exportEncrypted")
                            : "导出加密数据"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ready
                            ? t("importExport.exportEncrypted")
                            : "使用密码加密保护，适合多设备同步"}
                        </div>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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
                        {ready ? t("common.warning") : "危险操作"}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      {ready
                        ? t("importExport.clearAllDataConfirm")
                        : "清空浏览器本地存储的密码数据。此操作不可撤销！建议清空前先务必导出文件，导出文件后可放心清空，之后可以从导出的文件中导入数据。"}
                    </p>
                    <button
                      onClick={clearAllData}
                      className="cursor-pointer px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {ready ? t("importExport.clearAllData") : "清空所有数据"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 密码输入对话框 */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {pendingFile
                  ? ready
                    ? t("importExport.decryptionPassword")
                    : "输入解密密码"
                  : ready
                  ? t("importExport.encryptionPassword")
                  : "设置加密密码"}
              </h3>

              {/* 安全提示 - 仅在设置加密密码时显示 */}
              {!pendingFile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        🔐{" "}
                        {ready
                          ? t("importExport.encryptionPassword")
                          : "数据加密保护说明"}
                      </h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                        <p>
                          {ready
                            ? t("importExport.encryptionWarning")
                            : "• 此密码专门用于加密您的导出数据，确保数据在传输和存储过程中的安全性"}
                        </p>
                      </div>
                      <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                        <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                          ⚠️{" "}
                          {ready
                            ? t("importExport.encryptionWarning")
                            : "重要提醒：忘记此密码将无法导入数据，请妥善保管！"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {pendingFile
                      ? ready
                        ? t("importExport.decryptionPassword")
                        : "文件解密密码"
                      : ready
                      ? t("importExport.encryptionPassword")
                      : "加密密码"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={pendingFile ? decryptPassword : encryptPassword}
                      onChange={(e) =>
                        pendingFile
                          ? setDecryptPassword(e.target.value)
                          : setEncryptPassword(e.target.value)
                      }
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        !pendingFile ? "pr-20" : "pr-12"
                      }`}
                      placeholder={
                        ready ? t("importExport.enterPassword") : "请输入密码"
                      }
                      autoFocus
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      {/* 眼睛图标 - 显示/隐藏密码 */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                        title={
                          showPassword
                            ? ready
                              ? t("importExport.hidePassword")
                              : "隐藏密码"
                            : ready
                            ? t("importExport.showPassword")
                            : "显示密码"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>

                      {/* 密码生成器按钮 - 仅在设置加密密码时显示 */}
                      {!pendingFile && (
                        <button
                          type="button"
                          onClick={() => setShowPasswordGenerator(true)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                          title={
                            ready
                              ? t("importExport.generatePassword")
                              : "生成密码"
                          }
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!pendingFile && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>
                      •{" "}
                      {ready
                        ? t("error.passwordTooShort")
                        : "密码长度建议至少8位"}
                    </p>
                    <p>
                      •{" "}
                      {ready
                        ? t("password.passwordStrength")
                        : "包含大小写字母、数字和特殊字符"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPendingFile(null);
                    setPendingExportOptions(null);
                    setEncryptPassword("");
                    setDecryptPassword("");
                  }}
                  className="cursor-pointer px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {ready ? t("importExport.cancel") : "取消"}
                </button>
                <button
                  onClick={() => {
                    if (pendingFile) {
                      // 导入加密文件
                      handleFileSelect(pendingFile, decryptPassword);
                    } else if (pendingExportOptions) {
                      // 导出加密文件
                      performExport(
                        pendingExportOptions.includePasswords,
                        true,
                        encryptPassword
                      );
                    }
                  }}
                  disabled={pendingFile ? !decryptPassword : !encryptPassword}
                  className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {pendingFile
                    ? ready
                      ? t("importExport.decryptImport")
                      : "解密导入"
                    : ready
                    ? t("importExport.encryptExport")
                    : "加密导出"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 密码生成器模态框 */}
      <PasswordGeneratorModal
        isOpen={showPasswordGenerator}
        onClose={() => setShowPasswordGenerator(false)}
        onPasswordGenerated={(password: string) => {
          setEncryptPassword(password);
          setShowPasswordGenerator(false);
        }}
      />

      <ConfirmDialog />
    </div>
  );
}
