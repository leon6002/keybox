import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract parameters
    const products = searchParams.get("products");
    const customerEmail = searchParams.get("customerEmail");
    const customerName = searchParams.get("customerName");
    const customerExternalId = searchParams.get("customerExternalId");
    const metadata = searchParams.get("metadata");

    // App user information (the logged-in user who initiated the purchase)
    const appUserEmail = searchParams.get("appUserEmail");
    const appUserId = searchParams.get("appUserId");

    if (!products) {
      return NextResponse.json(
        { error: "Products parameter is required" },
        { status: 400 }
      );
    }

    // Prepare checkout data - use products array format for Polar API
    const checkoutData: any = {
      products: [products], // Polar expects an array of product IDs
      success_url:
        process.env.SUCCESS_URL ||
        "https://www.pandakeybox.com/payment/success?checkout_id={CHECKOUT_ID}",
    };

    // Add customer information if provided and valid
    if (customerEmail && customerEmail !== "user@example.com") {
      // Only add customer email if it's not the placeholder
      checkoutData.customer_email = customerEmail;
    }
    if (customerName && customerName !== "User") {
      // Only add customer name if it's not the placeholder
      checkoutData.customer_name = customerName;
    }
    if (customerExternalId) {
      checkoutData.customer_external_id = customerExternalId;
    }
    // Prepare metadata with app user information
    const checkoutMetadata: any = {};

    // Include app user information for webhook processing
    if (appUserId) {
      checkoutMetadata.app_user_id = appUserId;
    }
    if (appUserEmail) {
      checkoutMetadata.app_user_email = appUserEmail;
    }

    // Include any additional metadata passed in
    if (metadata) {
      try {
        const additionalMetadata = JSON.parse(decodeURIComponent(metadata));
        Object.assign(checkoutMetadata, additionalMetadata);
      } catch (e) {
        console.warn("Failed to parse metadata:", e);
      }
    }

    // Only add metadata if we have some
    if (Object.keys(checkoutMetadata).length > 0) {
      checkoutData.metadata = checkoutMetadata;
    }

    // Determine API base URL
    const apiBaseUrl =
      process.env.POLAR_ENV === "production"
        ? "https://api.polar.sh"
        : "https://sandbox-api.polar.sh";

    // Create checkout via direct API call
    const response = await fetch(`${apiBaseUrl}/v1/checkouts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Polar API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to create checkout", details: errorData },
        { status: response.status }
      );
    }

    const checkoutResult = await response.json();

    // Log successful checkout creation
    console.log("✅ Checkout created successfully:", {
      checkoutId: checkoutResult.id,
      url: checkoutResult.url,
      customerEmail: checkoutResult.customer_email,
    });

    // Redirect to Polar checkout
    return NextResponse.redirect(checkoutResult.url);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
