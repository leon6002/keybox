import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { KeyboxAuthService } from "@/lib/security/authService";

// Server-side Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  // 🚨 DEPRECATED: This endpoint is insecure and should not be used
  // Use /api/auth/get-user-data instead and perform decryption client-side
  console.warn(
    "🚨 DEPRECATED: unlock-vault endpoint called - this is insecure!"
  );
  console.warn(
    "🔒 Use /api/auth/get-user-data and client-side decryption instead"
  );

  return NextResponse.json(
    {
      error:
        "This endpoint is deprecated for security reasons. Use /api/auth/get-user-data instead.",
      deprecated: true,
      secureEndpoint: "/api/auth/get-user-data",
    },
    { status: 410 } // 410 Gone - indicates the endpoint is deprecated
  );
}
