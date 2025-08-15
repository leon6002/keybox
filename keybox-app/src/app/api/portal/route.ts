import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Determine API base URL
    const apiBaseUrl =
      process.env.POLAR_ENV === "production"
        ? "https://api.polar.sh"
        : "https://sandbox-api.polar.sh";

    // Create customer portal session via direct API call
    const response = await fetch(
      `${apiBaseUrl}/v1/customers/${customerId}/portal`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        "Polar customer portal API error:",
        response.status,
        errorData
      );
      return NextResponse.json(
        {
          error: "Failed to create customer portal session",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const portalResult = await response.json();

    // Log successful portal creation
    console.log("✅ Customer portal session created:", {
      customerId,
      url: portalResult.url,
    });

    // Redirect to customer portal
    return NextResponse.redirect(portalResult.url);
  } catch (error) {
    console.error("Customer portal error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
