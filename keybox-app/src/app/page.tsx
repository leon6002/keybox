"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PasswordEntry, Category } from "@/types/password";
import { StorageManager } from "@/utils/storage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import UserProfile from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  Lock,
  Key,
  Zap,
  Globe,
  Smartphone,
  ArrowRight,
  Star,
  Layers,
} from "lucide-react";

export default function HomePage() {
  return <HomePageContent />;
}

function HomePageContent() {
  const router = useRouter();
  const { t, ready } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<PasswordEntry[]>([]);

  // 加载数据统计
  useEffect(() => {
    const loadedData = StorageManager.loadFromLocalStorage();
    setEntries(loadedData.entries);
  }, []);

  const features = [
    {
      icon: Shield,
      titleKey: "home.features.encryption.title",
      descriptionKey: "home.features.encryption.description",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      titleKey: "home.features.generator.title",
      descriptionKey: "home.features.generator.description",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Globe,
      titleKey: "home.features.sync.title",
      descriptionKey: "home.features.sync.description",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Layers,
      titleKey: "home.features.organization.title",
      descriptionKey: "home.features.organization.description",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Key,
      titleKey: "home.features.copy.title",
      descriptionKey: "home.features.copy.description",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: Smartphone,
      titleKey: "home.features.responsive.title",
      descriptionKey: "home.features.responsive.description",
      color: "from-teal-500 to-blue-500",
    },
  ];

  const stats = [
    {
      labelKey: "home.stats.savedPasswords",
      value: entries.length,
      icon: Lock,
    },
    {
      labelKey: "home.stats.securityLevel",
      valueKey: "home.stats.securityLevel",
      icon: Shield,
    },
    {
      labelKey: "home.stats.userSatisfaction",
      valueKey: "home.stats.userSatisfaction",
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>

        {/* Navigation */}
        <nav className="relative z-20 flex items-center justify-between p-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PandaKeyBox
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <button
              onClick={() => router.push("/pricing")}
              className="hidden sm:block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {ready ? t("nav.pricing") : "定价"}
            </button>

            {/* 登录/用户资料 */}
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <button
                onClick={() => router.push("/auth/signin")}
                className="hidden sm:block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {ready ? t("auth.signin.title") : "登录"}
              </button>
            )}

            <button
              onClick={() => router.push("/vault")}
              className="px-3 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 cursor-pointer text-sm sm:text-base whitespace-nowrap"
            >
              <span className="hidden sm:inline">
                {ready ? t("home.cta.getStarted") : "开始使用"}
              </span>
              <span className="sm:hidden">
                {ready ? t("common.start") : "开始"}
              </span>
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8">
              {ready ? t("home.title") : "安全管理"}
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {ready ? t("home.subtitle") : "您的所有密码"}
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              {ready
                ? t("home.description")
                : "PandaKeyBox 是您的专属密码管家，采用企业级加密技术，让您的数字生活更安全、更便捷。"}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={() => router.push("/passwords")}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>{ready ? t("home.cta.viewPasswords") : "查看密码"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/manage")}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
              >
                {ready ? t("home.cta.addFirstPassword") : "添加第一个密码"}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 dark:border-slate-700/50"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.valueKey
                      ? ready
                        ? t(stat.valueKey)
                        : "企业级"
                      : stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {ready ? t(stat.labelKey) : "已保存密码"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {ready ? t("home.features.title") : "为什么选择 PandaKeyBox？"}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {ready
                ? t("home.features.subtitle")
                : "我们致力于为您提供最安全、最便捷的密码管理体验，让您的数字生活更加安心。"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {ready ? t(feature.titleKey) : "企业级加密"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {ready
                    ? t(feature.descriptionKey)
                    : "采用 AES-256 加密算法，确保您的密码数据绝对安全"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
            Start your secure journey today.
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of users and experience the most secure and
            convenient password management service. We guard your digital
            security.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => router.push("/passwords")}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push("/add")}
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200 cursor-pointer"
            >
              Create Your Password
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">PandaKeyBox</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Professional password management tool, with enterprise-level
                encryption technology, providing comprehensive security
                protection for your digital life.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <Key className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">
                  Password Generator
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Safe Storage
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Data Sync
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Password Manage
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">
                  User Guide
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Common Question
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Contact Us
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PandaKeyBox. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
