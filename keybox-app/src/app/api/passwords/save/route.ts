import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role key (bypasses RLS)
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
    const { userId, encryptedCipher, isUpdate, entryId } = await request.json();

    if (!userId || !encryptedCipher) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("💾 Saving encrypted password to database:", {
      userId,
      isUpdate,
      entryId,
      hasEncryptedData: !!encryptedCipher.data,
    });

    const cipherData = {
      user_id: userId,
      organization_id: null,
      type: 1, // CipherType.Login = 1 (password entry)
      folder_id: encryptedCipher.folderId || null, // ✅ Use actual folder ID
      favorite: encryptedCipher.favorite || false, // ✅ Use actual favorite value
      reprompt: encryptedCipher.reprompt || 0, // Use actual reprompt value
      name: JSON.stringify(encryptedCipher.name), // Store complete EncryptedString object
      data: JSON.stringify(encryptedCipher.data), // Store complete EncryptedString object
      notes: encryptedCipher.notes
        ? JSON.stringify(encryptedCipher.notes)
        : null, // Store complete EncryptedString object
      key: null, // Individual cipher key (optional)
      attachments: null,
      deleted_at: null,
    };

    if (isUpdate && entryId) {
      // Update existing cipher
      const { data, error } = await supabaseAdmin
        .from("keybox_ciphers")
        .update(cipherData)
        .eq("id", entryId)
        .eq("user_id", userId) // Ensure user can only update their own ciphers
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to update cipher:", error);
        return NextResponse.json(
          { error: `Failed to update cipher: ${error.message}` },
          { status: 500 }
        );
      }

      console.log("✅ Password updated in database:", data);
      return NextResponse.json({
        success: true,
        cipher: data,
        operation: "update",
      });
    } else {
      // Create new cipher
      const { data, error } = await supabaseAdmin
        .from("keybox_ciphers")
        .insert(cipherData)
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to create cipher:", error);
        return NextResponse.json(
          { error: `Failed to create cipher: ${error.message}` },
          { status: 500 }
        );
      }

      console.log("✅ New password saved to database:", data);
      return NextResponse.json({
        success: true,
        cipher: data,
        operation: "create",
      });
    }
  } catch (error) {
    console.error("❌ Password save API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
