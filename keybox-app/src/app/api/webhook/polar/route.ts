import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

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

  // First, try to find user from metadata (app user who initiated the purchase)
  if (payloadData.metadata?.app_user_email) {
    const { data: user } = await supabase
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
    const { data: user } = await supabase
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
    const { data: subscription } = await supabase
      .from("keybox_subscriptions")
      .select("user_id")
      .eq("polar_customer_id", payloadData.customer_id)
      .single();

    userId = subscription?.user_id;
    console.log(
      `🔍 Found user by customer_id: ${payloadData.customer_id} -> ${userId}`
    );
  }

  return userId;
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    
    // Polar sends signature as "sha256=<hash>"
    const receivedSignature = signature.replace("sha256=", "");
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get("x-polar-webhook-signature");
    
    if (!signature) {
      console.error("Missing webhook signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify signature
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing webhook secret");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the webhook payload
    const payload = JSON.parse(body);
    console.log("✅ Polar webhook received:", payload.type, payload.data?.id);

    // Log all events for audit trail
    try {
      await subscriptionService.logPaymentEvent({
        eventType: payload.type || "unknown",
        polarEventId: payload.data?.id || undefined,
        eventData: payload,
      });
    } catch (error) {
      console.error("Failed to log payment event:", error);
    }

    // Process the webhook based on event type
    await processWebhookEvent(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function processWebhookEvent(payload: any) {
  const eventType = payload.type;
  const data = payload.data;

  switch (eventType) {
    case "checkout.created":
      await handleCheckoutCreated(data);
      break;
    case "checkout.updated":
      await handleCheckoutUpdated(data);
      break;
    case "order.created":
      await handleOrderCreated(data);
      break;
    case "order.paid":
      await handleOrderPaid(data);
      break;
    case "subscription.created":
      await handleSubscriptionCreated(data);
      break;
    case "subscription.active":
      await handleSubscriptionActive(data);
      break;
    default:
      console.log(`ℹ️ Unhandled webhook event: ${eventType}`);
  }
}

// Handler functions
async function handleCheckoutCreated(data: any) {
  console.log("Checkout created:", data.id);
  // Just log the event - no action needed
}

async function handleCheckoutUpdated(data: any) {
  console.log("Checkout updated:", data.id);

  try {
    // Log the event
    const event = await subscriptionService.logPaymentEvent({
      eventType: "checkout_updated",
      polarEventId: data.id || undefined,
      eventData: { type: "checkout.updated", data },
    });

    // Only process if checkout is confirmed (payment successful)
    if (data.status === "confirmed") {
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

        console.log(`✅ Premium features activated for user ${userId} via checkout`);
      } else {
        console.log(`❌ User not found for checkout: ${data.id}`);
      }
    }

    // Mark event as processed
    await subscriptionService.markEventProcessed(event.id);
  } catch (error) {
    console.error("Failed to process checkout updated event:", error);
  }
}

async function handleOrderCreated(data: any) {
  console.log("Order created:", data.id);
  // Just log the event - no action needed
}

async function handleOrderPaid(data: any) {
  console.log("Order paid:", data.id);

  try {
    // Log the event
    const event = await subscriptionService.logPaymentEvent({
      eventType: "order_paid",
      polarEventId: data.id || undefined,
      eventData: { type: "order.paid", data },
    });

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

      console.log(`✅ Premium features activated for user ${userId} via order`);
    } else {
      console.log(`❌ User not found for order: ${data.id}`);
    }

    // Mark event as processed
    await subscriptionService.markEventProcessed(event.id);
  } catch (error) {
    console.error("Failed to process order paid event:", error);
  }
}

async function handleSubscriptionCreated(data: any) {
  console.log("Subscription created:", data.id);
  // Just log the event - actual activation happens on subscription.active
}

async function handleSubscriptionActive(data: any) {
  console.log("Subscription active:", data.id);

  try {
    // Log the event
    const event = await subscriptionService.logPaymentEvent({
      eventType: "subscription_active",
      polarEventId: data.id || undefined,
      eventData: { type: "subscription.active", data },
    });

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
        data.current_period_end ? new Date(data.current_period_end) : undefined
      );

      console.log(`✅ Subscription activated for user ${userId}`);
    } else {
      console.log(`❌ User not found for subscription: ${data.id}`);
    }

    // Mark event as processed
    await subscriptionService.markEventProcessed(event.id);
  } catch (error) {
    console.error("Failed to process subscription active event:", error);
  }
}
