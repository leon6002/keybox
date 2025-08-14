"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit3 } from "lucide-react";
import { PasswordEntry, Folder } from "@/types/password";
import { SearchEngine } from "@/utils/search";
import PasswordEditForm from "@/components/PasswordEditForm";
import { useConfirm } from "@/hooks/useConfirm";
import { EncryptedCacheService } from "@/lib/storage/encryptedCacheService";
import { OptimisticUpdateService } from "@/lib/storage/optimisticUpdateService";
import { OptimizedLoadService } from "@/lib/storage/optimizedLoadService";
import { useAuth } from "@/contexts/AuthContext";
import PasswordGuard from "@/components/auth/PasswordGuard";

import { FolderService } from "@/services/folderService";
import { FolderManager } from "@/utils/folders";
import toast from "react-hot-toast";
import PasswordEditFormSkeleton from "@/components/manage/PasswordEditFormSkeleton";
import { PasswordLoadingOverlay } from "@/components/manage/PasswordLoadingOverlay";
import { ManagePageSkeleton } from "@/components/manage/ManagePageSkeleton";
import { PasswordListSkeleton } from "@/components/manage/PasswordListSkeleton";
import { PasswordList } from "@/components/manage/PasswordList";
import { PasswordTypeManager } from "@/utils/PasswordTypes";
import { DebugPanel } from "@/components/DebugPanel";
import { MobileSideBar } from "@/components/manage/MobileSideBar";
import { DesktopSidebar } from "@/components/manage/DesktopSidebar";

