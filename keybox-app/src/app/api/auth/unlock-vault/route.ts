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
    const { email, masterPassword } = await request.json();

    if (!email || !masterPassword) {
      return NextResponse.json(
        { error: "Email and master password are required" },
        { status: 400 }
      );
    }

    console.log("🔓 Unlocking vault for:", email);

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
      userKeyEncrypted: userData.user_key,
      securitySettings: userData.security_settings,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    };

    // Try to unlock with the provided password
    console.log("🔐 Attempting to unlock with master password...");

    try {
      // Import security services
      const { SecurityServiceFactory } = await import("@/lib/security");
      const keyManagementService =
        SecurityServiceFactory.getKeyManagementService();

      // Recreate master key from password and stored KDF parameters
      const saltBytes = new Uint8Array(Buffer.from(authUser.kdfSalt, "base64"));
      const masterKey = await keyManagementService.createMasterKey(
        masterPassword,
        {
          type: authUser.kdfType,
          iterations: authUser.kdfIterations,
          memory: authUser.kdfMemory,
          parallelism: authUser.kdfParallelism,
          salt: saltBytes,
        }
      );

      // Verify the password by checking if we can decrypt the user key
      console.log("🔐 Attempting to decrypt user key...");
      console.log(
        "📦 Encrypted user key from database:",
        authUser.userKeyEncrypted
      );

      const encryptedUserKey = JSON.parse(authUser.userKeyEncrypted);
      console.log("📦 Parsed encrypted user key:", encryptedUserKey);

      try {
        const userKey = await keyManagementService.decryptUserKey(
          encryptedUserKey,
          masterKey
        );
        console.log("🔓 User key decrypted, checking result...");
        // Convert ArrayBuffer to Uint8Array if needed
        let userKeyBytes: Uint8Array;
        if (userKey.key instanceof ArrayBuffer) {
          userKeyBytes = new Uint8Array(userKey.key);
          console.log("🔄 Converted ArrayBuffer to Uint8Array");
        } else if (userKey.key instanceof Uint8Array) {
          userKeyBytes = userKey.key;
        } else {
          throw new Error(
            `Unexpected user key type: ${userKey.key?.constructor.name}`
          );
        }

        console.log("🔑 User key details:", {
          originalType: userKey.key?.constructor.name ?? "undefined",
          originalLength: userKey.key?.length ?? userKey.key?.byteLength ?? 0,
          convertedLength: userKeyBytes.length,
          hasKey: !!userKeyBytes,
          firstFewBytes: Array.from(userKeyBytes.slice(0, 8)),
        });

        if (!userKeyBytes || userKeyBytes.length === 0) {
          console.error("❌ Decrypted user key is empty or invalid!");
          throw new Error("Decrypted user key is empty");
        }

        console.log("✅ Vault unlocked successfully");

        // Return success with user data
        return NextResponse.json({
          success: true,
          user: authUser,
          userKey: {
            key: Array.from(userKeyBytes), // Convert Uint8Array to regular array for JSON
          },
        });
      } catch (decryptionError) {
        console.error("❌ User key decryption failed:", decryptionError);
        console.error("Decryption error details:", {
          name: decryptionError.name,
          message: decryptionError.message,
          stack: decryptionError.stack,
        });
        throw decryptionError; // Re-throw to be caught by outer catch
      }
    } catch (decryptError) {
      console.error(
        "❌ Failed to decrypt user key (incorrect password):",
        decryptError
      );
      return NextResponse.json(
        { error: "Incorrect master password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("❌ Vault unlock failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
