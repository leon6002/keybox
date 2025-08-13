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
  try {
    const { googleUser, masterPassword, masterPasswordHint } =
      await request.json();

    if (!googleUser || !masterPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🔐 Setting up encryption for:", googleUser.email);

    // Create database user with encryption
    console.log("📝 Creating encrypted user...");
    const authService = KeyboxAuthService.getInstance();

    const databaseUser = await authService.register({
      email: googleUser.email,
      name: googleUser.name,
      masterPassword,
      masterPasswordHint,
    });
    console.log("✅ User object created:", databaseUser.id);
    console.log("🔐 User KDF Config:", {
      type: databaseUser.kdfType,
      iterations: databaseUser.kdfIterations,
      memory: databaseUser.kdfMemory,
      parallelism: databaseUser.kdfParallelism,
      saltLength: databaseUser.kdfSalt.length,
    });

    // Save user to Supabase database using admin client to bypass RLS
    console.log("💾 Saving user to database...");
    const { data, error } = await supabaseAdmin
      .from("keybox_users")
      .insert({
        id: databaseUser.id,
        email: databaseUser.email,
        name: databaseUser.name,
        master_password_hash: databaseUser.masterPasswordHash,
        kdf_type: databaseUser.kdfType,
        kdf_iterations: databaseUser.kdfIterations,
        kdf_memory: databaseUser.kdfMemory,
        kdf_parallelism: databaseUser.kdfParallelism,
        kdf_salt: databaseUser.kdfSalt,
        user_key: databaseUser.userKeyEncrypted,
        security_settings: databaseUser.securitySettings,
        created_at: databaseUser.createdAt,
        updated_at: databaseUser.updatedAt,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Database save failed:", error);
      return NextResponse.json(
        { error: `Failed to save user to database: ${error.message}` },
        { status: 500 }
      );
    }
    console.log("✅ User saved to database successfully");

    // Return the user data for client-side session creation
    return NextResponse.json({
      success: true,
      user: databaseUser,
    });
  } catch (error) {
    console.error("❌ Setup encryption failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
