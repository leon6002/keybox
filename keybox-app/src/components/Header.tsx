"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Upload,
  FileText,
  Settings,
  Menu,
  Key,
  Edit,
} from "lucide-react";
import { PasswordEntry } from "@/types/password";

interface HeaderProps {
  onImportExport: () => void;
  onQuickImport: () => void;
  onQuickExport: () => void;
  onCategoryManager: () => void;
  entriesCount: number;
  entries: PasswordEntry[];
}

export default function Header({
  onImportExport,
  onQuickImport,
  onQuickExport,
  onCategoryManager,
  entriesCount,
  entries,
}: HeaderProps) {
  const router = useRouter();

  const handleManageClick = () => {
    if (!entries || entries.length === 0) {
      // 如果没有密码，跳转到添加页面
      router.push("/add");
    } else {
      // 如果有密码，跳转到密码列表页面
      router.push("/manage");
    }
  };
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">PandaKeyBox</h1>
              <p className="text-sm text-muted-foreground">安全密码管理器</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{entriesCount}</div>
              <div className="text-sm text-muted-foreground">密码条目</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Import Button */}
            <Button
              onClick={onQuickImport}
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">导入</span>
            </Button>

            {/* Quick Export Button */}
            <Button
              onClick={onQuickExport}
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">导出</span>
            </Button>

            {/* Manage Passwords Button */}
            <Button onClick={handleManageClick} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">
                {!entries || entries.length === 0 ? "添加密码" : "管理"}
              </span>
            </Button>

            {/* Menu Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* 移动端快速导入导出 */}
                <div className="sm:hidden">
                  <DropdownMenuItem onClick={onQuickImport}>
                    <Upload className="w-4 h-4 mr-2" />
                    快速导入
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={onQuickExport}>
                    <Download className="w-4 h-4 mr-2" />
                    快速导出
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem onClick={onImportExport}>
                  <FileText className="w-4 h-4 mr-2" />
                  高级导入/导出
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleManageClick}>
                  <Edit className="w-4 h-4 mr-2" />
                  {!entries || entries.length === 0 ? "添加密码" : "密码管理"}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onCategoryManager}>
                  <Settings className="w-4 h-4 mr-2" />
                  类目管理
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <div className="px-2 py-1.5">
                  <div className="text-xs text-muted-foreground mb-1">
                    存储信息
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {entriesCount} 个条目
                  </Badge>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="md:hidden mt-4 pt-4 border-t">
          <div className="flex justify-center">
            <div className="text-center">
              <div className="text-xl font-bold">{entriesCount}</div>
              <div className="text-sm text-muted-foreground">密码条目</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
