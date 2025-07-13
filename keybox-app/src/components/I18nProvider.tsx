"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 确保 i18n 已初始化
    if (!i18n.isInitialized) {
      i18n.init().then(() => {
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
  }, []);

  // 在 hydration 完成之前不渲染内容，避免 SSR/Client 不匹配
  if (!isInitialized) {
    return <div>{children}</div>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
