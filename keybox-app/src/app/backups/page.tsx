"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Download,
  Upload,
  Trash2,
  Clock,
  FileText,
  ArrowLeft,
  Plus,
  ArrowDownToLine,
  Key,
} from "lucide-react";
import { BackupService, BackupRecord } from "@/services/backupService";
import { SupabaseBackupService } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordEntry, Category } from "@/types/password";
import toast from "react-hot-toast";

export default function BackupsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(
    null
  );
  const [versionName, setVersionName] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("User state changed:", user);
    if (user) {
      loadBackups();
    }
  }, [user]);

  const loadBackups = async () => {
    const effectiveUser = user || {
      id: "guest-user",
      email: "guest@example.com",
    };
    try {
      const userBackups = await BackupService.getBackups(effectiveUser.id);
      setBackups(
        userBackups.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to load backups:", error);
    }
  };

  const handleCreateManualBackup = async () => {
    console.log("handleCreateManualBackup called", { user, versionName });

    // 临时解决方案：如果没有用户，创建一个临时用户用于测试
    const effectiveUser = user || {
      id: "guest-user",
      email: "guest@example.com",
    };

    if (!versionName.trim()) {
      console.log("Validation failed", { user: !!effectiveUser, versionName });
      toast.error("Please enter a version name");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Creating backup...");

    try {
      // 获取当前密码数据
      const entriesJson = localStorage.getItem(
        `keybox_entries_${effectiveUser.id}`
      );
      const entries: PasswordEntry[] = entriesJson
        ? JSON.parse(entriesJson)
        : [];

      // 获取当前分类数据
      const categoriesJson = localStorage.getItem(
        `keybox_categories_${effectiveUser.id}`
      );
      const categories: Category[] = categoriesJson
        ? JSON.parse(categoriesJson)
        : [];

      console.log("Data loaded:", {
        entries: entries.length,
        categories: categories.length,
      });

      const password = useCustomPassword ? customPassword : undefined;
      console.log("Creating backup with:", { versionName, useCustomPassword });

      const filename = await BackupService.manualBackup(
        effectiveUser.id,
        entries,
        categories,
        versionName,
        password
      );

      toast.dismiss(loadingToast);

      console.log("Backup created:", filename);

      // 重新加载备份列表
      loadBackups();

      // 重置表单
      setVersionName("");
      setCustomPassword("");
      setUseCustomPassword(false);
      setShowCreateDialog(false);

      toast.success(t("backup.createSuccess", { filename }));
    } catch (error) {
      console.error("Failed to create backup:", error);
      toast.dismiss(loadingToast);
      toast.error(t("backup.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backup: BackupRecord) => {
    const effectiveUser = user || {
      id: "guest-user",
      email: "guest@example.com",
    };

    setLoading(true);
    try {
      const fileContent = await BackupService.getBackupFileContent(backup.id);
      if (!fileContent) {
        throw new Error("Backup file not found");
      }

      // 创建临时文件对象
      const blob = new Blob([fileContent], { type: "application/x-kbx" });
      const file = new File([blob], backup.filename, {
        type: "application/x-kbx",
      });

      // 使用系统预设密码解密
      const backupKey = BackupService.getUserBackupKey(effectiveUser.id);
      const kbxData = await BackupService.parseKBXFile(file, backupKey);

      // 确认恢复
      const confirmed = window.confirm(
        t("backup.confirmRestore", {
          filename: backup.filename,
          count: kbxData.entries.length,
        })
      );

      if (confirmed) {
        // 保存恢复的数据
        localStorage.setItem(
          `keybox_entries_${effectiveUser.id}`,
          JSON.stringify(kbxData.entries)
        );

        toast.success(t("backup.restoreSuccess"));
        router.push("/passwords");
      }
    } catch (error) {
      console.error("Failed to restore backup:", error);
      toast.error(t("backup.restoreFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromFile = async () => {
    if (!restoreFile || !restorePassword.trim()) return;

    setLoading(true);
    try {
      const kbxData = await BackupService.parseKBXFile(
        restoreFile,
        restorePassword
      );

      // 确认恢复
      const confirmed = window.confirm(
        t("backup.confirmRestore", {
          filename: restoreFile.name,
          count: kbxData.entries.length,
        })
      );

      if (confirmed && user) {
        // 保存恢复的数据
        localStorage.setItem(
          `keybox_entries_${user.id}`,
          JSON.stringify(kbxData.entries)
        );

        setShowRestoreDialog(false);
        setRestoreFile(null);
        setRestorePassword("");

        toast.success(t("backup.restoreSuccess"));
        router.push("/passwords");
      }
    } catch (error) {
      console.error("Failed to restore from file:", error);
      toast.error(t("backup.restoreFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async () => {
    const effectiveUser = user || {
      id: "guest-user",
      email: "guest@example.com",
    };

    if (!selectedBackup) return;

    try {
      await BackupService.deleteBackup(effectiveUser.id, selectedBackup.id);
      await loadBackups();
      setShowDeleteDialog(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error("Failed to delete backup:", error);
      toast.error("Failed to delete backup");
    }
  };

  const handleDownloadBackup = async (backup: BackupRecord) => {
    setLoading(true);
    try {
      console.log("Downloading backup:", backup.filename);
      await SupabaseBackupService.downloadBackupFile(backup.id);
      toast.success(`✅ Downloaded: ${backup.filename}`);
    } catch (error) {
      console.error("Failed to download backup:", error);
      toast.error("❌ Failed to download backup. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAllBackups = async () => {
    const effectiveUser = user || {
      id: "guest-user",
      email: "guest@example.com",
    };

    setLoading(true);
    const loadingToast = toast.loading("Downloading all backups...");

    try {
      console.log("Starting batch download...");
      await SupabaseBackupService.downloadAllBackups(effectiveUser.id);
      toast.dismiss(loadingToast);
      toast.success("✅ All backups downloaded successfully!");
    } catch (error) {
      console.error("Failed to download all backups:", error);
      toast.dismiss(loadingToast);
      toast.error(
        "❌ Failed to download all backups. Check console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShowBackupKey = () => {
    const effectiveUser = user || {
      id: "guest-user",
      email: "guest@example.com",
    };

    const backupKey = BackupService.getUserBackupKey(effectiveUser.id);

    // 复制到剪贴板
    navigator.clipboard
      .writeText(backupKey)
      .then(() => {
        toast.success(
          `🔑 Default backup password copied to clipboard!\n\nPassword: ${backupKey.substring(
            0,
            8
          )}...\n\n⚠️ This password is used for all automatic backups. Save it securely!`,
          {
            duration: 8000,
          }
        );
      })
      .catch(() => {
        toast.error(
          `🔑 Default backup password:\n\n${backupKey}\n\n⚠️ Please copy this password manually and save it securely!`,
          {
            duration: 10000,
          }
        );
      });
  };

  const handleTestConnection = async () => {
    const effectiveUser = user || {
      id: "guest-user",
      email: "guest@example.com",
    };

    setLoading(true);
    try {
      console.log("Testing Supabase connection...");
      const connectionOk = await SupabaseBackupService.testConnection();

      if (connectionOk) {
        console.log("Testing upload functionality...");
        const uploadOk = await SupabaseBackupService.testUpload(
          effectiveUser.id
        );

        if (uploadOk) {
          toast.success("✅ Supabase connection and upload test successful!");
        } else {
          toast.error("❌ Upload test failed. Check console for details.");
        }
      } else {
        toast.error(
          "❌ Supabase connection test failed. Check console for details."
        );
      }
    } catch (error) {
      console.error("Test failed:", error);
      toast.error("❌ Test failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  // 临时移除登录检查以便测试
  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
  //       <Card className="w-full max-w-md">
  //         <CardContent className="flex flex-col items-center justify-center py-12">
  //           <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
  //             {t("auth.loginRequired")}
  //           </h3>
  //           <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
  //             {t("backup.loginRequiredDescription")}
  //           </p>
  //           <Button onClick={() => router.push("/auth/signin")}>
  //             {t("auth.signIn")}
  //           </Button>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/passwords")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("common.back")}</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("backup.title")}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowRestoreDialog(true)}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{t("backup.restoreFromFile")}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadAllBackups}
                disabled={loading || backups.length === 0}
                className="flex items-center space-x-2"
                title="Download all KBX files"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Download All</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleShowBackupKey}
                className="flex items-center space-x-2"
                title="Show default backup password"
              >
                <Key className="w-4 h-4" />
                <span>Show Password</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <span>🔧</span>
                <span>Test Supabase</span>
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t("backup.createManual")}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {backups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("backup.noBackups")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                {t("backup.noBackupsDescription")}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                {t("backup.createFirst")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {backups.map((backup) => (
              <Card key={backup.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {backup.versionName || backup.filename}
                        </h3>
                        <Badge
                          variant={
                            backup.backupType === "auto"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {backup.backupType === "auto"
                            ? t("backup.auto")
                            : t("backup.manual")}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(backup.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{formatFileSize(backup.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadBackup(backup)}
                        disabled={loading}
                        title="Download KBX file"
                      >
                        <ArrowDownToLine className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreBackup(backup)}
                        disabled={loading}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t("backup.restore")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowDeleteDialog(true);
                        }}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Manual Backup Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("backup.createManual")}</DialogTitle>
            <DialogDescription>
              {t("backup.createManualDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="versionName">{t("backup.versionName")}</Label>
              <Input
                id="versionName"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder={t("backup.versionNamePlaceholder")}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustomPassword"
                checked={useCustomPassword}
                onChange={(e) => setUseCustomPassword(e.target.checked)}
              />
              <Label htmlFor="useCustomPassword">
                {t("backup.useCustomPassword")}
              </Label>
            </div>
            {useCustomPassword && (
              <div>
                <Label htmlFor="customPassword">
                  {t("backup.customPassword")}
                </Label>
                <Input
                  id="customPassword"
                  type="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder={t("backup.customPasswordPlaceholder")}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                console.log("Button clicked directly");
                handleCreateManualBackup();
              }}
              disabled={!versionName.trim() || loading}
            >
              {loading ? t("common.loading") : t("backup.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore from File Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("backup.restoreFromFile")}</DialogTitle>
            <DialogDescription>
              {t("backup.restoreFromFileDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="restoreFile">{t("backup.selectFile")}</Label>
              <Input
                id="restoreFile"
                type="file"
                accept=".kbx"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="restorePassword">{t("backup.password")}</Label>
              <Input
                id="restorePassword"
                type="password"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                placeholder={t("backup.passwordPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleRestoreFromFile}
              disabled={!restoreFile || !restorePassword.trim() || loading}
            >
              {loading ? t("common.loading") : t("backup.restore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("backup.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("backup.confirmDeleteDescription", {
                filename: selectedBackup?.filename || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBackup}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
