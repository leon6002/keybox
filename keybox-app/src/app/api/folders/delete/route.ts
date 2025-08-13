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
    const { userId, folderId } = await request.json();

    if (!userId || !folderId) {
      return NextResponse.json(
        { error: "User ID and folder ID are required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting encrypted folder from database:", {
      userId,
      folderId,
    });

    // Soft delete: mark as deleted instead of hard delete
    const { data, error } = await supabaseAdmin
      .from("keybox_folders")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", folderId)
      .eq("user_id", userId) // Ensure user can only delete their own folders
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to delete folder:", error);
      return NextResponse.json(
        { error: `Failed to delete folder: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Folder not found or already deleted" },
        { status: 404 }
      );
    }

    console.log("✅ Folder marked as deleted in database:", data);
    return NextResponse.json({
      success: true,
      message: "Folder deleted successfully",
      deletedFolder: data,
    });

  } catch (error) {
    console.error("❌ Folder delete API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
