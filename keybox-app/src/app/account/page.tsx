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
  const { t } = useTranslation();
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
            {t("common.loading")}
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
                  {t("user.premium")}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {t("pricing.free.name")}
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
                {t("auth.signOut")}
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
              {t("account.subscription")}
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                activeTab === "team"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {t("account.team")}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "subscription" && (
          <div className="space-y-8">
            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300">
              {t("account.manageSubscription")}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password Usage */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {t("account.passwordUsage")}
                  </h3>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer">
                    {t("account.viewUsage")}
                  </button>
                </div>

                <div className="flex items-center mb-2">
                  <Database className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {passwordCount}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    / {isPremium ? "∞" : "50"} {t("account.available")}
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
                      {t("account.usedThisMonth", {
                        used: passwordCount,
                        total: 50,
                      })}
                    </p>

                    <Button
                      onClick={() => router.push("/pricing")}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {t("account.upgradeToAddMore")}
                    </Button>
                  </>
                )}
              </div>

              {/* Billing */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {t("account.billing")}
                  </h3>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer">
                    {t("account.paymentHistory")}
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
                    ? t("account.premiumActivated")
                    : t("account.trialEndDate")}
                </p>

                {!isPremium && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t("account.noPaymentMethod")}
                  </p>
                )}

                <Button
                  onClick={() => router.push("/pricing")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPremium
                    ? t("account.manageSubscription")
                    : t("account.upgradeNow")}
                </Button>
              </div>
            </div>

            {/* Current Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                {t("account.currentPlan")}
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
                          ? t("pricing.premium.name")
                          : t("pricing.free.name")}
                      </h4>
                      {!isPremium && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 mt-1">
                          {t("account.trialEndsIn", { days: 30 })}
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
                      ? t("pricing.premium.unlimitedPasswords")
                      : t("pricing.free.limitedPasswords")}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {t("pricing.common.encryption")}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {t("pricing.common.cloudSync")}
                  </div>
                  {isPremium && (
                    <>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {t("pricing.premium.prioritySupport")}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {t("pricing.premium.advancedFeatures")}
                      </div>
                    </>
                  )}
                  {!isPremium && (
                    <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer">
                      {t("account.showMore")}
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("account.monthlyTotal")}:
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
                    {t("account.changeSubscription")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("account.switchPlansOrContact")}
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/pricing")}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <span>{t("account.changePlan")}</span>
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
              {t("account.teamFeatures")}
            </p>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("account.teamComingSoon")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("account.teamDescription")}
              </p>
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t("account.learnMore")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
