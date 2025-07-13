"use client";

import { useState, useRef, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "搜索...",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K 聚焦搜索框
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }

      // ESC 清空搜索框
      if (event.key === "Escape" && isFocused) {
        onChange("");
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, onChange]);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <div
        className={`relative flex items-center transition-all duration-200 ${
          isFocused
            ? "ring-2 ring-blue-500 ring-opacity-50"
            : "ring-1 ring-gray-300 dark:ring-gray-600"
        } rounded-lg bg-white dark:bg-gray-800 shadow-sm`}
      >
        {/* Search Icon */}
        <div className="absolute left-3 flex items-center pointer-events-none">
          <svg
            className={`w-5 h-5 transition-colors duration-200 ${
              isFocused ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-transparent border-0 focus:outline-none focus:ring-0"
        />

        {/* Right Side Actions */}
        <div className="absolute right-3 flex items-center space-x-2">
          {/* Clear Button */}
          {value && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              title="清空搜索"
            >
              <svg
                className="w-4 h-4"
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
          )}

          {/* Keyboard Shortcut Hint */}
          {!isFocused && !value && (
            <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}
              </kbd>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                K
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Count */}
      {value && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
          搜索: &ldquo;{value}&rdquo;
        </div>
      )}
    </div>
  );
}
