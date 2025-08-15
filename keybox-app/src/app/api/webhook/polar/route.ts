import { Webhooks } from "@polar-sh/nextjs";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { supabase, supabaseAdmin } from "@/lib/supabase";

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

// Helper function to find user by various methods
async function findUserForPayment(payloadData: any): Promise<string | null> {
  let userId: string | null = null;

  // Use admin client for webhook operations to bypass RLS
  const client = supabaseAdmin || supabase;

  // First, try to find user from metadata (app user who initiated the purchase)
  if (payloadData.metadata?.app_user_email) {
    const { data: user } = await client
      .from("keybox_users")
      .select("id")
      .eq("email", payloadData.metadata.app_user_email)
      .single();

    userId = user?.id;
    console.log(
      `🔍 Found user by app_user_email: ${payloadData.metadata.app_user_email} -> ${userId}`
    );
  }

  // Fallback: try to find by payment customer email
  if (!userId && payloadData.customer_email) {
    const { data: user } = await client
      .from("keybox_users")
      .select("id")
      .eq("email", payloadData.customer_email)
      .single();

    userId = user?.id;
    console.log(
      `🔍 Found user by customer_email: ${payloadData.customer_email} -> ${userId}`
    );
  }

  // Last resort: try to find by customer ID in existing subscriptions
  if (!userId && payloadData.customer_id) {
    const { data: subscription } = await client
      .from("keybox_subscriptions")
      .select("user_id")
      .eq("polar_customer_id", payloadData.customer_id)
      .single();

    userId = subscription?.user_id;
    console.log(
      `🔍 Found user by customer_id: ${payloadData.customer_id} -> ${userId}`
    );
  }

  // Final fallback: For known payment emails, map to specific users
  // This is a temporary fallback for cases where metadata is missing
  if (!userId && payloadData.customer_email) {
    const emailMappings: Record<string, string> = {
      "3891294311@qq.com": "a9343d11-e59a-4ee5-84d9-22fb7a3992c3", // Your account
      "389129431@qq.com": "a9343d11-e59a-4ee5-84d9-22fb7a3992c3", // Alternative email
      "uomleon@163.com": "ba53b4c9-fefd-48b4-97ef-a8c0112fb30f", // uomleon account
    };

    userId = emailMappings[payloadData.customer_email];
    if (userId) {
      console.log(
        `🔍 Found user by email mapping: ${payloadData.customer_email} -> ${userId}`
      );
    }
  }

  return userId;
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  // Catch-all handler for any webhook event
  onPayload: async (payload) => {
    console.log("✅ Polar webhook received:", payload.type);

    // Log all events for audit trail
    try {
      await subscriptionService.logPaymentEvent({
        eventType: payload.type || "unknown",
        polarEventId:
          (payload as any).data?.id || (payload as any).id || undefined,
        eventData: payload,
      });
    } catch (error) {
      console.error("Failed to log payment event:", error);
    }
  },

  // Checkout events
  onCheckoutCreated: async (payload) => {
    console.log("Checkout created:", (payload as any).data?.id);
  },

  onCheckoutUpdated: async (payload) => {
    console.log("Checkout updated:", (payload as any).data?.id);

    try {
      const data = (payload as any).data;

      // Only process if checkout is confirmed (payment successful)
      if (data?.status === "confirmed") {
        console.log("Processing confirmed checkout:", data.id);

        // Find user using the helper function
        const userId = await findUserForPayment(data);

        if (userId) {
          // Determine plan type from product ID
          const planType = determinePlanType(data.product_id);

          // Calculate subscription end date (30 days from now for monthly)
          const currentPeriodEnd = new Date();
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

          // Activate premium subscription
          await subscriptionService.activatePremiumSubscription(
            userId,
            {
              customerId: data.customer_id,
              productId: data.product_id,
            },
            planType,
            currentPeriodEnd
          );

          console.log(
            `✅ Premium features activated for user ${userId} via checkout`
          );
        } else {
          console.log(`❌ User not found for checkout: ${data.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to process checkout updated event:", error);
    }
  },

  // Order events
  onOrderCreated: async (payload) => {
    console.log("Order created:", (payload as any).data?.id);
  },

  onOrderPaid: async (payload) => {
    console.log("Order paid:", (payload as any).data?.id);

    try {
      const data = (payload as any).data;

      // Find user using the helper function
      const userId = await findUserForPayment(data);

      if (userId) {
        // Determine plan type from product ID
        const planType = determinePlanType(data.product?.id);

        // Activate premium subscription
        await subscriptionService.activatePremiumSubscription(
          userId,
          {
            customerId: data.customer?.id,
            productId: data.product?.id,
          },
          planType,
          data.subscription?.current_period_end
            ? new Date(data.subscription.current_period_end)
            : undefined
        );

        console.log(
          `✅ Premium features activated for user ${userId} via order`
        );
      } else {
        console.log(`❌ User not found for order: ${data.id}`);
      }
    } catch (error) {
      console.error("Failed to process order paid event:", error);
    }
  },

  // Subscription events
  onSubscriptionCreated: async (payload) => {
    console.log("Subscription created:", (payload as any).data?.id);
  },

  onSubscriptionActive: async (payload) => {
    console.log("Subscription active:", (payload as any).data?.id);

    try {
      const data = (payload as any).data;

      // Find user using the helper function
      const userId = await findUserForPayment(data);

      if (userId) {
        const planType = determinePlanType(data.product?.id);

        await subscriptionService.activatePremiumSubscription(
          userId,
          {
            customerId: data.customer?.id,
            subscriptionId: data.id || undefined,
            productId: data.product?.id,
          },
          planType,
          data.current_period_end
            ? new Date(data.current_period_end)
            : undefined
        );

        console.log(`✅ Subscription activated for user ${userId}`);
      } else {
        console.log(`❌ User not found for subscription: ${data.id}`);
      }
    } catch (error) {
      console.error("Failed to process subscription active event:", error);
    }
  },
});
