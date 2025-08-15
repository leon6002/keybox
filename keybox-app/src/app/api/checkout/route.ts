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

    if (!products) {
      return NextResponse.json(
        { error: "Products parameter is required" },
        { status: 400 }
      );
    }

    // Prepare checkout data
    const checkoutData: any = {
      product_id: products,
      success_url:
        process.env.SUCCESS_URL ||
        "https://www.pandakeybox.com/payment/success?checkout_id={CHECKOUT_ID}",
    };

    // Add customer information if provided
    if (customerEmail) {
      checkoutData.customer_email = customerEmail;
    }
    if (customerName) {
      checkoutData.customer_name = customerName;
    }
    if (customerExternalId) {
      checkoutData.customer_external_id = customerExternalId;
    }
    if (metadata) {
      try {
        checkoutData.metadata = JSON.parse(decodeURIComponent(metadata));
      } catch (e) {
        console.warn("Failed to parse metadata:", e);
      }
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
