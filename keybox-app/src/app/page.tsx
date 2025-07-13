"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PasswordEntry, Category } from "@/types/password";
import { StorageManager } from "@/utils/storage";
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
  const router = useRouter();
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // 加载数据统计
  useEffect(() => {
    const loadedData = StorageManager.loadFromLocalStorage();
    setEntries(loadedData.entries);
    setCategories(loadedData.categories);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "企业级加密",
      description: "采用 AES-256 加密算法，确保您的密码数据绝对安全",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      title: "智能密码生成",
      description: "内置强密码生成器，支持自定义规则和记忆友好型密码",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Globe,
      title: "跨平台同步",
      description: "支持数据导入导出，轻松在多设备间同步您的密码库",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Layers,
      title: "智能分类管理",
      description: "自定义分类系统，让您的密码井井有条，快速查找",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Key,
      title: "一键复制",
      description: "快速复制用户名和密码，提升日常使用效率",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: Smartphone,
      title: "响应式设计",
      description: "完美适配桌面和移动设备，随时随地管理密码",
      color: "from-teal-500 to-blue-500",
    },
  ];

  const stats = [
    { label: "已保存密码", value: entries.length, icon: Lock },
    { label: "分类数量", value: categories.length, icon: Layers },
    { label: "安全等级", value: "企业级", icon: Shield },
    { label: "用户满意度", value: "99%", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between p-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PandaKeyBox
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/passwords")}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 cursor-pointer"
            >
              开始使用
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8">
              安全管理
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                您的所有密码
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              PandaKeyBox
              是您的专属密码管家，采用企业级加密技术，让您的数字生活更安全、更便捷。
              告别密码遗忘的烦恼，拥抱安全高效的密码管理体验。
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={() => router.push("/passwords")}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>进入密码库</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/manage?action=new")}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
              >
                添加第一个密码
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
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
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
              为什么选择 PandaKeyBox？
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              我们致力于为您提供最安全、最便捷的密码管理体验，让您的数字生活更加安心。
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
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
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
            立即开始您的安全之旅
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            加入数千名用户的行列，体验最安全、最便捷的密码管理服务。您的数字安全，我们来守护。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => router.push("/passwords")}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg"
            >
              立即体验
            </button>
            <button
              onClick={() => router.push("/add")}
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200 cursor-pointer"
            >
              创建密码
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
                专业的密码管理工具，采用企业级加密技术，为您的数字生活提供全方位的安全保护。
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
              <h3 className="text-lg font-semibold mb-4">产品功能</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">
                  密码生成
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  安全存储
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  数据同步
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  分类管理
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">支持</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">
                  使用指南
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  常见问题
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  联系我们
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  隐私政策
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PandaKeyBox. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
