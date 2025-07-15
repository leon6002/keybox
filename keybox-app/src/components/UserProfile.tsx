"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, LogOut, Settings, Crown, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hasPremiumFeatures } from "@/utils/payment";
import UserAvatar from "@/components/UserAvatar";

export default function UserProfile() {
  const { t, ready } = useTranslation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsPremium(hasPremiumFeatures());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        <UserAvatar
          src={user.picture}
          alt={user.name}
          size="md"
          showPremium={isPremium}
        />
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.given_name || user.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isPremium
              ? ready
                ? t("user.premium")
                : "高级用户"
              : ready
              ? t("user.free")
              : "免费用户"}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <UserAvatar
                src={user.picture}
                alt={user.name}
                size="lg"
                showPremium={isPremium}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {isPremium
                    ? ready
                      ? t("user.premium")
                      : "高级用户"
                    : ready
                    ? t("user.free")
                    : "免费用户"}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to profile page
                window.location.href = "/profile";
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <User className="w-4 h-4 mr-3" />
              {ready ? t("user.profile") : "个人资料"}
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to settings page
                window.location.href = "/settings";
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-3" />
              {ready ? t("user.settings") : "设置"}
            </button>

            {!isPremium && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = "/pricing";
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 cursor-pointer"
              >
                <Crown className="w-4 h-4 mr-3" />
                {ready ? t("user.upgradeToPremium") : "升级到高级版"}
              </button>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-3" />
              {ready ? t("auth.signOut") : "退出登录"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
