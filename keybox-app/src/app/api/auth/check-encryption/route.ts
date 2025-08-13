import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking encryption setup for:", email);

    // Query user by email using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("keybox_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    console.log("📊 Encryption check result:", { data, error });

    if (error) {
      console.error("❌ Encryption check failed:", error);
      return NextResponse.json(
        { error: `Failed to check encryption setup: ${error.message}` },
        { status: 500 }
      );
    }

    // Return whether user has encryption setup
    const hasEncryption = !!data;
    console.log(`✅ User ${email} has encryption setup: ${hasEncryption}`);

    return NextResponse.json({
      hasEncryption,
      userId: data?.id || null,
    });

  } catch (error) {
    console.error("❌ Check encryption failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
