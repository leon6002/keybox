/**
 * Test Payment Page
 * For testing the Polar payment integration
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import {
  PremiumBadge,
  FeatureLock,
  PremiumTooltip,
  PremiumFeatureGate,
  PremiumUpgradePrompt,
} from "@/components/premium/PremiumBadge";
import { Crown, Sparkles, Lock, Check, X } from "lucide-react";

export default function TestPaymentPage() {
  const {
    isPremium,
    planType,
    features,
    subscription,
    isLoading,
    error,
    getUpgradeUrl,
    getPortalUrl,
    refresh,
  } = usePremiumFeatures();

  const [testingCheckout, setTestingCheckout] = useState(false);

  const handleTestCheckout = (planType: "pro" | "enterprise") => {
    setTestingCheckout(true);
    const upgradeUrl = getUpgradeUrl(planType);
    if (upgradeUrl) {
      window.location.href = upgradeUrl;
    } else {
      alert("No product ID configured for this plan");
      setTestingCheckout(false);
    }
  };

  const handleOpenPortal = () => {
    const portalUrl = getPortalUrl();
    if (portalUrl) {
      window.open(portalUrl, "_blank");
    } else {
      alert("No customer portal available");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading payment status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Integration Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the Polar payment integration and premium features
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Subscription Status
              <PremiumBadge size="sm" showUpgrade={false} />
            </CardTitle>
            <CardDescription>
              Your current subscription and premium feature status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Plan Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Plan Type:</span>
                    <Badge variant={isPremium ? "default" : "secondary"}>
                      {planType.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={isPremium ? "default" : "destructive"}>
                      {isPremium ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {subscription && (
                    <>
                      <div className="flex justify-between">
                        <span>Polar Customer ID:</span>
                        <span className="font-mono text-xs">
                          {subscription.polarCustomerId || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Period End:</span>
                        <span>
                          {subscription.currentPeriodEnd
                            ? new Date(
                                subscription.currentPeriodEnd
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Premium Features
                </h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(features).map(([key, enabled]) => (
                    <div key={key} className="flex items-center gap-2">
                      {enabled ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={
                          enabled
                            ? "text-green-700 dark:text-green-400"
                            : "text-gray-500"
                        }
                      >
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={refresh} variant="outline" size="sm">
                Refresh Status
              </Button>
              {isPremium && (
                <Button onClick={handleOpenPortal} variant="outline" size="sm">
                  Open Customer Portal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Checkout */}
        <Card>
          <CardHeader>
            <CardTitle>Test Checkout</CardTitle>
            <CardDescription>
              Test the payment flow with different plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Pro Plan</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Test the Pro plan checkout flow
                </p>
                <Button
                  onClick={() => handleTestCheckout("pro")}
                  disabled={testingCheckout}
                  className="w-full"
                >
                  {testingCheckout ? "Redirecting..." : "Test Pro Checkout"}
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold">Enterprise Plan</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Test the Enterprise plan checkout flow
                </p>
                <Button
                  onClick={() => handleTestCheckout("enterprise")}
                  disabled={testingCheckout}
                  variant="outline"
                  className="w-full"
                >
                  {testingCheckout
                    ? "Redirecting..."
                    : "Test Enterprise Checkout"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Feature Demos */}
        <Card>
          <CardHeader>
            <CardTitle>Premium Feature Demos</CardTitle>
            <CardDescription>
              See how premium features are gated and displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feature Lock Demo */}
            <div>
              <h4 className="font-medium mb-2">Feature Lock Component</h4>
              <FeatureLock
                feature="advancedEncryption"
                title="Advanced Encryption"
                description="This advanced encryption feature requires a premium subscription."
                className="h-32"
              >
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100">
                    Advanced Encryption Settings
                  </h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Configure advanced encryption algorithms and key management.
                  </p>
                </div>
              </FeatureLock>
            </div>

            {/* Premium Tooltip Demo */}
            <div>
              <h4 className="font-medium mb-2">Premium Tooltip Component</h4>
              <div className="flex gap-2">
                <PremiumTooltip feature="cloudSync">
                  <Button disabled variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Sync to Cloud
                  </Button>
                </PremiumTooltip>

                <PremiumTooltip feature="auditLogs">
                  <Button disabled variant="outline">
                    <Lock className="w-4 h-4 mr-2" />
                    View Audit Logs
                  </Button>
                </PremiumTooltip>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
