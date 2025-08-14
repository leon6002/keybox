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

    console.log("📦 Getting user data for:", email);

    // Fetch user data from database using admin client
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("keybox_users")
      .select("*")
      .eq("email", email)
      .single();

    if (fetchError || !userData) {
      console.error("❌ User not found:", fetchError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ User data fetched successfully");

    // Convert database format to AuthUser format
    const authUser = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      kdfType: userData.kdf_type,
      kdfIterations: userData.kdf_iterations,
      kdfMemory: userData.kdf_memory,
      kdfParallelism: userData.kdf_parallelism,
      kdfSalt: userData.kdf_salt,
      masterPasswordHash: userData.master_password_hash,
      userKeyEncrypted: userData.user_key, // This stays encrypted!
      securitySettings: userData.security_settings,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    };

    // SECURITY: Return only encrypted data - NO DECRYPTION ON SERVER
    return NextResponse.json({
      success: true,
      user: authUser,
      // NOTE: No userKey returned - client must decrypt it themselves
    });

  } catch (error) {
    console.error("❌ Get user data failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
