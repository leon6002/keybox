"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed unused Card imports
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit3 } from "lucide-react";
import { PasswordEntry, Folder } from "@/types/password";
import { StorageManager } from "@/utils/storage";
import { SearchEngine } from "@/utils/search";
import PasswordEditForm from "@/components/PasswordEditForm";
import { useConfirm } from "@/hooks/useConfirm";
import { BackupService } from "@/services/backupService";
import { EncryptedCacheService } from "@/lib/storage/encryptedCacheService";
import { OptimisticUpdateService } from "@/lib/storage/optimisticUpdateService";
import { OptimizedLoadService } from "@/lib/storage/optimizedLoadService";
import { useAuth } from "@/contexts/AuthContext";
import PasswordGuard from "@/components/auth/PasswordGuard";

import { FolderService } from "@/services/folderService";
import { CategoryManager } from "@/utils/folders";

function ManagePasswordsContent() {
  const router = useRouter();
  const { t, ready } = useTranslation();
  const { user, getGoogleUser, getUserKey } = useAuth();
  const googleUser = getGoogleUser();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("id");

  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<PasswordEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Flag to prevent redirect during save
  const [isCreatingPassword, setIsCreatingPassword] = useState(false); // Loading state for add password button
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete operation
  const [isLoadingPasswords, setIsLoadingPasswords] = useState(false); // Loading state for /passwords/load API
  const [cacheService] = useState(() => EncryptedCacheService.getInstance());
  const [optimisticService] = useState(() =>
    OptimisticUpdateService.getInstance()
  );
  const [optimizedLoadService] = useState(() =>
    OptimizedLoadService.getInstance()
  );
  const { confirm, ConfirmDialog } = useConfirm();

  // 点击外部关闭侧边栏
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // 关闭侧边栏
      if (isSidebarOpen) {
        if (
          !target.closest(".mobile-sidebar") &&
          !target.closest(".sidebar-toggle-button")
        ) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebarOpen]);

  // 选择条目并更新 URL
  const handleSelectEntry = (entry: PasswordEntry) => {
    console.log("🔍 handleSelectEntry called with:", entry.title, entry.id);
    console.log("🔍 Current entries count:", entries.length);
    console.log("🔍 Current isCreatingNew:", isCreatingNew);

    setSelectedEntry(entry);
    // 如果当前在创建模式，退出创建模式
    if (isCreatingNew) {
      console.log("🔍 Exiting creating mode");
      setIsCreatingNew(false);
    }
    // 更新 URL 但不刷新页面
    const newUrl = `/manage?id=${entry.id}`;
    window.history.replaceState(null, "", newUrl);
  };

  // Placeholder for createNewPasswordEntry - will be defined after loadEncryptedPasswords

  // Placeholder for handleCreateNew - will be defined after createNewPasswordEntry

  // Initialize services
  useEffect(() => {
    Promise.all([cacheService.initialize(), optimisticService.initialize()])
      .then(() => {
        // Set up user key getter for background sync and optimized loading
        optimisticService.setUserKeyGetter(getUserKey);
        optimizedLoadService.setUserKeyGetter(getUserKey);
      })
      .catch((error) => {
        console.error("❌ Failed to initialize services:", error);
      });
  }, [cacheService, optimisticService, optimizedLoadService, getUserKey]);

  // Load encrypted passwords from database
  const loadEncryptedPasswords = useCallback(async () => {
    try {
      setIsLoadingPasswords(true); // Start loading

      if (!user?.databaseUser?.id || !user?.isVaultUnlocked) {
        console.log("📥 Skipping encrypted load - vault not unlocked");
        // Fallback to localStorage for now
        const loadedData = StorageManager.loadFromLocalStorage();
        const sortedEntries = [...loadedData.entries].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setEntries(sortedEntries);
        // Support both new folders and legacy categories
        const foldersData = loadedData.folders || loadedData.categories || [];
        // Ensure we always have at least common folders
        const finalFolders =
          foldersData.length > 0
            ? foldersData
            : FolderService.getCommonFolders();
        setFolders(finalFolders);
        setFilteredEntries(sortedEntries);
        return;
      }

      console.log("⚡ Loading passwords with optimized service...");

      // Use optimized loading service for instant results
      const result = await optimizedLoadService.loadPasswordsOptimized(
        user.databaseUser.id,
        {
          limit: 100, // Load more entries initially
          decryptionBatchSize: 20, // Larger batch for better performance
        }
      );

      console.log(
        `✅ Loaded ${result.entries.length} passwords (from ${
          result.isFromCache ? "cache" : "API"
        })`
      );

      // If no entries were loaded and it was from cache, try force refresh
      if (result.entries.length === 0 && result.isFromCache) {
        console.log("🔄 No entries from cache, trying force refresh...");
        try {
          const freshResult = await optimizedLoadService.forceRefresh(
            user.databaseUser.id
          );
          console.log(
            `🔄 Force refresh loaded ${freshResult.entries.length} entries`
          );

          if (freshResult.entries.length > 0) {
            const sortedFreshEntries = [...freshResult.entries].sort((a, b) => {
              const dateA = new Date(a.createdAt || a.updatedAt || 0);
              const dateB = new Date(b.createdAt || b.updatedAt || 0);
              return dateB.getTime() - dateA.getTime();
            });

            setEntries(sortedFreshEntries);
            setFilteredEntries(sortedFreshEntries);
            setFolders(freshResult.folders);
            StorageManager.saveToLocalStorage(
              sortedFreshEntries,
              freshResult.folders
            );
            return;
          }
        } catch (refreshError) {
          console.error("❌ Force refresh failed:", refreshError);
        }
      }

      // Sort entries by creation date (newest first)
      const sortedEntries = [...result.entries].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setEntries(sortedEntries);
      setFilteredEntries(sortedEntries);
      setFolders(result.folders);

      // Also save to localStorage as backup
      StorageManager.saveToLocalStorage(sortedEntries, result.folders);
    } catch (error) {
      console.error("❌ Failed to load encrypted passwords:", error);
      // Fallback to localStorage for passwords and default folders
      console.log("📥 Falling back to localStorage for passwords...");
      const loadedData = StorageManager.loadFromLocalStorage();
      const sortedEntries = [...loadedData.entries].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setEntries(sortedEntries);

      // Try to load encrypted folders even if passwords failed
      try {
        if (user?.databaseUser?.id) {
          const fallbackUserKeyBytes = getUserKey();
          if (fallbackUserKeyBytes) {
            console.log("📁 Attempting to load encrypted folders...");
            const decryptedFolders = await FolderService.loadEncryptedFolders(
              user.databaseUser.id,
              fallbackUserKeyBytes
            );
            setFolders(decryptedFolders);
          } else {
            // Fallback to localStorage folders
            const foldersData =
              loadedData.folders || loadedData.categories || [];
            // Ensure we always have at least common folders
            const finalFolders =
              foldersData.length > 0
                ? foldersData
                : FolderService.getCommonFolders();
            setFolders(finalFolders);
          }
        } else {
          // Fallback to localStorage folders
          const foldersData = loadedData.folders || loadedData.categories || [];
          // Ensure we always have at least common folders
          const finalFolders =
            foldersData.length > 0
              ? foldersData
              : FolderService.getCommonFolders();
          setFolders(finalFolders);
        }
      } catch (folderError) {
        console.error(
          "❌ Failed to load encrypted folders, using localStorage:",
          folderError
        );
        const foldersData = loadedData.folders || loadedData.categories || [];
        // Ensure we always have at least common folders
        const finalFolders =
          foldersData.length > 0
            ? foldersData
            : FolderService.getCommonFolders();
        setFolders(finalFolders);
      }

      setFilteredEntries(sortedEntries);
    } finally {
      setIsLoadingPasswords(false); // End loading
    }
  }, [
    user?.databaseUser?.id,
    user?.isVaultUnlocked,
    getUserKey,
    optimizedLoadService,
  ]);

  // 创建新密码的核心逻辑 - 直接创建数据库条目
  const createNewPasswordEntry = useCallback(async () => {
    try {
      setIsCreatingPassword(true); // Start loading
      console.log("⚡ Creating new password entry with optimistic update...");

      if (!user?.databaseUser?.id || !user?.isVaultUnlocked) {
        console.error("❌ Cannot create password - vault not unlocked");
        alert("Please unlock your vault first");
        setIsCreatingPassword(false);
        return;
      }

      // No need for encryption in optimistic updates - just create the entry

      // Create minimal password entry
      const now = new Date().toISOString();
      const newEntry: PasswordEntry = {
        id: crypto.randomUUID(), // Generate real UUID locally
        title: `New Password ${new Date().toLocaleTimeString()}`,
        folderId: CategoryManager.COMMON_FOLDER_IDS.PERSONAL,
        customFields: [],
        tags: [],
        isFavorite: false,
        username: "",
        password: "",
        website: "",
        description: "Click to edit and add details",
        notes: "",
        createdAt: now,
        updatedAt: now,
        // Legacy field for backward compatibility
        categoryId: "",
      };

      console.log("⚡ Saving optimistically to IndexedDB...");

      // Save optimistically - instant local save, background sync
      await optimisticService.createPasswordOptimistically(
        newEntry,
        user.databaseUser.id
      );

      // Update local state immediately for instant UI update
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);

      // Also save to localStorage as backup
      StorageManager.saveToLocalStorage(updatedEntries, folders);

      console.log("✅ Password entry created optimistically:", newEntry.id);

      // Navigate to the new entry immediately
      router.replace(`/manage?id=${newEntry.id}`, { scroll: false });

      // Invalidate cache since new data was created
      if (user?.databaseUser?.id) {
        const cacheKey = EncryptedCacheService.generateCacheKey(
          "passwords/load",
          user.databaseUser.id
        );
        await cacheService.invalidateCache(cacheKey);
      }

      // Reload data to include the new entry (after URL change)
      console.log("🔄 Reloading data to include new entry...");
      // Use setTimeout to ensure URL change is processed first
      setTimeout(async () => {
        try {
          await loadEncryptedPasswords();
          console.log("✅ Data reloaded with new entry");
        } catch (error) {
          console.error("❌ Failed to reload data:", error);
        }
      }, 100);

      console.log("🚀 New password entry created and ready for editing");
    } catch (error) {
      console.error("❌ Failed to create new password entry:", error);
      alert(
        `Failed to create password: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsCreatingPassword(false); // End loading
    }
  }, [
    user,
    router,
    loadEncryptedPasswords,
    cacheService,
    optimisticService,
    entries,
    folders,
  ]);

  // 手动创建新密码（按钮点击）
  const handleCreateNew = useCallback(() => {
    console.log("🔘 Manual handleCreateNew called");
    createNewPasswordEntry(); // Create new password directly in database
  }, [createNewPasswordEntry]);

  // 创建新文件夹
  const handleCreateFolder = useCallback(
    async (folderName: string) => {
      try {
        console.log("📁 Creating new folder:", folderName);

        if (!user?.databaseUser?.id || !user?.isVaultUnlocked) {
          console.error("❌ Cannot create folder - vault not unlocked");
          alert("Please unlock your vault first");
          return;
        }

        // Get the user key for encryption
        const userKeyBytes = getUserKey();
        if (!userKeyBytes) {
          throw new Error("User key not available for encryption");
        }

        // Create folder object
        const newFolder = {
          name: folderName,
          icon: "📁",
          color: "#6B7280",
          description: `Custom folder: ${folderName}`,
          fields: [],
        };

        // Save to encrypted database
        const savedFolder = await FolderService.saveEncryptedFolder(
          user.databaseUser.id,
          newFolder,
          userKeyBytes
        );

        // Update local state
        const updatedFolders = [...folders, savedFolder];
        setFolders(updatedFolders);

        console.log("✅ Folder created successfully:", savedFolder.id);
      } catch (error) {
        console.error("❌ Failed to create folder:", error);
        alert(
          `Failed to create folder: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [user, getUserKey, folders]
  );

  // 加载数据 - 只在组件初始化时运行
  useEffect(() => {
    console.log(
      "📥 Data loading useEffect triggered, isDataLoaded:",
      isDataLoaded
    );
    // 只在组件首次加载时加载数据
    if (!isDataLoaded) {
      loadEncryptedPasswords().then(() => {
        setIsDataLoaded(true);
        console.log("📥 Data loading completed");
      });
    } else {
      console.log("📥 Skipping data load, data already loaded");
    }
  }, [user?.isVaultUnlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // 处理 URL 参数和条目选择
  useEffect(() => {
    console.log("🔗 URL parameter useEffect triggered - RENDER COUNT CHECK");
    console.log(
      "🔗 entryId:",
      entryId,
      "entries.length:",
      entries.length,
      "isDataLoaded:",
      isDataLoaded
    );

    // 只有在数据加载完成后才处理 URL 参数
    if (!isDataLoaded) {
      console.log("🔗 Data not loaded yet, skipping URL parameter processing");
      return;
    }

    // Skip URL processing during save operation to prevent redirect
    if (isSaving) {
      console.log("🔗 Skipping URL processing during save operation");
      return;
    }

    // 根据 URL 参数选择条目
    if (entryId && entries.length > 0) {
      const entryToEdit = entries.find((entry) => entry.id === entryId);
      if (entryToEdit) {
        console.log("🔗 Found entry for ID:", entryId);
        setSelectedEntry(entryToEdit);
        setIsCreatingNew(false);
      } else {
        console.log("🔗 Entry not found for ID:", entryId);
        // Entry not found, could be still loading or invalid ID
        // Don't redirect, just wait for data to load
      }
    } else if (entries.length > 0 && !selectedEntry && !entryId) {
      // No specific entry requested, select the first one
      console.log("🔗 No entry ID, selecting first entry");
      setSelectedEntry(entries[0]);
      setIsCreatingNew(false);
    }
  }, [entryId, entries, selectedEntry, isDataLoaded, isSaving]);

  // Note: Auto-creation logic removed - we now create directly in database when clicking "Add Password"

  // 单独的 useEffect 处理自动备份
  useEffect(() => {
    if (googleUser && entries.length > 0) {
      BackupService.startAutoBackup(
        googleUser.id,
        () => {
          // 从 localStorage 重新获取最新数据，而不是依赖状态
          const currentData = StorageManager.loadFromLocalStorage();
          return currentData.entries;
        },
        () => {
          // 获取最新的文件夹数据
          const currentData = StorageManager.loadFromLocalStorage();
          return currentData.folders || currentData.categories || [];
        },
        (filename) => {
          console.log(`Auto backup completed: ${filename}`);
        },
        (error) => {
          console.error("Auto backup failed:", error);
        }
      );
    }

    // 清理函数：组件卸载时停止自动备份
    return () => {
      BackupService.stopAutoBackup();
    };
  }, [googleUser, entries.length]); // 依赖 googleUser 和 entries 的长度

  // 搜索过滤
  useEffect(() => {
    let filtered = entries;

    if (searchQuery.trim()) {
      const results = SearchEngine.search(entries, searchQuery);
      filtered = results.map((result) => result.entry);
    }

    // 按创建时间倒序排序（最新的在前面）
    const sortedEntries = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredEntries(sortedEntries);

    // 如果当前选中的条目不在搜索结果中，选择第一个结果
    if (
      sortedEntries.length > 0 &&
      selectedEntry &&
      !sortedEntries.find((e) => e.id === selectedEntry.id)
    ) {
      setSelectedEntry(sortedEntries[0]);
    }
  }, [entries, searchQuery, selectedEntry]);

  // 获取文件夹信息
  const getFolderName = (folderId: string | undefined) => {
    if (!folderId) return "未分类";
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || "未分类";
  };

  // Legacy function for backward compatibility
  const getCategoryName = (categoryId: string | undefined) => {
    return getFolderName(categoryId);
  };

  // 获取用户名信息
  const getUsernameDisplay = (entry: PasswordEntry) => {
    // 优先使用 username 字段
    if (entry.username) return entry.username;

    // 从 customFields 中查找用户名相关字段
    if (entry.customFields && entry.customFields.length > 0) {
      const usernameField = entry.customFields.find((f) => {
        if (!f.name) return false;

        const fieldName = f.name.toLowerCase();
        return (
          fieldName.includes("用户") ||
          fieldName.includes("username") ||
          fieldName.includes("账号") ||
          fieldName.includes("邮箱") ||
          fieldName.includes("email") ||
          fieldName.includes("登录") ||
          fieldName.includes("login") ||
          fieldName === "用户名" ||
          fieldName === "username" ||
          fieldName === "邮箱" ||
          fieldName === "email"
        );
      });

      if (usernameField && usernameField.value) {
        return usernameField.value;
      }

      // 如果没找到用户名字段，尝试显示第一个有值的字段
      const firstFieldWithValue = entry.customFields.find(
        (f) => f.value && f.value.trim()
      );
      if (firstFieldWithValue) {
        return `${firstFieldWithValue.name}: ${firstFieldWithValue.value}`;
      }
    }

    return "无用户名";
  };

  // 保存条目
  const handleSaveEntry = async (updatedEntry: PasswordEntry) => {
    try {
      setIsSaving(true); // Set saving flag to prevent redirect
      console.log("💾 Saving password entry:", updatedEntry.title);

      // Get the current user's database user info and user key
      if (!user || !user.databaseUser || !user.isVaultUnlocked) {
        throw new Error("Vault must be unlocked to save passwords");
      }

      // Optimistic updates handle encryption internally

      // Save to encrypted database using API
      console.log("💾 Saving to encrypted database...");

      // Check if this entry exists in the database (has a valid UUID)
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          updatedEntry.id
        );
      const shouldCreateNew = isCreatingNew || !isValidUUID;

      console.log("🔍 Entry analysis:", {
        entryId: updatedEntry.id,
        isCreatingNew,
        isValidUUID,
        shouldCreateNew,
      });

      console.log("⚡ Saving optimistically...");

      if (shouldCreateNew) {
        // Create new password optimistically
        await optimisticService.createPasswordOptimistically(
          updatedEntry,
          user.databaseUser.id
        );
        console.log("✅ New password created optimistically:", updatedEntry.id);
      } else {
        // Update existing password optimistically
        await optimisticService.updatePasswordOptimistically(
          updatedEntry,
          user.databaseUser.id
        );
        console.log("✅ Password updated optimistically:", updatedEntry.id);
      }

      // Invalidate cache since data has changed
      if (user?.databaseUser?.id) {
        const cacheKey = EncryptedCacheService.generateCacheKey(
          "passwords/load",
          user.databaseUser.id
        );
        await cacheService.invalidateCache(cacheKey);
      }

      // Reload encrypted data from database to get the latest state
      console.log("🔄 Reloading encrypted passwords after save...");
      await loadEncryptedPasswords();

      // Set the selected entry to the updated one
      setSelectedEntry(updatedEntry);
      setIsCreatingNew(false);

      // Update URL with the new database ID if it changed
      const currentUrl = new URL(window.location.href);
      const currentId = currentUrl.searchParams.get("id");
      if (currentId && currentId !== updatedEntry.id) {
        console.log("🔄 Updating URL with new database ID:", {
          oldId: currentId,
          newId: updatedEntry.id,
        });
        // Use Next.js router to update URL (this will properly update useSearchParams)
        router.replace(`/manage?id=${updatedEntry.id}`, { scroll: false });
      }

      // Also save to localStorage as backup
      const currentEntries = entries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      );
      StorageManager.saveToLocalStorage(currentEntries, folders);
    } catch (error) {
      console.error("❌ Failed to save password:", error);
      // Show error to user
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to save password: ${errorMessage}`);
    } finally {
      setIsSaving(false); // Clear saving flag
    }
  };

  // 删除条目
  const handleDeleteEntry = async (entryId: string) => {
    if (isCreatingNew) {
      // 如果是新创建的条目，直接取消创建
      setIsCreatingNew(false);
      setSelectedEntry(entries.length > 0 ? entries[0] : null);
      return;
    }

    const confirmed = await confirm({
      title: "Delete Password",
      description: "are you sure to delete? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        setIsDeleting(true); // Start loading
        console.log("🗑️ Deleting password entry:", entryId);

        console.log("⚡ Deleting optimistically...");

        // Delete optimistically - instant local removal, background sync
        if (user?.databaseUser?.id) {
          await optimisticService.deletePasswordOptimistically(
            entryId,
            user.databaseUser.id
          );
        }

        // Update local state
        const updatedEntries = entries.filter((entry) => entry.id !== entryId);
        setEntries(updatedEntries);
        setFilteredEntries(updatedEntries);
        StorageManager.saveToLocalStorage(updatedEntries, folders);

        // 如果删除的是当前选中的条目，选择下一个
        if (selectedEntry?.id === entryId) {
          const currentIndex = filteredEntries.findIndex(
            (e) => e.id === entryId
          );
          const nextEntry =
            filteredEntries[currentIndex + 1] ||
            filteredEntries[currentIndex - 1] ||
            null;
          setSelectedEntry(nextEntry);
        }

        console.log("✅ Password entry deleted successfully");
      } catch (error) {
        console.error("❌ Failed to delete password:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        alert(`Failed to delete password: ${errorMessage}`);
      } finally {
        setIsDeleting(false); // End loading
      }
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "未知时间";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "无效日期";
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "日期错误";
    }
  };

  return (
    <>
      {/* Mobile Sidebar Toggle Button - Push Content */}

      {/* Mobile Sidebar Toggle Button - Push Content */}
      <div className="lg:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`sidebar-toggle-button p-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-64" : "translate-x-0"
          }`}
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
              d="M4 6h16M4 12h8M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="relative flex h-[calc(100vh-140px)] lg:h-[calc(100vh-73px)]">
        {/* Desktop Sidebar - Password List */}
        <div className="hidden lg:flex w-80 border-r bg-muted/30 flex-col">
          {/* Search */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={
                  ready ? t("password.searchPlaceholder") : "搜索密码..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                console.log("🔘 Manual Add New Password button clicked");
                handleCreateNew();
              }}
              disabled={isCreatingPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              variant="outline"
            >
              {isCreatingPassword ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("password.addNew")}
                </>
              )}
            </Button>
          </div>

          {/* Password List */}
          <div className="flex-1 overflow-y-auto">
            {!isDataLoaded ? (
              // Loading skeleton for desktop password list
              <div className="p-4 space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 rounded-xl animate-pulse"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                    </div>
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {filteredEntries.length === 0 && !isCreatingNew ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? "no matched password" : "no password item"}
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {/* 显示正在创建的新条目 */}
                    {isCreatingNew && selectedEntry && (
                      <div
                        key="new-entry"
                        className="p-3 rounded-lg cursor-pointer transition-colors bg-blue-50 border-2 border-dashed border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate text-blue-900 dark:text-blue-100">
                              {selectedEntry.title}
                            </h3>
                            <p className="text-sm opacity-70 truncate text-blue-700 dark:text-blue-300">
                              create password item
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                              >
                                {getCategoryName(selectedEntry.categoryId)}
                              </Badge>
                              <span className="text-xs opacity-60 text-blue-600 dark:text-blue-400">
                                just created
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 显示现有条目 */}
                    {filteredEntries.map((entry, index) => (
                      <div
                        key={entry.id || `entry-${index}`}
                        onClick={() => {
                          handleSelectEntry(entry);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md ${
                          selectedEntry?.id === entry.id && !isCreatingNew
                            ? "bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 scale-[1.01] shadow-sm"
                            : "hover:bg-muted border border-transparent"
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`font-medium truncate ${
                                selectedEntry?.id === entry.id && !isCreatingNew
                                  ? "text-blue-900 dark:text-blue-100"
                                  : ""
                              }`}
                            >
                              {entry.title}
                            </h3>
                            <p
                              className={`text-sm opacity-70 truncate ${
                                selectedEntry?.id === entry.id && !isCreatingNew
                                  ? "text-blue-700 dark:text-blue-300"
                                  : ""
                              }`}
                            >
                              {getUsernameDisplay(entry)}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  selectedEntry?.id === entry.id &&
                                  !isCreatingNew
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                    : ""
                                }`}
                              >
                                {getCategoryName(entry.categoryId)}
                              </Badge>
                              <span
                                className={`text-xs opacity-60 ${
                                  selectedEntry?.id === entry.id &&
                                  !isCreatingNew
                                    ? "text-blue-600 dark:text-blue-400"
                                    : ""
                                }`}
                              >
                                {formatDate(entry.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Sidebar Footer - Stats and Clear Data */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            {/* Entry Count */}
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="text-xs">
                {ready
                  ? t("stats.totalEntries", { count: entries.length })
                  : `共 ${entries.length} 个条目`}
              </Badge>
            </div>

            {/* Clear Data Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
              onClick={async () => {
                const confirmed = await confirm({
                  title: t("confirm.clearData.title"),
                  description: t("confirm.clearData.description"),
                  confirmText: t("confirm.clearData.confirmText"),
                  cancelText: t("confirm.clearData.cancelText"),
                  variant: "destructive",
                });
                if (confirmed) {
                  try {
                    console.log("🗑️ Clearing all data...");

                    // Clear encrypted database if user is authenticated
                    if (user?.databaseUser?.id) {
                      const response = await fetch("/api/passwords/clear-all", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          userId: user.databaseUser.id,
                        }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        console.error(
                          "❌ Failed to clear database:",
                          errorData
                        );
                        // Continue with local clear even if database clear fails
                      } else {
                        console.log("✅ Database cleared successfully");
                      }
                    }

                    // Clear all IndexedDB data
                    try {
                      console.log("🗑️ Clearing IndexedDB data...");

                      // Clear encrypted cache
                      await cacheService.clearAllCache();
                      console.log("✅ Encrypted cache cleared");

                      // Clear optimistic updates
                      await optimisticService.clearAllData();
                      console.log("✅ Optimistic updates cleared");

                      // Clear optimized load service cache
                      optimizedLoadService.destroy();
                      console.log("✅ Optimized load service cleared");
                    } catch (indexedDBError) {
                      console.error(
                        "❌ Failed to clear IndexedDB:",
                        indexedDBError
                      );
                      // Continue even if IndexedDB clear fails
                    }

                    // Clear localStorage
                    localStorage.clear();
                    console.log("✅ localStorage cleared");

                    // Clear sessionStorage
                    sessionStorage.clear();
                    console.log("✅ sessionStorage cleared");

                    // Clear auth state and reload
                    console.log("✅ All data cleared, reloading...");
                    window.location.reload();
                  } catch (error) {
                    console.error("❌ Failed to clear data:", error);
                    // Fallback to just clearing localStorage and sessionStorage
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }
                }
              }}
            >
              {t("nav.clearData")}
            </Button>
          </div>
        </div>

        {/* Mobile Sidebar - Password List */}
        <div
          className={`mobile-sidebar lg:hidden fixed inset-y-0 left-0 z-50 w-3/4 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ready ? t("nav.passwordList") : "password list"}
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

          {/* Search */}
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={
                  ready
                    ? t("password.searchPlaceholder")
                    : "searching password..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                console.log("🔘 Mobile Add New Password button clicked");
                handleCreateNew();
                setIsSidebarOpen(false);
              }}
              disabled={isCreatingPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              variant="outline"
            >
              {isCreatingPassword ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {ready ? t("password.addNew") : "添加新密码"}
                </>
              )}
            </Button>
          </div>

          {/* Password List */}
          <div className="flex-1 overflow-y-auto">
            {!isDataLoaded ? (
              // Loading skeleton for mobile password list
              <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 rounded-xl animate-pulse"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                    </div>
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredEntries.length === 0 && !isCreatingNew ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "没有找到匹配的密码" : "还没有密码条目"}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {/* 显示新创建的条目 */}
                {isCreatingNew && selectedEntry && (
                  <div
                    key="new-entry"
                    className="p-2 lg:p-3 rounded-lg cursor-pointer transition-colors bg-blue-50 border-2 border-dashed border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-blue-900 dark:text-blue-100">
                          {selectedEntry.title}
                        </h3>
                        <p className="text-sm opacity-70 truncate text-blue-700 dark:text-blue-300">
                          新建密码
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                          >
                            {getCategoryName(selectedEntry.categoryId)}
                          </Badge>
                          <span className="text-xs opacity-60 text-blue-600 dark:text-blue-400">
                            刚刚创建
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 显示现有条目 */}
                {filteredEntries.map((entry, index) => (
                  <div
                    key={entry.id || `entry-${index}`}
                    onClick={() => {
                      handleSelectEntry(entry);
                      setIsSidebarOpen(false);
                    }}
                    className={`p-2 lg:p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md ${
                      selectedEntry?.id === entry.id && !isCreatingNew
                        ? "bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 scale-[1.01] shadow-sm"
                        : "hover:bg-muted border border-transparent"
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium truncate ${
                            selectedEntry?.id === entry.id && !isCreatingNew
                              ? "text-blue-900 dark:text-blue-100"
                              : ""
                          }`}
                        >
                          {entry.title}
                        </h3>
                        <p
                          className={`text-sm opacity-70 truncate ${
                            selectedEntry?.id === entry.id && !isCreatingNew
                              ? "text-blue-700 dark:text-blue-300"
                              : ""
                          }`}
                        >
                          {getUsernameDisplay(entry)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              selectedEntry?.id === entry.id && !isCreatingNew
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                : ""
                            }`}
                          >
                            {getCategoryName(entry.categoryId)}
                          </Badge>
                          <span
                            className={`text-xs opacity-60 ${
                              selectedEntry?.id === entry.id && !isCreatingNew
                                ? "text-blue-600 dark:text-blue-400"
                                : ""
                            }`}
                          >
                            {formatDate(entry.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-white opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Right Content - Edit Form */}
        <div className="flex-1 flex flex-col">
          {!isDataLoaded ? (
            // Loading skeleton matching exact form structure
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6 space-y-8">
                {/* Header Section Skeleton */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Title and Favorite Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-400 rounded animate-pulse"></div>
                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="relative">
                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-pink-400 rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Folder Selection Skeleton */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                </div>

                {/* Secure Information Skeleton */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Type Selector Skeleton */}
                  <div className="mb-6">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl animate-pulse"
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="text-2xl">🔒</div>
                            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fields Skeleton */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        <div className="relative">
                          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Details Skeleton */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-52 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Tags */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-400 rounded animate-pulse"></div>
                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                    </div>
                    {/* Notes */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-400 rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded animate-pulse"></div>
                      <div className="h-10 w-24 bg-red-200 dark:bg-red-800 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-24 bg-red-200 dark:bg-red-800 rounded-lg animate-pulse"></div>
                      <div className="h-10 w-24 bg-blue-200 dark:bg-blue-800 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedEntry ? (
            <PasswordEditForm
              entry={selectedEntry}
              folders={folders}
              onSave={handleSaveEntry}
              onDelete={() => handleDeleteEntry(selectedEntry.id)}
              onCreateFolder={handleCreateFolder}
              isCreatingNew={isCreatingNew}
              isDeleting={isDeleting}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  select a password entry
                </h3>
                <p>select a password entry from the list to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay for Passwords API */}
      {isLoadingPasswords && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-sm mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin">
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Loading Passwords
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Decrypting your secure data...
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Secure connection established</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </>
  );
}

export default function ManagePasswordsPage() {
  return (
    <PasswordGuard>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header Skeleton */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg animate-pulse"></div>
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
                {/* Left Sidebar Skeleton */}
                <div className="lg:col-span-1">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg h-full">
                    {/* Search Bar Skeleton */}
                    <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-4"></div>
                      <div className="h-10 bg-blue-200 dark:bg-blue-800 rounded-lg animate-pulse"></div>
                    </div>

                    {/* Password List Skeleton */}
                    <div className="p-4 space-y-3">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-3 p-3 rounded-xl animate-pulse"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                          </div>
                          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Content Skeleton */}
                <div className="lg:col-span-2">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg h-full">
                    {/* Form Header Skeleton */}
                    <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields Skeleton */}
                    <div className="p-8 space-y-8">
                      {/* Basic Info Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                        </div>
                      </div>

                      {/* Secure Info Section */}
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                          </div>
                        </div>

                        {/* Type Selector Skeleton */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={i}
                              className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl animate-pulse"
                            >
                              <div className="flex flex-col items-center space-y-2">
                                <div className="text-2xl">🔒</div>
                                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Fields Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-3">
                              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons Skeleton */}
                      <div className="flex justify-between pt-6">
                        <div className="h-10 w-24 bg-red-200 dark:bg-red-800 rounded-lg animate-pulse"></div>
                        <div className="h-10 w-24 bg-blue-200 dark:bg-blue-800 rounded-lg animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Loading Indicator */}
            <div className="fixed bottom-8 right-8">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Loading passwords...
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <ManagePasswordsContent />
      </Suspense>
    </PasswordGuard>
  );
}
