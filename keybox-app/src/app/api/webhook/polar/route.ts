import { Webhooks } from "@polar-sh/nextjs";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { supabase } from "@/lib/supabase";

// Helper function to determine plan type from product ID
function determinePlanType(productId?: string): "pro" | "enterprise" {
  if (!productId) return "pro";

  // Check environment variables for product IDs
  const proMonthly = process.env.POLAR_PRODUCT_ID_PRO_MONTHLY;
  const proYearly = process.env.POLAR_PRODUCT_ID_PRO_YEARLY;
  const enterpriseMonthly = process.env.POLAR_PRODUCT_ID_ENTERPRISE_MONTHLY;
  const enterpriseYearly = process.env.POLAR_PRODUCT_ID_ENTERPRISE_YEARLY;

  // Check if it's an enterprise product
  if (productId === enterpriseMonthly || productId === enterpriseYearly) {
    return "enterprise";
  }

  // Check if it's a pro product (explicit check)
  if (productId === proMonthly || productId === proYearly) {
    return "pro";
  }

  return "pro"; // Default to pro for any other product
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  // Catch-all handler for any webhook event
  onPayload: async (payload) => {
    console.log("Polar webhook received:", payload);

    // Log all events for audit trail
    try {
      await subscriptionService.logPaymentEvent({
        eventType: payload.type || "unknown",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });
    } catch (error) {
      console.error("Failed to log payment event:", error);
    }
  },

  // Checkout events
  onCheckoutCreated: async (payload) => {
    console.log("Checkout created:", payload);

    try {
      await subscriptionService.logPaymentEvent({
        eventType: "checkout_created",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });
    } catch (error) {
      console.error("Failed to log checkout created event:", error);
    }
  },

  onCheckoutUpdated: async (payload) => {
    console.log("Checkout updated:", payload);

    try {
      // Log the event
      const event = await subscriptionService.logPaymentEvent({
        eventType: "checkout_updated",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });

      const payloadAny = payload as any;

      // Only process if checkout is confirmed (payment successful)
      if (payloadAny.status === "confirmed") {
        console.log("Processing confirmed checkout:", payloadAny.id);

        // Find user - prioritize app user info from metadata
        let userId: string | null = null;

        // First, try to find user from metadata (app user who initiated the purchase)
        if (payloadAny.metadata?.app_user_email) {
          const { data: user } = await supabase
            .from("keybox_users")
            .select("id")
            .eq("email", payloadAny.metadata.app_user_email)
            .single();

          userId = user?.id;
          console.log(
            `🔍 Found user by app_user_email: ${payloadAny.metadata.app_user_email} -> ${userId}`
          );
        }

        // Fallback: try to find by payment customer email
        if (!userId && payloadAny.customer_email) {
          const { data: user } = await supabase
            .from("keybox_users")
            .select("id")
            .eq("email", payloadAny.customer_email)
            .single();

          userId = user?.id;
          console.log(
            `🔍 Found user by customer_email: ${payloadAny.customer_email} -> ${userId}`
          );
        }

        // Last resort: try to find by customer ID in existing subscriptions
        if (!userId && payloadAny.customer_id) {
          const { data: subscription } = await supabase
            .from("keybox_subscriptions")
            .select("user_id")
            .eq("polar_customer_id", payloadAny.customer_id)
            .single();

          userId = subscription?.user_id;
          console.log(
            `🔍 Found user by customer_id: ${payloadAny.customer_id} -> ${userId}`
          );
        }

        if (userId) {
          // Determine plan type from product ID
          const planType = determinePlanType(payloadAny.product_id);

          // Calculate subscription end date (30 days from now for monthly)
          const currentPeriodEnd = new Date();
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

          // Activate premium subscription
          await subscriptionService.activatePremiumSubscription(
            userId,
            {
              customerId: payloadAny.customer_id,
              productId: payloadAny.product_id,
            },
            planType,
            currentPeriodEnd
          );

          console.log(
            `✅ Premium features activated for user ${userId} via checkout`
          );
        } else {
          console.log(
            `❌ User not found for email: ${payloadAny.customer_email}`
          );
        }
      }

      // Mark event as processed
      await subscriptionService.markEventProcessed(event.id);
    } catch (error) {
      console.error("Failed to process checkout updated event:", error);
    }
  },

  // Order events
  onOrderCreated: async (payload) => {
    console.log("Order created:", payload);

    try {
      await subscriptionService.logPaymentEvent({
        eventType: "order_created",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });
    } catch (error) {
      console.error("Failed to log order created event:", error);
    }
  },

  onOrderPaid: async (payload) => {
    console.log("Order paid:", payload);

    try {
      // Log the event
      const event = await subscriptionService.logPaymentEvent({
        eventType: "order_paid",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });

      // Find user - prioritize app user info from metadata
      let userId: string | null = null;
      const payloadAny = payload as any;

      // First, try to find user from metadata (app user who initiated the purchase)
      if (payloadAny.metadata?.app_user_email) {
        const { data: user } = await supabase
          .from("keybox_users")
          .select("id")
          .eq("email", payloadAny.metadata.app_user_email)
          .single();

        userId = user?.id;
        console.log(
          `🔍 Found user by app_user_email: ${payloadAny.metadata.app_user_email} -> ${userId}`
        );
      }

      // Fallback: try to find by payment customer email
      if (!userId && payloadAny.customer?.email) {
        const { data: user } = await supabase
          .from("keybox_users")
          .select("id")
          .eq("email", payloadAny.customer.email)
          .single();

        userId = user?.id;
        console.log(
          `🔍 Found user by customer_email: ${payloadAny.customer.email} -> ${userId}`
        );
      }

      if (userId) {
        // Determine plan type from product ID
        const planType = determinePlanType(payloadAny.product?.id);

        // Activate premium subscription
        await subscriptionService.activatePremiumSubscription(
          userId,
          {
            customerId: payloadAny.customer?.id,
            productId: payloadAny.product?.id,
          },
          planType,
          payloadAny.subscription?.current_period_end
            ? new Date(payloadAny.subscription.current_period_end)
            : undefined
        );

        console.log(`Premium features activated for user ${userId}`);
      }

      // Mark event as processed
      await subscriptionService.markEventProcessed(event.id);
    } catch (error) {
      console.error("Failed to process order paid event:", error);
    }
  },

  onOrderRefunded: async (payload) => {
    console.log("Order refunded:", payload);

    try {
      await subscriptionService.logPaymentEvent({
        eventType: "order_refunded",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });

      // Handle refund - cancel subscription if needed
      const payloadAny = payload as any;
      if (payloadAny.customer?.email) {
        const { data: user } = await supabase
          .from("keybox_users")
          .select("id")
          .eq("email", payloadAny.customer.email)
          .single();

        if (user?.id) {
          await subscriptionService.cancelSubscription(user.id, false);
          console.log(
            `Subscription canceled for user ${user.id} due to refund`
          );
        }
      }
    } catch (error) {
      console.error("Failed to process order refunded event:", error);
    }
  },

  // Subscription events
  onSubscriptionCreated: async (payload) => {
    console.log("Subscription created:", payload);

    try {
      await subscriptionService.logPaymentEvent({
        eventType: "subscription_created",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });
    } catch (error) {
      console.error("Failed to log subscription created event:", error);
    }
  },

  onSubscriptionActive: async (payload) => {
    console.log("Subscription active:", payload);

    try {
      await subscriptionService.logPaymentEvent({
        eventType: "subscription_active",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });

      // Find user by customer email
      const payloadAny = payload as any;
      if (payloadAny.customer?.email) {
        const { data: user } = await supabase
          .from("keybox_users")
          .select("id")
          .eq("email", payloadAny.customer.email)
          .single();

        if (user?.id) {
          const planType = determinePlanType(payloadAny.product?.id);

          await subscriptionService.activatePremiumSubscription(
            user.id,
            {
              customerId: payloadAny.customer?.id,
              subscriptionId: payloadAny.id || undefined,
              productId: payloadAny.product?.id,
            },
            planType,
            payloadAny.current_period_end
              ? new Date(payloadAny.current_period_end)
              : undefined
          );

          console.log(`Subscription activated for user ${user.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to process subscription active event:", error);
    }
  },

  onSubscriptionCanceled: async (payload) => {
    console.log("Subscription canceled:", payload);

    try {
      await subscriptionService.logPaymentEvent({
        eventType: "subscription_canceled",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });

      // Find user and cancel subscription
      const payloadAny = payload as any;
      if (payloadAny.customer?.email) {
        const { data: user } = await supabase
          .from("keybox_users")
          .select("id")
          .eq("email", payloadAny.customer.email)
          .single();

        if (user?.id) {
          await subscriptionService.cancelSubscription(user.id, true);
          console.log(`Subscription canceled for user ${user.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to process subscription canceled event:", error);
    }
  },

  onSubscriptionRevoked: async (payload) => {
    console.log("Subscription revoked:", payload);

    try {
      await subscriptionService.logPaymentEvent({
        eventType: "subscription_revoked",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });

      // Find user and immediately cancel subscription
      const payloadAny = payload as any;
      if (payloadAny.customer?.email) {
        const { data: user } = await supabase
          .from("keybox_users")
          .select("id")
          .eq("email", payloadAny.customer.email)
          .single();

        if (user?.id) {
          await subscriptionService.cancelSubscription(user.id, false);
          console.log(`Subscription revoked for user ${user.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to process subscription revoked event:", error);
    }
  },

  // Customer events
  onCustomerCreated: async (payload) => {
    console.log("Customer created:", payload);

    try {
      await subscriptionService.logPaymentEvent({
        eventType: "customer_created",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });
    } catch (error) {
      console.error("Failed to log customer created event:", error);
    }
  },

  onCustomerUpdated: async (payload) => {
    console.log("Customer updated:", payload);

    try {
      await subscriptionService.logPaymentEvent({
        eventType: "customer_updated",
        polarEventId: (payload as any).id || undefined,
        eventData: payload,
      });
    } catch (error) {
      console.error("Failed to log customer updated event:", error);
    }
  },
});
