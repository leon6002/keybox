/**
 * Premium Badge Component
 * Shows premium status and provides upgrade prompts
 */

import React from "react";
import { Crown, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";

interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  showUpgrade?: boolean;
  className?: string;
}

export function PremiumBadge({
  size = "md",
  showUpgrade = true,
  className = "",
}: PremiumBadgeProps) {
  const { isPremium, planType, getUpgradeUrl } = usePremiumFeatures();

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (isPremium) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-medium ${sizeClasses[size]} ${className}`}
      >
        <Crown className={iconSizes[size]} />
        <span>{planType === "enterprise" ? "Enterprise" : "Pro"}</span>
      </div>
    );
  }

  if (!showUpgrade) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full ${sizeClasses.md} ${className}`}
      >
        <span>Free</span>
      </div>
    );
  }

  const upgradeUrl = getUpgradeUrl();

  return (
    <Button
      variant="outline"
      size="sm"
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 ${className}`}
      onClick={() => upgradeUrl && (window.location.href = upgradeUrl)}
    >
      <Sparkles className="w-3 h-3" />
      <span>Upgrade to Pro</span>
    </Button>
  );
}

interface FeatureLockProps {
  feature: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FeatureLock({
  feature,
  title = "Premium Feature",
  description = "This feature requires a premium subscription.",
  children,
  className = "",
}: FeatureLockProps) {
  const { getUpgradeUrl } = usePremiumFeatures();
  const upgradeUrl = getUpgradeUrl();

  return (
    <div className={`relative ${className}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>

          {upgradeUrl && (
            <Button
              onClick={() => (window.location.href = upgradeUrl)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>

      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none">{children}</div>
    </div>
  );
}

interface PremiumTooltipProps {
  feature: string;
  children: React.ReactNode;
}

export function PremiumTooltip({ feature, children }: PremiumTooltipProps) {
  const { hasFeature } = usePremiumFeatures();

  if (hasFeature(feature as any)) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      <div className="opacity-50 cursor-not-allowed">{children}</div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
        Premium feature - Upgrade to unlock
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
      </div>
    </div>
  );
}

// Export the components for easy access
export { PremiumFeatureGate, PremiumUpgradePrompt } from "./PremiumComponents";

// Usage examples:
// <PremiumBadge />
// <PremiumBadge size="sm" showUpgrade={false} />
// <FeatureLock feature="advancedEncryption" title="Advanced Encryption">
//   <SomeComponent />
// </FeatureLock>
// <PremiumTooltip feature="cloudSync">
//   <Button disabled>Sync to Cloud</Button>
// </PremiumTooltip>
