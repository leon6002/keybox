/**
 * Subscription Service for managing user subscriptions and premium features
 */

import { supabase } from "../supabase";

export interface Subscription {
  id: string;
  userId: string;
  polarCustomerId?: string;
  polarSubscriptionId?: string;
  polarProductId?: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  planType: 'free' | 'pro' | 'enterprise';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  premiumFeatures: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentEvent {
  id: string;
  userId?: string;
  subscriptionId?: string;
  eventType: string;
  polarEventId?: string;
  eventData: Record<string, any>;
  processed: boolean;
  createdAt: Date;
}

export interface PremiumFeatures {
  unlimitedPasswords: boolean;
  advancedEncryption: boolean;
  cloudSync: boolean;
  advancedImportExport: boolean;
  passwordStrengthAnalysis: boolean;
  prioritySupport: boolean;
  customCategories: boolean;
  secureSharing: boolean;
  auditLogs: boolean;
  twoFactorAuth: boolean;
}

export class SubscriptionService {
  /**
   * Get user's subscription
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('keybox_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No subscription found
      }
      throw new Error(`Failed to get subscription: ${error.message}`);
    }

    return this.mapSupabaseToSubscription(data);
  }

  /**
   * Create or update user subscription
   */
  async upsertSubscription(subscription: Partial<Subscription> & { userId: string }): Promise<Subscription> {
    const subscriptionData = {
      user_id: subscription.userId,
      polar_customer_id: subscription.polarCustomerId,
      polar_subscription_id: subscription.polarSubscriptionId,
      polar_product_id: subscription.polarProductId,
      status: subscription.status || 'inactive',
      plan_type: subscription.planType || 'free',
      current_period_start: subscription.currentPeriodStart?.toISOString(),
      current_period_end: subscription.currentPeriodEnd?.toISOString(),
      cancel_at_period_end: subscription.cancelAtPeriodEnd || false,
      premium_features: subscription.premiumFeatures || {},
    };

    const { data, error } = await supabase
      .from('keybox_subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert subscription: ${error.message}`);
    }

    return this.mapSupabaseToSubscription(data);
  }

  /**
   * Activate premium subscription
   */
  async activatePremiumSubscription(
    userId: string,
    polarData: {
      customerId?: string;
      subscriptionId?: string;
      productId?: string;
    },
    planType: 'pro' | 'enterprise' = 'pro',
    periodEnd?: Date
  ): Promise<Subscription> {
    const premiumFeatures = this.getPremiumFeatures(planType);
    
    return this.upsertSubscription({
      userId,
      polarCustomerId: polarData.customerId,
      polarSubscriptionId: polarData.subscriptionId,
      polarProductId: polarData.productId,
      status: 'active',
      planType,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      premiumFeatures,
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new Error('No subscription found');
    }

    return this.upsertSubscription({
      ...subscription,
      status: cancelAtPeriodEnd ? 'active' : 'canceled',
      cancelAtPeriodEnd,
    });
  }

  /**
   * Check if user has premium features
   */
  async hasPremiumFeatures(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription?.status === 'active' && subscription.planType !== 'free';
  }

  /**
   * Get user's premium features
   */
  async getUserPremiumFeatures(userId: string): Promise<PremiumFeatures> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'active' || subscription.planType === 'free') {
      return this.getFreePlanFeatures();
    }

    return subscription.premiumFeatures as PremiumFeatures;
  }

  /**
   * Log payment event
   */
  async logPaymentEvent(event: Omit<PaymentEvent, 'id' | 'createdAt' | 'processed'>): Promise<PaymentEvent> {
    const { data, error } = await supabase
      .from('keybox_payment_events')
      .insert({
        user_id: event.userId,
        subscription_id: event.subscriptionId,
        event_type: event.eventType,
        polar_event_id: event.polarEventId,
        event_data: event.eventData,
        processed: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log payment event: ${error.message}`);
    }

    return this.mapSupabaseToPaymentEvent(data);
  }

  /**
   * Mark payment event as processed
   */
  async markEventProcessed(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('keybox_payment_events')
      .update({ processed: true })
      .eq('id', eventId);

    if (error) {
      throw new Error(`Failed to mark event as processed: ${error.message}`);
    }
  }

  /**
   * Get premium features for plan type
   */
  private getPremiumFeatures(planType: 'pro' | 'enterprise'): PremiumFeatures {
    const baseFeatures: PremiumFeatures = {
      unlimitedPasswords: true,
      advancedEncryption: true,
      cloudSync: true,
      advancedImportExport: true,
      passwordStrengthAnalysis: true,
      prioritySupport: true,
      customCategories: true,
      secureSharing: false,
      auditLogs: false,
      twoFactorAuth: true,
    };

    if (planType === 'enterprise') {
      return {
        ...baseFeatures,
        secureSharing: true,
        auditLogs: true,
      };
    }

    return baseFeatures;
  }

  /**
   * Get free plan features
   */
  private getFreePlanFeatures(): PremiumFeatures {
    return {
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
    };
  }

  /**
   * Map Supabase data to Subscription
   */
  private mapSupabaseToSubscription(data: any): Subscription {
    return {
      id: data.id,
      userId: data.user_id,
      polarCustomerId: data.polar_customer_id,
      polarSubscriptionId: data.polar_subscription_id,
      polarProductId: data.polar_product_id,
      status: data.status,
      planType: data.plan_type,
      currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      premiumFeatures: data.premium_features,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Map Supabase data to PaymentEvent
   */
  private mapSupabaseToPaymentEvent(data: any): PaymentEvent {
    return {
      id: data.id,
      userId: data.user_id,
      subscriptionId: data.subscription_id,
      eventType: data.event_type,
      polarEventId: data.polar_event_id,
      eventData: data.event_data,
      processed: data.processed,
      createdAt: new Date(data.created_at),
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
