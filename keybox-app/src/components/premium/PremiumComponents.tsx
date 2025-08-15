/**
 * Premium Feature Components
 * React components for premium feature gating and upgrade prompts
 */

import React from 'react';
import { usePremiumFeatures, PremiumFeatures } from '@/hooks/usePremiumFeatures';

// Premium feature gate component
export function PremiumFeatureGate({ 
  feature, 
  children, 
  fallback 
}: { 
  feature: keyof PremiumFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasFeature } = usePremiumFeatures();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return <>{fallback || null}</>;
}

// Premium upgrade prompt component
export function PremiumUpgradePrompt({ 
  feature, 
  title, 
  description 
}: { 
  feature: keyof PremiumFeatures;
  title?: string;
  description?: string;
}) {
  const { hasFeature, getUpgradeUrl } = usePremiumFeatures();

  if (hasFeature(feature)) {
    return null;
  }

  const upgradeUrl = getUpgradeUrl();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {title || 'Premium Feature'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description || 'This feature requires a premium subscription.'}
          </p>
        </div>
        {upgradeUrl && (
          <a
            href={upgradeUrl}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upgrade
          </a>
        )}
      </div>
    </div>
  );
}
