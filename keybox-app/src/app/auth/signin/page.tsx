"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Shield, Lock, Cloud, Zap } from "lucide-react";
import GoogleSignInSimple from "@/components/GoogleSignInSimple";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  given_name: string;
  family_name: string;
}

export default function SignInPage() {
  const router = useRouter();
  const { t, ready } = useTranslation();
  const { signIn, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleGoogleSuccess = (user: GoogleUser) => {
    signIn(user);
    // Redirect to the page user was trying to access or home
    const returnUrl =
      new URLSearchParams(window.location.search).get("returnUrl") || "/";
    router.push(returnUrl);
  };

  const handleGoogleError = (error: any) => {
    console.error("Google Sign-In failed:", error);
    // You could show a toast notification here
  };

  const features = [
    {
      icon: Shield,
      title: ready ? t("auth.features.security.title") : "安全保护",
      description: ready
        ? t("auth.features.security.description")
        : "军用级加密保护您的密码数据",
    },
    {
      icon: Cloud,
      title: ready ? t("auth.features.sync.title") : "云端同步",
      description: ready
        ? t("auth.features.sync.description")
        : "多设备无缝同步您的密码",
    },
    {
      icon: Lock,
      title: ready ? t("auth.features.privacy.title") : "隐私优先",
      description: ready
        ? t("auth.features.privacy.description")
        : "我们不会存储或查看您的密码",
    },
    {
      icon: Zap,
      title: ready ? t("auth.features.speed.title") : "极速体验",
      description: ready
        ? t("auth.features.speed.description")
        : "毫秒级响应，流畅使用体验",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PandaKeyBox
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {ready ? t("nav.home") : "返回首页"}
          </button>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Sign in form */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {ready ? t("auth.signin.title") : "登录 PandaKeyBox"}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {ready ? t("auth.signin.subtitle") : "安全管理您的所有密码"}
                </p>
              </div>

              {/* Google Sign In Button */}
              <div className="mb-6">
                <GoogleSignInSimple
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {ready ? t("auth.signin.orContinue") : "或继续使用"}
                  </span>
                </div>
              </div>

              {/* Guest Access */}
              <div className="flex justify-center">
                <button
                  onClick={() => router.push("/")}
                  className="text-sm w-[300px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  {ready ? t("auth.signin.guestAccess") : "以访客身份继续"}
                </button>
              </div>

              {/* Privacy Notice */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
                {ready
                  ? t("auth.signin.privacyNotice")
                  : "登录即表示您同意我们的服务条款和隐私政策。我们不会存储或查看您的密码数据。"}
              </p>
            </div>
          </div>

          {/* Right side - Features */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {ready ? t("auth.features.title") : "为什么选择 PandaKeyBox？"}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {ready
                  ? t("auth.features.subtitle")
                  : "专业级密码管理，保护您的数字生活安全"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
