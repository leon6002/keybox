"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Shield,
  User,
  Calendar,
  Database,
  Crown,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hasPremiumFeatures, getPremiumActivationDate } from "@/utils/payment";
import UserAvatar from "@/components/UserAvatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const router = useRouter();
  const { t, ready } = useTranslation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"subscription" | "team">(
    "subscription"
  );
  const [isPremium, setIsPremium] = useState(false);
  const [activationDate, setActivationDate] = useState<Date | null>(null);
  const [passwordCount, setPasswordCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/signin?returnUrl=/account");
      return;
    }

    setIsPremium(hasPremiumFeatures());
    setActivationDate(getPremiumActivationDate());

    // Get password count from localStorage
    const entries = JSON.parse(
      localStorage.getItem("password_entries") || "[]"
    );
    setPasswordCount(entries.length);
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {ready ? t("common.loading") : "加载中..."}
          </p>
        </div>
      </div>
    );
  }

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 30);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PandaKeyBox
              </span>
              {isPremium ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                  <Crown className="w-3 h-3 mr-1" />
                  {ready ? t("user.premium") : "高级版"}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {ready ? t("pricing.free.name") : "免费版"}
                </span>
              )}
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <div className="flex items-center space-x-3">
                <UserAvatar
                  src={user.picture}
                  alt={user.name}
                  size="sm"
                  showPremium={isPremium}
                />
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </div>
                </div>
              </div>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="text-gray-600 dark:text-gray-300"
              >
                {ready ? t("auth.signOut") : "退出"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("subscription")}
              className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeTab === "subscription"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {ready ? t("account.subscription") : "订阅"}
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeTab === "team"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {ready ? t("account.team") : "团队"}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "subscription" && (
          <div className="space-y-8">
            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300">
              {ready
                ? t("account.manageSubscription")
                : "管理您的订阅和账单详情。"}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password Usage */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {ready ? t("account.passwordUsage") : "密码使用量"}
                  </h3>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer">
                    {ready ? t("account.viewUsage") : "查看使用情况"}
                  </button>
                </div>

                <div className="flex items-center mb-2">
                  <Database className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {passwordCount}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    / {isPremium ? "∞" : "50"}{" "}
                    {ready ? t("account.available") : "可用"}
                  </span>
                </div>

                {!isPremium && (
                  <>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (passwordCount / 50) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {ready
                        ? t("account.usedThisMonth", {
                            used: passwordCount,
                            total: 50,
                          })
                        : `本月已使用 ${passwordCount} / 50`}
                    </p>

                    <Button
                      onClick={() => router.push("/pricing")}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {ready
                        ? t("account.upgradeToAddMore")
                        : "升级以添加更多密码"}
                    </Button>
                  </>
                )}
              </div>

              {/* Billing */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {ready ? t("account.billing") : "账单"}
                  </h3>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer">
                    {ready ? t("account.paymentHistory") : "付款历史"}
                  </button>
                </div>

                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isPremium
                      ? activationDate
                        ? activationDate.toLocaleDateString()
                        : "已激活"
                      : trialEndDate.toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isPremium
                    ? ready
                      ? t("account.premiumActivated")
                      : "高级版已激活"
                    : ready
                    ? t("account.trialEndDate")
                    : "试用结束日期"}
                </p>

                {!isPremium && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {ready ? t("account.noPaymentMethod") : "未设置付款方式"}
                  </p>
                )}

                <Button
                  onClick={() => router.push("/pricing")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPremium
                    ? ready
                      ? t("account.manageSubscription")
                      : "管理订阅"
                    : ready
                    ? t("account.upgradeNow")
                    : "立即升级"}
                </Button>
              </div>
            </div>

            {/* Current Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                {ready ? t("account.currentPlan") : "当前计划"}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isPremium ? "bg-yellow-500" : "bg-gray-400"
                      }`}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {isPremium
                          ? ready
                            ? t("pricing.premium.name")
                            : "高级版"
                          : ready
                          ? t("pricing.free.name")
                          : "免费版"}
                      </h4>
                      {!isPremium && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 mt-1">
                          {ready
                            ? t("account.trialEndsIn", { days: 30 })
                            : "试用还剩 30 天"}
                        </span>
                      )}
                    </div>
                  </div>
                  {isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
                </div>

                {/* Features List */}
                <div className="space-y-2 ml-6">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {isPremium
                      ? ready
                        ? t("pricing.premium.unlimitedPasswords")
                        : "无限密码存储"
                      : ready
                      ? t("pricing.free.limitedPasswords")
                      : "最多 50 个密码"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {ready ? t("pricing.common.encryption") : "军用级加密"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {ready ? t("pricing.common.cloudSync") : "云端同步"}
                  </div>
                  {isPremium && (
                    <>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {ready
                          ? t("pricing.premium.prioritySupport")
                          : "优先客服支持"}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {ready
                          ? t("pricing.premium.advancedFeatures")
                          : "高级功能"}
                      </div>
                    </>
                  )}
                  {!isPremium && (
                    <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer">
                      {ready ? t("account.showMore") : "显示更多"}
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {ready ? t("account.monthlyTotal") : "月度总计"}:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {isPremium ? "$9.99" : "$0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Subscription */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {ready ? t("account.changeSubscription") : "更改订阅"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {ready
                      ? t("account.switchPlansOrContact")
                      : "切换计划或联系销售了解企业选项"}
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/pricing")}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <span>{ready ? t("account.changePlan") : "更改计划"}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === "team" && (
          <div className="space-y-8">
            <p className="text-gray-600 dark:text-gray-300">
              {ready
                ? t("account.teamFeatures")
                : "团队功能即将推出，敬请期待。"}
            </p>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {ready ? t("account.teamComingSoon") : "团队功能即将推出"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {ready
                  ? t("account.teamDescription")
                  : "与您的团队安全地共享密码和凭据。"}
              </p>
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {ready ? t("account.learnMore") : "了解更多"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
