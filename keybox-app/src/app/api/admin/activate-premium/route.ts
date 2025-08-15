/**
 * Manual Premium Activation Endpoint
 * For testing and emergency activation
 */

import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, planType = 'pro' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('keybox_users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found", details: userError?.message },
        { status: 404 }
      );
    }

    // Activate premium subscription
    const subscription = await subscriptionService.activatePremiumSubscription(
      user.id,
      {
        customerId: 'manual_activation',
        productId: 'manual_activation',
      },
      planType as 'pro' | 'enterprise',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    );

    console.log(`✅ Premium activated manually for user ${user.id} (${email})`);

    return NextResponse.json({
      success: true,
      message: `Premium ${planType} activated for ${email}`,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      }
    });

  } catch (error) {
    console.error("Manual activation error:", error);
    return NextResponse.json(
      {
        error: "Failed to activate premium",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('keybox_users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found", details: userError?.message },
        { status: 404 }
      );
    }

    // Get subscription status
    const subscription = await subscriptionService.getUserSubscription(user.id);
    const features = await subscriptionService.getUserPremiumFeatures(user.id);
    const isPremium = await subscriptionService.hasPremiumFeatures(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: email,
      },
      subscription,
      features,
      isPremium,
    });

  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
