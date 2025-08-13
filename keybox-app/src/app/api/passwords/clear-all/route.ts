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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Clearing all encrypted passwords for user:", userId);

    // Soft delete all user's ciphers: mark as deleted instead of hard delete
    const { data, error } = await supabaseAdmin
      .from("keybox_ciphers")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .is("deleted_at", null) // Only update non-deleted entries
      .select("id");

    if (error) {
      console.error("❌ Failed to clear ciphers:", error);
      return NextResponse.json(
        { error: `Failed to clear passwords: ${error.message}` },
        { status: 500 }
      );
    }

    const deletedCount = data?.length || 0;
    console.log(`✅ Marked ${deletedCount} passwords as deleted in database`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${deletedCount} passwords`,
      deletedCount,
    });

  } catch (error) {
    console.error("❌ Clear all passwords API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
