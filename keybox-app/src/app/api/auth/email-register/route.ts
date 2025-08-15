import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    console.log("📧 Starting email registration for:", email);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service not available" },
        { status: 500 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("keybox_users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking existing user:", checkError);
      return NextResponse.json(
        { error: "Failed to check user existence" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user record with pending verification
    console.log("🔧 Attempting to create user with data:", {
      email,
      name,
      verificationCode,
      expiresAt: expiresAt.toISOString(),
    });

    // Create user with minimal required fields
    // We'll store the password temporarily in a way that works with existing schema
    const { data: newUser, error: createError } = await supabaseAdmin
      .from("keybox_users")
      .insert({
        email,
        name,
        email_verified: true, // Auto-verify for demo purposes
        // Use existing fields that are available
        master_password_hash: `temp_email_password:${password}`, // Temporary storage
        kdf_salt: `verification_code:${verificationCode}`, // Store verification code here temporarily
        user_key: `expires:${expiresAt.toISOString()}`, // Store expiration here temporarily
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Error creating user:", createError);
      return NextResponse.json(
        {
          error: "Failed to create user account",
          details: createError.message,
          code: createError.code,
        },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from:
          process.env.RESEND_FROM ||
          "The PandaKeybox Team <support@pandakeybox.com>",
        to: [email],
        subject: "Verify your PandaKeyBox account",
        html: createVerificationEmailHTML(name, verificationCode),
      });

      if (emailError) {
        console.error("❌ Error sending verification email:", emailError);
        // Don't fail registration if email fails, user can request resend
      } else {
        console.log("✅ Verification email sent:", emailData);
      }
    } catch (emailError) {
      console.error("❌ Email service error:", emailError);
    }

    return NextResponse.json({
      success: true,
      message:
        "Account created successfully. Please check your email for verification code.",
      userId: newUser.id,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Email verification template
function createVerificationEmailHTML(
  name: string,
  verificationCode: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; font-size: 24px;">Welcome to PandaKeyBox, ${name}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.5;">
        Thank you for creating your PandaKeyBox account. To complete your registration,
        please verify your email address using the code below:
      </p>
      <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <h2 style="color: #495057; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 0;">
          ${verificationCode}
        </h2>
      </div>
      <p style="color: #666; font-size: 14px;">
        This code will expire in 15 minutes. If you didn't create this account,
        please ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">
        Best regards,<br />
        The PandaKeyBox Team
      </p>
    </div>
  `;
}
