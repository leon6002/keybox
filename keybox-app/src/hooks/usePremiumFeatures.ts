/**
 * Hook for managing premium features and subscription status
 */

import { useState, useEffect, useCallback } from "react";
import {
  subscriptionService,
  PremiumFeatures,
} from "@/lib/services/subscriptionService";

// Re-export PremiumFeatures for convenience
export type { PremiumFeatures };
import { useAuth } from "@/contexts/AuthContext";

export interface PremiumStatus {
  isPremium: boolean;
  planType: "free" | "pro" | "enterprise";
  features: PremiumFeatures;
  subscription: any | null;
  isLoading: boolean;
  error: string | null;
}

export function usePremiumFeatures() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    planType: "free",
    features: {
      unlimitedPasswords: false,
      advancedEncryption: false,
      cloudSync: false,
      advancedImportExport: false,
      passwordStrengthAnalysis: false,
      prioritySupport: false,
      customCategories: false,
      secureSharing: false,
      auditLogs: false,
      twoFactorAuth: false,
    },
    subscription: null,
    isLoading: true,
    error: null,
  });

  const loadPremiumStatus = useCallback(async () => {
    if (!user?.googleUser?.id) {
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        isPremium: false,
        planType: "free",
      }));
      return;
    }

    try {
      setStatus((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get user's subscription
      const subscription = await subscriptionService.getUserSubscription(
        user.googleUser.id
      );

      // Get premium features
      const features = await subscriptionService.getUserPremiumFeatures(
        user.googleUser.id
      );

      // Check if user has premium
      const isPremium = await subscriptionService.hasPremiumFeatures(
        user.googleUser.id
      );

      setStatus({
        isPremium,
        planType: subscription?.planType || "free",
        features,
        subscription,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to load premium status:", error);
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load premium status",
      }));
    }
  }, [user?.googleUser?.id]);

  // Load premium status when user changes
  useEffect(() => {
    loadPremiumStatus();
  }, [loadPremiumStatus]);

  // Refresh premium status
  const refresh = useCallback(() => {
    loadPremiumStatus();
  }, [loadPremiumStatus]);

  // Check if a specific feature is available
  const hasFeature = useCallback(
    (feature: keyof PremiumFeatures): boolean => {
      return status.features[feature] || false;
    },
    [status.features]
  );

  // Check if user can perform an action that requires premium
  const canUseFeature = useCallback(
    (feature: keyof PremiumFeatures): boolean => {
      return hasFeature(feature);
    },
    [hasFeature]
  );

  // Get upgrade URL for a specific plan
  const getUpgradeUrl = useCallback(
    (planType: "pro" | "enterprise" = "pro") => {
      const productId =
        planType === "pro"
          ? process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO
          : process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_ENTERPRISE;

      if (!productId) return null;

      // If user is authenticated, include their info
      if (user?.googleUser) {
        const params = new URLSearchParams({
          products: productId,
          customerEmail: user.googleUser.email,
          customerName: user.googleUser.name,
          customerExternalId: user.googleUser.id,
        });
        return `/api/checkout?${params.toString()}`;
      }

      // If no user, just redirect to checkout without customer info
      return `/api/checkout?products=${productId}`;
    },
    [user?.googleUser]
  );

  // Get customer portal URL
  const getPortalUrl = useCallback(() => {
    if (!status.subscription?.polarCustomerId) return null;
    return `/api/portal?customerId=${status.subscription.polarCustomerId}`;
  }, [status.subscription?.polarCustomerId]);

  return {
    ...status,
    refresh,
    hasFeature,
    canUseFeature,
    getUpgradeUrl,
    getPortalUrl,
  };
}

// Hook for checking specific premium features
export function useFeatureAccess(feature: keyof PremiumFeatures) {
  const { hasFeature, getUpgradeUrl, isLoading } = usePremiumFeatures();

  return {
    hasAccess: hasFeature(feature),
    upgradeUrl: getUpgradeUrl(),
    isLoading,
  };
}