function ManagePasswordsContent() {
  const router = useRouter();
  const { t, ready } = useTranslation();
  const { user, getUserKey } = useAuth();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("id");

  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [folders, setFolders] = useState<Folder[]>(
    FolderService.getCommonFolders()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<PasswordEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(
    null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Flag to prevent redirect during save
  const [isCreatingPassword, setIsCreatingPassword] = useState(false); // Loading state for add password button
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete operation
  const [isLoadingPasswords, setIsLoadingPasswords] = useState(false); // Loading state for /passwords/load API
  const [servicesInitialized, setServicesInitialized] = useState(false); // Track if services are initialized
  const [cacheService] = useState(() => EncryptedCacheService.getInstance());
  const [optimisticService] = useState(() =>
    OptimisticUpdateService.getInstance()
  );
  const [optimizedLoadService] = useState(() =>
    OptimizedLoadService.getInstance()
  );
  const { confirm, ConfirmDialog } = useConfirm();

  // Debug logging
  console.log("🔍 ManagePasswordsContent render - Component state:", {
    hasUser: !!user,
    hasDatabaseUser: !!user?.databaseUser?.id,
    isVaultUnlocked: user?.isVaultUnlocked,
    vaultUnlocked: user?.isVaultUnlocked,
    userKeyAvailable: !!getUserKey(),
    entriesCount: entries.length,
    filteredEntriesCount: filteredEntries.length,
    isDataLoaded,
    isLoadingPasswords,
    entryId,
    userObject: user,
  });

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

    setSelectedEntry(entry);
    // 更新 URL 但不刷新页面
    const newUrl = `/manage?id=${entry.id}`;
    window.history.replaceState(null, "", newUrl);
  };

  // Initialize services
  useEffect(() => {
    Promise.all([cacheService.initialize(), optimisticService.initialize()])
      .then(() => {
        // Set up user key getter for background sync and optimized loading
        optimisticService.setUserKeyGetter(getUserKey);
        optimizedLoadService.setUserKeyGetter(getUserKey);
        setServicesInitialized(true);
        console.log("✅ Services initialized successfully");
      })
      .catch((error) => {
        console.error("❌ Failed to initialize services:", error);
        setServicesInitialized(false);
      });
  }, [cacheService, optimisticService, optimizedLoadService, getUserKey]);

  // 创建新密码的核心逻辑 - 直接创建数据库条目
  const createNewPasswordEntry = useCallback(async () => {
    try {
      setIsCreatingPassword(true); // Start loading
      console.log("⚡ Creating new password entry with optimistic update...");

      if (!user?.databaseUser?.id || !user?.isVaultUnlocked) {
        console.error("❌ Cannot create password - vault not unlocked");
        toast.error("Please unlock your vault first");
        setIsCreatingPassword(false);
        return;
      }

      // Create minimal password entry
      const now = new Date().toISOString();
      const newEntry: PasswordEntry = {
        id: crypto.randomUUID(), // Generate real UUID locally
        title: generateNewPasswordTitle(),
        folderId: FolderManager.COMMON_FOLDER_IDS.PERSONAL,
        customFields: PasswordTypeManager.getDefaultFields(),
        tags: [],
        isFavorite: false,
        username: "",
        password: "",
        website: "",
        description: "Click to edit and add details",
        notes: "",
        createdAt: now,
        updatedAt: now,
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

      console.log("✅ Password entry created optimistically:", newEntry.id);

      // Navigate to the new entry immediately
      router.replace(`/manage?id=${newEntry.id}`, { scroll: false });

      console.log(
        "🚀 New password entry created optimistically and ready for editing"
      );
      console.log("� Background sync will automatically sync to Supabase");
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
  }, [user, router, optimisticService, entries]);

  const generateNewPasswordTitle = () => {
    const timeString = new Date()
      .toLocaleTimeString("en-US", {
        hour: "2-digit", // Ensures two digits for hour (e.g., "07" instead of "7")
        minute: "2-digit", // Ensures two digits for minute
        second: "2-digit", // Ensures two digits for second
        hour12: false, // Forces 24-hour format
      })
      .replace(/:/g, "");
    return `new_${timeString}`;
  };

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

  // 加载数据 - 在组件初始化时运行
  useEffect(() => {
    console.log(
      "📥 Data loading useEffect triggered, isDataLoaded:",
      isDataLoaded
    );
    console.log("📥 User state:", {
      hasUser: !!user,
      hasDatabaseUser: !!user?.databaseUser?.id,
      isVaultUnlocked: user?.isVaultUnlocked,
      userKeyAvailable: !!getUserKey(),
      servicesInitialized,
    });

    // Load data if vault is unlocked and we have a user and data is not loaded yet and services are initialized
    if (
      user?.databaseUser?.id &&
      user?.isVaultUnlocked &&
      getUserKey() &&
      !isDataLoaded &&
      servicesInitialized
    ) {
      console.log("📥 Starting password loading...");
      console.log("📥 All requirements met for loading:", {
        userId: user.databaseUser.id,
        isVaultUnlocked: user.isVaultUnlocked,
        hasUserKey: !!getUserKey(),
        userKeyLength: getUserKey()?.length,
      });
      // Load passwords directly in useEffect to avoid dependency issues
      const loadPasswords = async () => {
        try {
          setIsLoadingPasswords(true);

          console.log("⚡ Loading passwords with optimized service...");
          console.log("🔍 User ID for loading:", user.databaseUser?.id);

          // Check if this might be a page refresh (no entries loaded yet)
          const isPageRefresh = entries.length === 0 && !isDataLoaded;
          console.log("🔄 Is page refresh?", isPageRefresh);
          console.log("🔄 Current entries count:", entries.length);

          // Use optimized loading service for instant results
          const result = await optimizedLoadService.loadPasswordsOptimized(
            user.databaseUser!.id,
            {
              limit: 100,
              decryptionBatchSize: 20,
              forceRefresh: isPageRefresh, // Force refresh on page refresh
            }
          );

          console.log(
            `✅ Loaded ${result.entries.length} passwords (from ${
              result.isFromCache ? "cache" : "API"
            })`
          );

          // If no entries were loaded, always try force refresh
          if (result.entries.length === 0) {
            console.log("🔄 No entries loaded, trying force refresh...");
            try {
              const freshResult = await optimizedLoadService.forceRefresh(
                user.databaseUser!.id
              );
              console.log(
                `🔄 Force refresh loaded ${freshResult.entries.length} entries`
              );

              if (freshResult.entries.length > 0) {
                const sortedFreshEntries = [...freshResult.entries].sort(
                  (a, b) => {
                    const dateA = new Date(a.createdAt || a.updatedAt || 0);
                    const dateB = new Date(b.createdAt || b.updatedAt || 0);
                    return dateB.getTime() - dateA.getTime();
                  }
                );

                setEntries(sortedFreshEntries);
                setFilteredEntries(sortedFreshEntries);
                const foldersToSet =
                  freshResult.folders.length > 0
                    ? freshResult.folders
                    : FolderService.getCommonFolders();
                setFolders(foldersToSet);
                setIsDataLoaded(true);
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
          const foldersToSet =
            result.folders.length > 0
              ? result.folders
              : FolderService.getCommonFolders();
          setFolders(foldersToSet);
          setIsDataLoaded(true);
        } catch (error) {
          console.error("❌ Failed to load encrypted passwords:", error);
          setFolders(FolderService.getCommonFolders());
        } finally {
          setIsLoadingPasswords(false);
        }
      };

      loadPasswords();
    } else if (
      !user?.databaseUser?.id ||
      !user?.isVaultUnlocked ||
      !getUserKey() ||
      !servicesInitialized
    ) {
      console.log("📥 Skipping data load - requirements not met:", {
        hasDatabaseUser: !!user?.databaseUser?.id,
        databaseUserId: user?.databaseUser?.id,
        isVaultUnlocked: user?.isVaultUnlocked,
        hasUserKey: !!getUserKey(),
        userKeyLength: getUserKey()?.length,
        servicesInitialized,
      });
      // Reset data loaded state if requirements are not met
      if (isDataLoaded) {
        setIsDataLoaded(false);
        setEntries([]);
        setFilteredEntries([]);
      }
    } else {
      console.log("📥 Data already loaded, skipping reload");
    }
  }, [
    user,
    isDataLoaded,
    getUserKey,
    optimizedLoadService,
    servicesInitialized,
  ]);

  // parse URL params and select entry
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
      } else {
        console.log("🔗 Entry not found for ID:", entryId);
        // Entry not found, could be still loading or invalid ID
        // Don't redirect, just wait for data to load
      }
    } else if (entries.length > 0 && !selectedEntry && !entryId) {
      // No specific entry requested, select the first one
      console.log("🔗 No entry ID, selecting first entry");
      setSelectedEntry(entries[0]);
    }
  }, [entryId, entries, selectedEntry, isDataLoaded, isSaving]);

  // saerch filter
  useEffect(() => {
    let filtered = entries;

    if (searchQuery.trim()) {
      const results = SearchEngine.search(entries, searchQuery);
      filtered = results.map((result) => result.entry);
    }

    // sort date new to old
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

  const getFolderName = (folderId: string | undefined) => {
    if (!folderId) return "no name";
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || "no name";
  };

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
      const shouldCreateNew = !isValidUUID;

      console.log("🔍 Entry analysis:", {
        entryId: updatedEntry.id,
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

      // Update local state optimistically (no need to reload from database)
      const updatedEntries = entries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      );
      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);
      setSelectedEntry(updatedEntry);

      console.log("� Background sync will automatically sync to Supabase");

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
    } catch (error) {
      console.error("❌ Failed to save password:", error);
      // Show error to user
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to save password: ${errorMessage}`);
    } finally {
      setIsSaving(false); // Clear saving flag
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const confirmed = await confirm({
      title: "Delete Password",
      description: "are you sure to delete? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        setIsDeleting(true);
        console.log("🗑️ Deleting password entry optimistically:", entryId);

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

        // If the deleted entry was the selected one, select the next one
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
        toast.error(`Failed to delete password: ${errorMessage}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleClearData = async () => {
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
            console.error("❌ Failed to clear database:", errorData);
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
          console.error("❌ Failed to clear IndexedDB:", indexedDBError);
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
  };

  return (
    <>
      {/* Debug Panel - Remove this after debugging */}
      {/* <DebugPanel /> */}

      {/* Mobile Sidebar Toggle Button - Push Content */}
      <MobileSideBar
        handleClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <div className="relative flex h-[calc(100vh-140px)] lg:h-[calc(100vh-73px)]">
        {/* Desktop Sidebar - Password List */}
        <DesktopSidebar
          entries={filteredEntries}
          searchQuery={searchQuery}
          handleSelectEntry={handleSelectEntry}
          selectedEntry={selectedEntry}
          getFolderName={getFolderName}
          handleCreateNew={handleCreateNew}
          isCreatingPassword={isCreatingPassword}
          isDataLoaded={isDataLoaded}
          handleInputChange={(e) => setSearchQuery(e.target.value)}
          handleClearData={handleClearData}
        />

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
                  {ready ? t("password.addNew") : "add new password"}
                </>
              )}
            </Button>
          </div>

          {/* Mobile Password List */}
          <div className="flex-1 overflow-y-auto">
            {!isDataLoaded ? (
              // Loading skeleton for mobile password list
              <PasswordListSkeleton mobile={true} />
            ) : filteredEntries.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "no result find" : "no password yet"}
              </div>
            ) : (
              <PasswordList
                entries={filteredEntries}
                searchQuery={searchQuery}
                handleSelectEntry={handleSelectEntry}
                selectedEntry={selectedEntry}
                getFolderName={getFolderName}
                mobile={true}
              />
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
            <PasswordEditFormSkeleton />
          ) : selectedEntry ? (
            <PasswordEditForm
              entry={selectedEntry}
              folders={folders}
              onSave={handleSaveEntry}
              onDelete={() => handleDeleteEntry(selectedEntry.id)}
              onCreateFolder={handleCreateFolder}
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

      {isLoadingPasswords && <PasswordLoadingOverlay />}

      <ConfirmDialog />
    </>
  );
}

export default function ManagePasswordsPage() {
  return (
    <PasswordGuard>
      <Suspense fallback={<ManagePageSkeleton />}>
        <ManagePasswordsContent />
      </Suspense>
    </PasswordGuard>
  );
}
