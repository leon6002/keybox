"use client";

import { useState, useMemo } from "react";
import { Folder } from "@/types/password";
import {
  Plus,
  Check,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderService } from "@/services/folderService";

interface FolderSelectorProps {
  folders: Folder[];
  selectedFolder: string | null;
  onSelect: (folderId: string | null) => void;
  showAll?: boolean;
  allowCreate?: boolean;
  onCreateFolder?: (folderName: string) => void;
}

export default function FolderSelector({
  folders,
  selectedFolder,
  onSelect,
  showAll = true,
  allowCreate = false,
  onCreateFolder,
}: FolderSelectorProps) {
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Optimization states
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Configuration - using compact view only
  const FOLDERS_PER_PAGE = 20;

  const handleSelect = (folderId: string | null) => {
    onSelect(folderId);
  };

  const handleCreateFolder = () => {
    setIsCreating(true);
  };

  const handleSaveNewFolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setNewFolderName("");
    setIsCreating(false);
  };

  // Filter and paginate folders
  const filteredFolders = useMemo(() => {
    let filtered = folders;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (folder) =>
          folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          folder.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by recent usage (mock implementation - in real app, track usage)
    if (showRecent) {
      filtered = [...filtered].sort((a, b) => {
        // Mock recent usage - in real app, use actual usage data
        const aRecent =
          a.name.toLowerCase().includes("work") ||
          a.name.toLowerCase().includes("personal");
        const bRecent =
          b.name.toLowerCase().includes("work") ||
          b.name.toLowerCase().includes("personal");
        return bRecent ? 1 : aRecent ? -1 : 0;
      });
    }

    return filtered;
  }, [folders, searchQuery, showRecent]);

  // Paginate folders
  const paginatedFolders = useMemo(() => {
    const startIndex = (currentPage - 1) * FOLDERS_PER_PAGE;
    const endIndex = startIndex + FOLDERS_PER_PAGE;
    return filteredFolders.slice(startIndex, endIndex);
  }, [filteredFolders, currentPage]);

  const totalPages = Math.ceil(filteredFolders.length / FOLDERS_PER_PAGE);
  const shouldShowPagination = filteredFolders.length > FOLDERS_PER_PAGE;

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Folder ({filteredFolders.length}{" "}
          {filteredFolders.length === 1 ? "folder" : "folders"})
        </div>

        {folders.length > 6 && (
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Search folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 h-8 w-32 text-xs bg-white/50 dark:bg-gray-900/50 border-gray-300/50 dark:border-gray-600/50 rounded-lg"
              />
            </div>

            {/* Recent Toggle */}
            <button
              onClick={() => setShowRecent(!showRecent)}
              className={`p-1 rounded transition-colors ${
                showRecent
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              title="Show recent folders first"
            >
              <Clock className="w-3 h-3" />
            </button>

            {/* Collapse Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Folder Selection Buttons */}
      {isExpanded && (
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
          {/* All Folders Option */}
          {showAll && (
            <button
              onClick={() => handleSelect(null)}
              onMouseEnter={() => setHoveredFolder("all")}
              onMouseLeave={() => setHoveredFolder(null)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                !selectedFolder
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
              } ${hoveredFolder === "all" ? "scale-105 shadow-lg" : ""}`}
            >
              {/* Selection Indicator */}
              {!selectedFolder && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Folder Icon */}
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">📁</div>
                <div className="text-sm font-medium text-center">
                  <div className="text-gray-900 dark:text-white">
                    All Folders
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Show all entries
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Individual Folders */}
          {paginatedFolders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => handleSelect(folder.id)}
              onMouseEnter={() => setHoveredFolder(folder.id)}
              onMouseLeave={() => setHoveredFolder(null)}
              className={`relative p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                selectedFolder === folder.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
              } ${hoveredFolder === folder.id ? "scale-105 shadow-lg" : ""}`}
              style={{
                borderColor:
                  selectedFolder === folder.id ? folder.color : undefined,
                backgroundColor:
                  selectedFolder === folder.id
                    ? `${folder.color}10`
                    : undefined,
              }}
            >
              {/* Selection Indicator */}
              {selectedFolder === folder.id && (
                <div
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: folder.color }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Folder Icon and Info */}
              <div className="flex flex-row items-center space-x-2">
                <div className="text-lg">{folder.icon}</div>
                <div className="text-xs font-medium text-left">
                  <div className="text-gray-900 dark:text-white truncate">
                    {folder.name}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {/* Add New Folder Button or Creation Form */}
          {allowCreate && (
            <>
              {!isCreating ? (
                <button
                  onClick={handleCreateFolder}
                  onMouseEnter={() => setHoveredFolder("create")}
                  onMouseLeave={() => setHoveredFolder(null)}
                  className={`p-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer group ${
                    hoveredFolder === "create"
                      ? "scale-105 shadow-lg bg-blue-50 dark:bg-blue-950/20"
                      : ""
                  }`}
                >
                  <div className="flex flex-row items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <div className="text-xs font-medium text-left">
                      <div className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Add Folder
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="p-2 rounded-xl border-2 border-blue-400 bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name..."
                      className="text-xs h-6 flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveNewFolder();
                        } else if (e.key === "Escape") {
                          handleCancelCreate();
                        }
                      }}
                    />
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        onClick={handleSaveNewFolder}
                        disabled={!newFolderName.trim()}
                        className="h-6 px-2 text-xs"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelCreate}
                        className="h-6 px-2 text-xs"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {isExpanded && shouldShowPagination && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * FOLDERS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * FOLDERS_PER_PAGE, filteredFolders.length)}{" "}
            of {filteredFolders.length} folders
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-7 px-2 text-xs"
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="h-7 w-7 p-0 text-xs"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-xs text-gray-400">...</span>
                  <Button
                    variant={currentPage === totalPages ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="h-7 w-7 p-0 text-xs"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="h-7 px-2 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {folders.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-lg mb-2">📁</div>
          <div className="text-sm">No folders yet</div>
          <div className="text-xs mt-1">
            Create your first folder to organize passwords
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified folder filter for toolbar/header use
export function FolderFilter({
  folders,
  selectedFolder,
  onSelect,
}: Omit<FolderSelectorProps, "showAll" | "allowCreate" | "onCreateFolder">) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedFolderData = folders.find(
    (folder) => folder.id === selectedFolder
  );

  const handleSelect = (folderId: string | null) => {
    onSelect(folderId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
        title="Filter by folder"
      >
        <span className="text-sm">
          {selectedFolderData ? selectedFolderData.icon : "📁"}
        </span>
        <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedFolderData ? selectedFolderData.name : "All"}
        </span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
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

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
            <div className="py-1">
              <button
                onClick={() => handleSelect(null)}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  !selectedFolder
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span>📁</span>
                <span>All Folders</span>
              </button>

              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleSelect(folder.id)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    selectedFolder === folder.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span>{folder.icon}</span>
                  <span className="truncate">{folder.name}</span>
                  <div
                    className="w-2 h-2 rounded-full ml-auto"
                    style={{ backgroundColor: folder.color }}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
