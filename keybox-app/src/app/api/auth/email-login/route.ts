import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("🔐 Email login attempt for:", email);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service not available" },
        { status: 500 }
      );
    }

    // Find user by email
    const { data: user, error: findError } = await supabaseAdmin
      .from("keybox_users")
      .select(
        "id, email, name, master_password_hash, email_verified, created_at"
      )
      .eq("email", email)
      .maybeSingle();

    if (findError) {
      console.error("❌ Error finding user:", findError);
      return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        { error: "Please verify your email address before logging in" },
        { status: 403 }
      );
    }

    // Check if this is an email user (has temp_email_password prefix)
    if (!user.master_password_hash?.startsWith("temp_email_password:")) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password from temporary storage
    const storedPassword = user.master_password_hash.replace(
      "temp_email_password:",
      ""
    );
    if (storedPassword !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("✅ Email login successful for:", email);

    // Return user data (similar to Google user format for compatibility)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&size=128`,
      given_name: user.name.split(" ")[0] || user.name,
      family_name: user.name.split(" ").slice(1).join(" ") || "",
      provider: "email",
      emailVerified: user.email_verified,
    };

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("❌ Email login error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
