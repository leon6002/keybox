"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PasswordEntry, Folder } from "@/types/password";
import { useAuth } from "@/contexts/AuthContext";
import { OptimisticUpdateService } from "@/lib/storage/optimisticUpdateService";
import { OptimizedLoadService } from "@/lib/storage/optimizedLoadService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Star,
  Globe,
  CreditCard,
  Briefcase,
  Shield,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  MoreHorizontal,
  AlertTriangle,
  Users,
} from "lucide-react";
import PasswordViewModal from "@/components/PasswordViewModal";

// Password Display Card Component
interface PasswordDisplayCardProps {
  entry: PasswordEntry;
  index: number;
  onView: (entry: PasswordEntry) => void;
  getFolderName: (folderId: string) => string;
  folderIcons: Record<string, any>;
  passwordTypeIcons: Record<string, any>;
}

function PasswordDisplayCard({
  entry,
  index,
  onView,
  getFolderName,
  folderIcons,
  passwordTypeIcons,
}: PasswordDisplayCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getFavicon = (url: string) => {
    if (!url) return "";
    try {
      const domain = new URL(url.startsWith("http") ? url : `https://${url}`)
        .hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return "";
    }
  };

  const TypeIcon =
    passwordTypeIcons[entry.passwordType || "default"] ||
    passwordTypeIcons.default;
  const FolderIcon =
    folderIcons[getFolderName(entry.folderId)?.toLowerCase()] ||
    folderIcons.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
        onClick={() => onView(entry)}
      >
        <CardContent className="p-6">
          {/* Header with site info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Site favicon or type icon */}
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                {entry.website && getFavicon(entry.website) ? (
                  <img
                    src={getFavicon(entry.website)}
                    alt=""
                    className="w-6 h-6 rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <TypeIcon className="w-6 h-6 text-blue-600" />
              </div>

              {/* Entry title and website */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate mb-1">
                  {entry.title}
                </h3>
                {entry.website && (
                  <a
                    href={
                      entry.website.startsWith("http")
                        ? entry.website
                        : `https://${entry.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit site
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle favorite functionality
                }}
              >
                <Star
                  className={`w-4 h-4 ${
                    entry.isFavorite
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  // More actions menu
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Username field */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 mb-1">Username</span>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(entry.username || "", "username");
                }}
              >
                <Copy
                  className={`w-3 h-3 ${
                    copiedField === "username" ? "text-green-600" : ""
                  }`}
                />
              </Button>
            </div>
            <div className="text-sm font-medium text-slate-900 truncate">
              {entry.username || "No username"}
            </div>
          </div>

          {/* Password field */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 mb-1">Password</span>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(entry.password || "", "password");
                  }}
                >
                  <Copy
                    className={`w-3 h-3 ${
                      copiedField === "password" ? "text-green-600" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="text-sm font-medium text-slate-900 font-mono">
              {showPassword ? entry.password : "••••••••"}
            </div>
          </div>

          {/* Folder and type info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Folder badge */}
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 text-xs"
              >
                <FolderIcon className="w-3 h-3 mr-1" />
                {getFolderName(entry.folderId)}
              </Badge>

              {/* Password type badge */}
              {entry.passwordType && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 text-xs"
                >
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {entry.passwordType}
                </Badge>
              )}
            </div>

            {/* Created date */}
            <div className="text-xs text-slate-500">
              {new Date(entry.createdAt).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Folder icons mapping
const folderIcons: Record<string, any> = {
  work: Briefcase,
  personal: Users,
  social: Globe,
  finance: CreditCard,
  shopping: CreditCard,
  entertainment: Star,
  education: Shield,
  health: Shield,
  default: Shield,
};

// Password type icons
const passwordTypeIcons: Record<string, any> = {
  website: Globe,
  database: Shield,
  "bank-card": CreditCard,
  social: Globe,
  email: Globe,
  server: Shield,
  api: Shield,
  default: Shield,
};

export default function PasswordsPage() {
  const router = useRouter();
  const { user, getUserKey } = useAuth();
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selectedPasswordType, setSelectedPasswordType] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(
    null
  );
  const [showPasswordView, setShowPasswordView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [optimisticService] = useState(() =>
    OptimisticUpdateService.getInstance()
  );
  const [optimizedLoadService] = useState(() =>
    OptimizedLoadService.getInstance()
  );

  // Initialize services
  useEffect(() => {
    Promise.all([optimisticService.initialize()])
      .then(() => {
        optimisticService.setUserKeyGetter(getUserKey);
        optimizedLoadService.setUserKeyGetter(getUserKey);
      })
      .catch((error) => {
        console.error("❌ Failed to initialize services:", error);
      });
  }, [optimisticService, optimizedLoadService, getUserKey]);
  // Load passwords using optimized service
  const loadPasswords = useCallback(async () => {
    if (!user?.databaseUser?.id || !user?.isVaultUnlocked) {
      console.log("📥 User not authenticated or vault locked");
      return;
    }

    try {
      setIsLoading(true);
      console.log("⚡ Loading passwords for display page...");

      // Use optimized loading service for instant results
      const result = await optimizedLoadService.loadPasswordsOptimized(
        user.databaseUser.id,
        {
          limit: 200, // Load more for display page
          decryptionBatchSize: 30,
        }
      );

      console.log(`✅ Loaded ${result.entries.length} passwords for display`);

      // Sort by creation date (newest first)
      const sortedEntries = [...result.entries].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setEntries(sortedEntries);
      setFolders(result.folders);
    } catch (error) {
      console.error("❌ Failed to load passwords:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, optimizedLoadService]);

  // Load data when user is authenticated
  useEffect(() => {
    if (user?.databaseUser?.id && user?.isVaultUnlocked && getUserKey()) {
      loadPasswords();
    }
  }, [user, loadPasswords, getUserKey]);

  // Filter passwords based on search, folder, and password type
  const filteredEntries = entries.filter((entry) => {
    // Search filter
    const matchesSearch =
      entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Folder filter
    const matchesFolder =
      selectedFolder === "all" || entry.folderId === selectedFolder;

    // Password type filter
    const matchesPasswordType =
      selectedPasswordType === "all" ||
      entry.passwordType === selectedPasswordType;

    return matchesSearch && matchesFolder && matchesPasswordType;
  });

  // Get folder name helper
  const getFolderName = (folderId: string): string => {
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || "Unknown Folder";
  };

  // Get unique password types from entries
  const passwordTypes: string[] = [
    "all",
    ...new Set(entries.map((e) => e.passwordType).filter(Boolean) as string[]),
  ];

  // Get stats for display
  const totalPasswords = entries.length;
  const favoritePasswords = entries.filter((e) => e.isFavorite).length;

  // Show loading state if user not ready
  if (!user || !user.isVaultUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading your passwords...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Password Vault
            </h1>
            <p className="text-slate-600">
              Browse and search all your passwords
            </p>
          </div>
          <Button
            onClick={() => router.push("/manage")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Password
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Total Passwords
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? "..." : totalPasswords}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Favorites
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? "..." : favoritePasswords}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Star className="w-6 h-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Folders
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? "..." : folders.length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Types
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? "..." : passwordTypes.length - 1}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search passwords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 rounded-lg border border-gray-200 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Folder Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Filter by Folder
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedFolder === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFolder("all")}
              className={`rounded-full ${
                selectedFolder === "all"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white hover:bg-blue-50 border-gray-200"
              }`}
            >
              All Folders
            </Button>
            {folders.map((folder) => {
              const FolderIcon =
                folderIcons[folder.name?.toLowerCase()] || folderIcons.default;
              return (
                <Button
                  key={folder.id}
                  variant={selectedFolder === folder.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`rounded-full ${
                    selectedFolder === folder.id
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white hover:bg-blue-50 border-gray-200"
                  }`}
                >
                  <FolderIcon className="w-4 h-4 mr-2" />
                  {folder.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Password Type Filters */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Filter by Type
          </h3>
          <div className="flex flex-wrap gap-2">
            {passwordTypes.map((type) => {
              const TypeIcon =
                passwordTypeIcons[type] || passwordTypeIcons.default;
              return (
                <Button
                  key={type}
                  variant={
                    selectedPasswordType === type ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedPasswordType(type)}
                  className={`rounded-full ${
                    selectedPasswordType === type
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white hover:bg-blue-50 border-gray-200"
                  }`}
                >
                  {type !== "all" && <TypeIcon className="w-4 h-4 mr-2" />}
                  {type === "all"
                    ? "All Types"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Password Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-6 shadow-sm animate-pulse border border-gray-200"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredEntries.length > 0 ? (
              <motion.div
                key="passwords"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredEntries.map((entry, index) => (
                  <PasswordDisplayCard
                    key={entry.id}
                    entry={entry}
                    index={index}
                    onView={(entry) => {
                      setSelectedEntry(entry);
                      setShowPasswordView(true);
                    }}
                    getFolderName={getFolderName}
                    folderIcons={folderIcons}
                    passwordTypeIcons={passwordTypeIcons}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {searchTerm ||
                  selectedFolder !== "all" ||
                  selectedPasswordType !== "all"
                    ? "No passwords found"
                    : "Your vault is empty"}
                </h3>
                <p className="text-slate-600 mb-8">
                  {searchTerm ||
                  selectedFolder !== "all" ||
                  selectedPasswordType !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first password to get started"}
                </p>
                {!searchTerm &&
                  selectedFolder === "all" &&
                  selectedPasswordType === "all" && (
                    <Button
                      onClick={() => router.push("/manage")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Password
                    </Button>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Password View Modal */}
        <AnimatePresence>
          {showPasswordView && selectedEntry && (
            <PasswordViewModal
              isOpen={showPasswordView}
              entry={selectedEntry}
              onClose={() => {
                setShowPasswordView(false);
                setSelectedEntry(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
