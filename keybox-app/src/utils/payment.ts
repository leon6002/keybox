/**
 * Payment utility functions for Polar integration
 */

export interface CheckoutOptions {
  productId: string;
  customerEmail?: string;
  customerName?: string;
  customerId?: string;
  customerExternalId?: string;
  metadata?: Record<string, any>;
}

/**
 * Generate checkout URL for Polar payment
 */
export function generateCheckoutUrl(options: CheckoutOptions): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const params = new URLSearchParams();
  
  params.append('products', options.productId);
  
  if (options.customerEmail) {
    params.append('customerEmail', options.customerEmail);
  }
  
  if (options.customerName) {
    params.append('customerName', options.customerName);
  }
  
  if (options.customerId) {
    params.append('customerId', options.customerId);
  }
  
  if (options.customerExternalId) {
    params.append('customerExternalId', options.customerExternalId);
  }
  
  if (options.metadata) {
    params.append('metadata', encodeURIComponent(JSON.stringify(options.metadata)));
  }
  
  return `${baseUrl}/api/checkout?${params.toString()}`;
}

/**
 * Generate customer portal URL
 */
export function generatePortalUrl(customerId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/portal?customerId=${customerId}`;
}

/**
 * Product IDs for different plans
 * Replace these with your actual Polar product IDs
 */
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'your_pro_monthly_product_id',
  PRO_YEARLY: 'your_pro_yearly_product_id',
  ENTERPRISE_MONTHLY: 'your_enterprise_monthly_product_id',
  ENTERPRISE_YEARLY: 'your_enterprise_yearly_product_id',
} as const;

/**
 * Check if user has premium features
 * This would typically check against your database/user state
 */
export function hasPremiumFeatures(): boolean {
  // For now, check localStorage for demo purposes
  // In a real app, this would check user's subscription status from your backend
  return localStorage.getItem('premium_features') === 'true';
}

/**
 * Enable premium features
 * This would typically update your database/user state
 */
export function enablePremiumFeatures(): void {
  // For demo purposes, store in localStorage
  // In a real app, this would update user's subscription status in your backend
  localStorage.setItem('premium_features', 'true');
  localStorage.setItem('premium_activated_at', new Date().toISOString());
}

/**
 * Disable premium features
 */
export function disablePremiumFeatures(): void {
  localStorage.removeItem('premium_features');
  localStorage.removeItem('premium_activated_at');
}

/**
 * Get premium activation date
 */
export function getPremiumActivationDate(): Date | null {
  const dateStr = localStorage.getItem('premium_activated_at');
  return dateStr ? new Date(dateStr) : null;
}
