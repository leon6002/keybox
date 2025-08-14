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
    const { userId, entryId } = await request.json();

    if (!userId || !entryId) {
      return NextResponse.json(
        { error: "User ID and entry ID are required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting encrypted password from database:", {
      userId,
      entryId,
    });

    // First, check if the entry exists and is not already deleted
    const { data: existingEntry, error: checkError } = await supabaseAdmin
      .from("keybox_ciphers")
      .select("id, deleted_at")
      .eq("id", entryId)
      .eq("user_id", userId)
      .single();

    if (checkError) {
      console.log("ℹ️ Entry not found in database:", checkError.message);
      // For delete operations, if the entry doesn't exist, that's actually success
      // (it means it was never synced or already removed)
      return NextResponse.json({
        success: true,
        message:
          "Password not found in database (already deleted or never synced)",
        deletedEntry: null,
      });
    }

    // If already deleted, return success (idempotent operation)
    if (existingEntry.deleted_at) {
      console.log("ℹ️ Password already deleted, returning success");
      return NextResponse.json({
        success: true,
        message: "Password already deleted",
        deletedEntry: existingEntry,
      });
    }

    // Soft delete: mark as deleted instead of hard delete
    const { data, error } = await supabaseAdmin
      .from("keybox_ciphers")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("user_id", userId) // Ensure user can only delete their own ciphers
      .is("deleted_at", null) // Only update if not already deleted
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to delete cipher:", error);
      return NextResponse.json(
        { error: `Failed to delete password: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Password not found or already deleted" },
        { status: 404 }
      );
    }

    console.log("✅ Password marked as deleted in database:", data);
    return NextResponse.json({
      success: true,
      message: "Password deleted successfully",
      deletedEntry: data,
    });
  } catch (error) {
    console.error("❌ Password delete API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
