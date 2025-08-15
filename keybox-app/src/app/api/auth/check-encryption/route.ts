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
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("🔍 Checking encryption setup for:", email);

    // Query user by email and check encryption fields
    const { data, error } = await supabaseAdmin
      .from("keybox_users")
      .select("id, master_password_hash, kdf_salt, user_key")
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

    if (!data) {
      console.log(`❌ User ${email} not found`);
      return NextResponse.json({
        hasEncryption: false,
        userId: null,
      });
    }

    // Check if user has proper encryption setup (not temporary email auth data)
    const hasProperEncryption = !!(
      data.master_password_hash &&
      data.kdf_salt &&
      data.user_key &&
      // Make sure it's not temporary email auth data
      !data.master_password_hash.startsWith("temp_email_password:") &&
      !data.kdf_salt.startsWith("verification_code:") &&
      !data.user_key.startsWith("expires:")
    );

    console.log(
      `✅ User ${email} has proper encryption setup: ${hasProperEncryption}`
    );

    return NextResponse.json({
      hasEncryption: hasProperEncryption,
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
