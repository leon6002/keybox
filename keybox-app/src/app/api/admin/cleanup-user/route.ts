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
    const { email, action } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log(`🔧 Admin cleanup for user: ${email}, action: ${action}`);

    // Check current user state
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("keybox_users")
      .select("id, email, master_password_hash, kdf_salt, user_key, created_at")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Error fetching user:", fetchError);
      return NextResponse.json(
        { error: `Failed to fetch user: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has temporary email auth data
    const isTemporaryData = 
      userData.master_password_hash?.startsWith("temp_email_password:") ||
      userData.kdf_salt?.startsWith("verification_code:") ||
      userData.user_key?.startsWith("expires:");

    const hasProperEncryption = !!(
      userData.master_password_hash &&
      userData.kdf_salt &&
      userData.user_key &&
      !isTemporaryData
    );

    if (action === "check") {
      return NextResponse.json({
        user: {
          id: userData.id,
          email: userData.email,
          created_at: userData.created_at,
          hasTemporaryData: isTemporaryData,
          hasProperEncryption: hasProperEncryption,
        }
      });
    }

    if (action === "delete-temporary") {
      if (!isTemporaryData) {
        return NextResponse.json(
          { error: "User does not have temporary data. Cannot delete." },
          { status: 400 }
        );
      }

      console.log("🗑️ Deleting user with temporary data...");
      const { error: deleteError } = await supabaseAdmin
        .from("keybox_users")
        .delete()
        .eq("email", email);

      if (deleteError) {
        console.error("❌ Error deleting user:", deleteError);
        return NextResponse.json(
          { error: `Failed to delete user: ${deleteError.message}` },
          { status: 500 }
        );
      }

      console.log("✅ User with temporary data deleted successfully");
      return NextResponse.json({
        success: true,
        message: "User with temporary data deleted successfully"
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'check' or 'delete-temporary'" },
      { status: 400 }
    );

  } catch (error) {
    console.error("❌ Admin cleanup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
