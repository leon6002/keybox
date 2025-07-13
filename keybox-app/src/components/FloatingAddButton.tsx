"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FloatingAddButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/add");
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
    >
      <Plus className="w-6 h-6" />
      <span className="sr-only">添加密码</span>
    </Button>
  );
}
