"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CheckCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { t, ready } = useTranslation();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {ready ? t("payment.success.title") : "支付成功！"}
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {ready ? t("payment.success.description") : "感谢您的购买！您的高级功能已经激活。"}
          </p>

          {/* Features Unlocked */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              {ready ? t("payment.success.featuresUnlocked") : "已解锁功能"}
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• {ready ? t("features.unlimitedPasswords") : "无限密码存储"}</li>
              <li>• {ready ? t("features.advancedEncryption") : "高级加密功能"}</li>
              <li>• {ready ? t("features.cloudSync") : "云端同步"}</li>
              <li>• {ready ? t("features.prioritySupport") : "优先技术支持"}</li>
            </ul>
          </div>

          {/* Auto redirect notice */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {ready 
              ? t("payment.success.autoRedirect", { seconds: countdown })
              : `${countdown} 秒后自动返回首页`}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push("/")}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              {ready ? t("nav.home") : "返回首页"}
            </Button>
            <Button
              onClick={() => router.push("/passwords")}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {ready ? t("nav.passwordList") : "管理密码"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
