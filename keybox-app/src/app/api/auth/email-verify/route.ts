import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode } = await request.json();

    if (!email || !verificationCode) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    console.log("🔍 Verifying email for:", email);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service not available" },
        { status: 500 }
      );
    }

    // Find user with matching email (verification code is stored in kdf_salt temporarily)
    const { data: user, error: findError } = await supabaseAdmin
      .from("keybox_users")
      .select("id, email, name, kdf_salt, user_key, email_verified")
      .eq("email", email)
      .maybeSingle();

    if (findError) {
      console.error("❌ Error finding user:", findError);
      return NextResponse.json(
        { error: "Failed to verify code" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Extract verification code and expiration from temporary storage
    const storedVerificationCode = user.kdf_salt?.replace(
      "verification_code:",
      ""
    );
    const storedExpiration = user.user_key?.replace("expires:", "");

    if (
      !storedVerificationCode ||
      storedVerificationCode !== verificationCode
    ) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (storedExpiration) {
      const now = new Date();
      const expiresAt = new Date(storedExpiration);

      if (now > expiresAt) {
        return NextResponse.json(
          { error: "Verification code has expired" },
          { status: 400 }
        );
      }
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        {
          error: "Email is already verified",
          message:
            "Your email has already been verified. You can now log in with your email and password.",
          canLogin: true,
        },
        { status: 400 }
      );
    }

    // Update user as verified and clear temporary storage
    const { error: updateError } = await supabaseAdmin
      .from("keybox_users")
      .update({
        email_verified: true,
        kdf_salt: null, // Clear verification code
        user_key: null, // Clear expiration
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to verify email" },
        { status: 500 }
      );
    }

    console.log("✅ Email verified successfully for:", email);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error("❌ Email verification error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
