import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    // First, find the KeyBox user ID by email
    const { data: user, error: userError } = await supabaseAdmin
      .from("keybox_users")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          subscription: null,
          isPremium: false,
          planType: "free",
          features: {
            unlimitedPasswords: false,
            cloudSync: false,
            prioritySupport: false,
            advancedSecurity: false,
            customCategories: false,
            exportImport: false,
          },
        },
        { status: 200 }
      );
    }

    // Get user's subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from("keybox_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        {
          subscription: null,
          isPremium: false,
          planType: "free",
          features: {
            unlimitedPasswords: false,
            cloudSync: false,
            prioritySupport: false,
            advancedSecurity: false,
            customCategories: false,
            exportImport: false,
          },
        },
        { status: 200 }
      );
    }

    // Check if subscription is active and premium
    const isPremium =
      subscription.status === "active" && subscription.plan_type !== "free";

    // Map premium features based on plan type
    const features = {
      unlimitedPasswords: isPremium,
      cloudSync: isPremium,
      prioritySupport: isPremium,
      advancedSecurity: isPremium,
      customCategories: isPremium,
      exportImport: isPremium,
    };

    // Map subscription data to frontend format
    const subscriptionData = subscription
      ? {
          id: subscription.id,
          userId: subscription.user_id,
          planType: subscription.plan_type,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          polarCustomerId: subscription.polar_customer_id,
          polarSubscriptionId: subscription.polar_subscription_id,
          polarProductId: subscription.polar_product_id,
          createdAt: subscription.created_at,
          updatedAt: subscription.updated_at,
        }
      : null;

    return NextResponse.json({
      subscription: subscriptionData,
      isPremium,
      planType: subscription.plan_type || "free",
      features,
    });
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
