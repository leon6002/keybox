"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  const router = useRouter();
  const { t, ready } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          {/* Cancel Icon */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {ready ? t("payment.cancel.title") : "支付已取消"}
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {ready ? t("payment.cancel.description") : "您的支付已被取消，没有产生任何费用。您可以随时重新尝试购买高级功能。"}
          </p>

          {/* Why upgrade */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              {ready ? t("payment.cancel.whyUpgrade") : "升级高级版的好处"}
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• {ready ? t("features.unlimitedPasswords") : "无限密码存储"}</li>
              <li>• {ready ? t("features.advancedEncryption") : "高级加密功能"}</li>
              <li>• {ready ? t("features.cloudSync") : "云端同步"}</li>
              <li>• {ready ? t("features.prioritySupport") : "优先技术支持"}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push("/pricing")}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {ready ? t("payment.cancel.tryAgain") : "重新购买"}
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {ready ? t("nav.home") : "返回首页"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
