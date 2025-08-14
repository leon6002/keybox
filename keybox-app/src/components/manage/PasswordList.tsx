import { PasswordEntry } from "@/types/password";
import { Badge } from "@/components/ui/badge";

interface PasswordListProps {
  entries: PasswordEntry[];
  searchQuery: string;
  handleSelectEntry: (entry: PasswordEntry) => void;
  selectedEntry: PasswordEntry | null;
  getFolderName: (folderId: string) => string;
  mobile: boolean;
}
export const PasswordList = ({
  entries,
  searchQuery,
  handleSelectEntry,
  selectedEntry,
  getFolderName,
  mobile = false,
}: PasswordListProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "invalid date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "formatDate error";
    }
  };
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

    return " ";
  };
  return (
    <>
      {mobile && (
        <div className="space-y-2 p-2">
          {entries.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? "no matching password entry" : "no password entry"}
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.id || `entry-${index}`}
                  onClick={() => {
                    handleSelectEntry(entry);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md ${
                    selectedEntry?.id === entry.id
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
                          selectedEntry?.id === entry.id
                            ? "text-blue-900 dark:text-blue-100"
                            : ""
                        }`}
                      >
                        {entry.title}
                      </h3>
                      <p
                        className={`text-sm opacity-70 truncate ${
                          selectedEntry?.id === entry.id
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
                            selectedEntry?.id === entry.id
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                              : ""
                          }`}
                        >
                          {getFolderName(entry.folderId)}
                        </Badge>
                        <span
                          className={`text-xs opacity-60 ${
                            selectedEntry?.id === entry.id
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
      {!mobile && (
        <div className="space-y-2 p-2">
          {entries.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? "no matching password entry" : "no password entry"}
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.id || `entry-${index}`}
                  onClick={() => {
                    handleSelectEntry(entry);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md ${
                    selectedEntry?.id === entry.id
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
                          selectedEntry?.id === entry.id
                            ? "text-blue-900 dark:text-blue-100"
                            : ""
                        }`}
                      >
                        {entry.title}
                      </h3>
                      <p
                        className={`text-sm opacity-70 truncate ${
                          selectedEntry?.id === entry.id
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
                            selectedEntry?.id === entry.id
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                              : ""
                          }`}
                        >
                          {getFolderName(entry.folderId)}
                        </Badge>
                        <span
                          className={`text-xs opacity-60 ${
                            selectedEntry?.id === entry.id
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
    </>
  );
};
