import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordListSkeleton } from "@/components/manage/PasswordListSkeleton";
import { PasswordList } from "@/components/manage/PasswordList";
import { PasswordEntry } from "@/types/password";
import { Badge } from "@/components/ui/badge";

interface DesktopSidebarProps {
  entries: PasswordEntry[];
  searchQuery: string;
  handleSelectEntry: (entry: PasswordEntry) => void;
  selectedEntry: PasswordEntry | null;
  getFolderName: (folderId: string) => string;
  handleCreateNew: () => void;
  isCreatingPassword: boolean;
  isDataLoaded: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearData: () => void;
}
export const DesktopSidebar = (props: DesktopSidebarProps) => {
  return (
    <div className="hidden lg:flex w-80 border-r bg-muted/30 flex-col">
      {/* Search */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={"search passwords..."}
            value={props.searchQuery}
            onChange={props.handleInputChange}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => {
            console.log("🔘 Manual Add New Password button clicked");
            props.handleCreateNew();
          }}
          disabled={props.isCreatingPassword}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          variant="outline"
        >
          {props.isCreatingPassword ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add New Password
            </>
          )}
        </Button>
      </div>

      {/* Password List */}
      <div className="flex-1 overflow-y-auto">
        {!props.isDataLoaded ? (
          <PasswordListSkeleton mobile={false} />
        ) : (
          <PasswordList
            entries={props.entries}
            searchQuery={props.searchQuery}
            handleSelectEntry={props.handleSelectEntry}
            selectedEntry={props.selectedEntry}
            getFolderName={props.getFolderName}
            mobile={false}
          />
        )}
      </div>

      {/* Desktop Sidebar Footer - Stats and Clear Data */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
        {/* Entry Count */}
        <div className="flex items-center justify-center">
          <Badge variant="secondary" className="text-xs">
            {`total ${props.entries.length} entries`}
          </Badge>
        </div>

        {/* Clear Data Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
          onClick={props.handleClearData}
        >
          clear data
        </Button>
      </div>
    </div>
  );
};
