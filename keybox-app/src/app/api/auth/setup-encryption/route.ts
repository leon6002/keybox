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

    // Check if user already exists (might be from email registration)
    console.log("🔍 Checking for existing user...");
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("keybox_users")
      .select("id, email, name, master_password_hash, kdf_salt, user_key")
      .eq("email", googleUser.email)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking existing user:", checkError);
      return NextResponse.json(
        { error: `Failed to check existing user: ${checkError.message}` },
        { status: 500 }
      );
    }

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

    let data, error;

    if (existingUser) {
      // Check if it's temporary email auth data or incomplete setup
      const hasProperEncryption = !!(
        existingUser.master_password_hash &&
        existingUser.kdf_salt &&
        existingUser.user_key &&
        // Make sure it's not temporary email auth data
        !existingUser.master_password_hash.startsWith("temp_email_password:") &&
        !existingUser.kdf_salt.startsWith("verification_code:") &&
        !existingUser.user_key.startsWith("expires:")
      );

      if (!hasProperEncryption) {
        console.log("🔄 Updating existing user with proper encryption...");

        // Update existing user with proper encryption data
        const updateData: any = {
          name: databaseUser.name, // Update name from Google
          master_password_hash: databaseUser.masterPasswordHash,
          kdf_type: databaseUser.kdfType,
          kdf_iterations: databaseUser.kdfIterations,
          kdf_salt: databaseUser.kdfSalt,
          user_key: databaseUser.userKeyEncrypted,
          security_settings: databaseUser.securitySettings,
          updated_at: databaseUser.updatedAt,
        };

        // Add optional fields if they exist in the schema
        if (databaseUser.kdfMemory !== undefined) {
          updateData.kdf_memory = databaseUser.kdfMemory;
        }
        if (databaseUser.kdfParallelism !== undefined) {
          updateData.kdf_parallelism = databaseUser.kdfParallelism;
        }

        const updateResult = await supabaseAdmin
          .from("keybox_users")
          .update(updateData)
          .eq("email", googleUser.email)
          .select()
          .single();

        data = updateResult.data;
        error = updateResult.error;

        // Update the databaseUser ID to match the existing user
        if (data) {
          databaseUser.id = data.id;
        }
      } else {
        console.log("❌ User already has proper encryption setup");
        return NextResponse.json(
          {
            error: "User already has encryption setup. Please sign in instead.",
          },
          { status: 409 }
        );
      }
    } else {
      // Create new user
      console.log("💾 Creating new user in database...");
      const insertResult = await supabaseAdmin
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

      data = insertResult.data;
      error = insertResult.error;
    }

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
