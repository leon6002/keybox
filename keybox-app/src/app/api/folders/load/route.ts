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

    console.log("📥 Loading encrypted folders from database for user:", userId);

    // Load encrypted folders from database
    const { data: folders, error } = await supabaseAdmin
      .from("keybox_folders")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null) // Only get non-deleted folders
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Failed to load folders:", error);
      return NextResponse.json(
        { error: `Failed to load folders: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`📥 Loaded ${folders?.length || 0} encrypted folders from database`);

    return NextResponse.json({
      success: true,
      folders: folders || [],
    });

  } catch (error) {
    console.error("❌ Folder load API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
