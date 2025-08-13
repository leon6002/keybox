"use client";

import { usePathname } from "next/navigation";
import PasswordNavHeader from "@/components/Header";

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 根据当前路径确定页面类型
  const getCurrentPage = (): "passwords" | "manage" => {
    if (pathname.startsWith("/passwords")) {
      return "passwords";
    } else if (pathname.startsWith("/manage")) {
      return "manage";
    }
    return "manage"; // 默认值
  };

  return (
    <div className="min-h-screen bg-background">
      <PasswordNavHeader currentPage={getCurrentPage()} />
      {children}
    </div>
  );
}
