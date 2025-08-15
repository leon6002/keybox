"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Check, Star, Zap, Shield, Cloud, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function PricingPage() {
  const router = useRouter();
  const { t, ready } = useTranslation();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePurchase = async (productId: string) => {
    setIsLoading(productId);
    try {
      // Get user info from Google auth if available
      // For now, we'll let the user enter their email on Polar's checkout page
      // In production, you should get this from your auth context

      // Redirect to Polar checkout without customer info (let Polar collect it)
      const checkoutUrl = `/api/checkout?products=${productId}`;
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Payment error:", error);
      setIsLoading(null);
    }
  };

  const plans = [
    {
      id: "free",
      name: ready ? t("pricing.free.name") : "免费版",
      price: ready ? t("pricing.free.price") : "免费",
      description: ready ? t("pricing.free.description") : "适合个人基础使用",
      features: [
        ready ? t("pricing.free.feature1") : "最多 50 个密码",
        ready ? t("pricing.free.feature2") : "基础加密",
        ready ? t("pricing.free.feature3") : "本地存储",
        ready ? t("pricing.free.feature4") : "基础导入导出",
      ],
      buttonText: ready ? t("pricing.free.button") : "当前计划",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      id: "pro",
      name: ready ? t("pricing.pro.name") : "专业版",
      price: ready ? t("pricing.pro.price") : "¥5/月",
      description: ready ? t("pricing.pro.description") : "适合专业用户和团队",
      features: [
        ready ? t("pricing.pro.feature1") : "无限密码存储",
        ready ? t("pricing.pro.feature2") : "高级加密算法",
        ready ? t("pricing.pro.feature3") : "云端同步",
        ready ? t("pricing.pro.feature4") : "高级导入导出",
        ready ? t("pricing.pro.feature5") : "密码强度分析",
        ready ? t("pricing.pro.feature6") : "优先技术支持",
      ],
      buttonText: ready ? t("pricing.pro.button") : "立即升级",
      buttonVariant: "default" as const,
      popular: true,
      productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO,
    },
    {
      id: "enterprise",
      name: ready ? t("pricing.enterprise.name") : "企业版",
      price: ready ? t("pricing.enterprise.price") : "¥30/月",
      description: ready
        ? t("pricing.enterprise.description")
        : "适合大型团队和企业",
      features: [
        ready ? t("pricing.enterprise.feature1") : "专业版所有功能",
        ready ? t("pricing.enterprise.feature2") : "团队管理",
        ready ? t("pricing.enterprise.feature3") : "SSO 单点登录",
        ready ? t("pricing.enterprise.feature4") : "审计日志",
        ready ? t("pricing.enterprise.feature5") : "API 访问",
        ready ? t("pricing.enterprise.feature6") : "24/7 专属支持",
      ],
      buttonText: ready ? t("pricing.enterprise.button") : "联系销售",
      buttonVariant: "outline" as const,
      popular: false,
      productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_ENTERPRISE,
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
          <Button onClick={() => router.push("/")} variant="outline" size="sm">
            {ready ? t("nav.home") : "返回首页"}
          </Button>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          {ready ? t("pricing.title") : "选择适合您的计划"}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {ready
            ? t("pricing.subtitle")
            : "从免费版开始，随时升级到专业版解锁更多强大功能"}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 ${
                plan.popular
                  ? "ring-2 ring-blue-500 dark:ring-blue-400 scale-105"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {ready ? t("pricing.popular") : "最受欢迎"}
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.price}
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => {
                  if (plan.productId) {
                    handlePurchase(plan.productId);
                  } else if (plan.id === "free") {
                    router.push("/");
                  } else {
                    // Handle enterprise contact
                    window.location.href = "mailto:sales@pandakeybox.com";
                  }
                }}
                variant={plan.buttonVariant}
                className={`w-full ${
                  plan.popular
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    : ""
                }`}
                disabled={isLoading === plan.productId}
              >
                {isLoading === plan.productId ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {ready ? t("common.loading") : "处理中..."}
                  </div>
                ) : (
                  plan.buttonText
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {ready ? t("pricing.features.title") : "为什么选择 PandaKeyBox？"}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {ready
                ? t("pricing.features.subtitle")
                : "专业级密码管理，保护您的数字生活"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {ready ? t("pricing.features.security.title") : "军用级加密"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {ready
                  ? t("pricing.features.security.description")
                  : "AES-256 加密保护您的数据"}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {ready ? t("pricing.features.sync.title") : "云端同步"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {ready
                  ? t("pricing.features.sync.description")
                  : "多设备无缝同步"}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {ready ? t("pricing.features.speed.title") : "极速体验"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {ready
                  ? t("pricing.features.speed.description")
                  : "毫秒级响应速度"}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeadphonesIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {ready ? t("pricing.features.support.title") : "专业支持"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {ready
                  ? t("pricing.features.support.description")
                  : "7x24 技术支持"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
