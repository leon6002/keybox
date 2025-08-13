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
    const { userId, encryptedFolder, isUpdate, folderId } = await request.json();

    if (!userId || !encryptedFolder) {
      return NextResponse.json(
        { error: "User ID and encrypted folder are required" },
        { status: 400 }
      );
    }

    console.log("💾 Saving encrypted folder to database:", {
      userId,
      folderId,
      isUpdate,
    });

    // Prepare folder data for database
    const folderData = {
      user_id: userId,
      organization_id: null,
      name: JSON.stringify(encryptedFolder.name), // Store complete EncryptedString object
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isUpdate && folderId) {
      // Update existing folder
      const { data, error } = await supabaseAdmin
        .from("keybox_folders")
        .update({
          ...folderData,
          created_at: undefined, // Don't update created_at
        })
        .eq("id", folderId)
        .eq("user_id", userId) // Ensure user can only update their own folders
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to update folder:", error);
        return NextResponse.json(
          { error: `Failed to update folder: ${error.message}` },
          { status: 500 }
        );
      }

      console.log("✅ Folder updated in database:", data);
      return NextResponse.json({
        success: true,
        folder: data,
      });
    } else {
      // Create new folder
      const { data, error } = await supabaseAdmin
        .from("keybox_folders")
        .insert(folderData)
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to create folder:", error);
        return NextResponse.json(
          { error: `Failed to create folder: ${error.message}` },
          { status: 500 }
        );
      }

      console.log("✅ New folder created in database:", data);
      return NextResponse.json({
        success: true,
        folder: data,
      });
    }
  } catch (error) {
    console.error("❌ Folder save API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
