import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  getCustomerId: async (req: NextRequest) => {
    // For now, we'll get customer ID from query params
    // In a real app, you'd get this from your user session/database
    const url = new URL(req.url);
    return url.searchParams.get("customerId") || "";
  },
  server: "sandbox", // Use sandbox for testing - change to 'production' for live
});
