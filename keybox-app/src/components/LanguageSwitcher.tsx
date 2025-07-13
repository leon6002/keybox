"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Globe } from "lucide-react";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
];

export default function LanguageSwitcher() {
  const { i18n, ready } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // 处理语言代码映射 (zh-CN -> zh, en-US -> en)
  const normalizedLanguage = i18n.language.split("-")[0];
  const currentLanguage =
    languages.find((lang) => lang.code === normalizedLanguage) ||
    languages.find((lang) => lang.code === i18n.language) ||
    languages[0];

  const handleLanguageChange = (languageCode: string) => {
    console.log("Changing language to:", languageCode); // 调试日志
    console.log("Current language:", i18n.language); // 当前语言
    console.log("i18n ready:", ready); // i18n 状态
    i18n
      .changeLanguage(languageCode)
      .then(() => {
        console.log("Language changed successfully to:", i18n.language);
      })
      .catch((error) => {
        console.error("Failed to change language:", error);
      });
    setIsOpen(false);
  };

  // 如果 i18n 还没准备好，不显示语言切换器
  if (!ready) {
    return null;
  }

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        style={{ pointerEvents: "auto" }}
      >
        <Globe className="w-4 h-4 pointer-events-none" />
        <span className="hidden sm:inline pointer-events-none">
          {currentLanguage.name}
        </span>
        <span className="sm:hidden pointer-events-none">
          {currentLanguage.flag}
        </span>
        <ChevronDown className="w-3 h-3 pointer-events-none" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    currentLanguage.code === language.code
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {/* <span className="text-base">{language.flag}</span> */}
                  <span>{language.name}</span>
                  {currentLanguage.code === language.code && (
                    <span className="ml-auto">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
