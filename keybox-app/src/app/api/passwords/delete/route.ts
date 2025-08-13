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

    // Soft delete: mark as deleted instead of hard delete
    const { data, error } = await supabaseAdmin
      .from("keybox_ciphers")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("user_id", userId) // Ensure user can only delete their own ciphers
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
