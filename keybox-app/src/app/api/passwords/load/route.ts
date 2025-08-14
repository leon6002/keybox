import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("📥 Loading encrypted passwords for user:", userId);

    // Load all encrypted ciphers for the user
    const { data: ciphers, error } = await supabaseAdmin
      .from("keybox_ciphers")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null) // Only non-deleted entries (use .is() for null comparison)
      .order("created_at", { ascending: false }); // Newest first

    if (error) {
      console.error("❌ Failed to load ciphers:", error);
      return NextResponse.json(
        { error: `Failed to load passwords: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(
      `✅ Loaded ${ciphers?.length || 0} encrypted passwords from database`
    );

    // Parse encrypted fields that may have been double-serialized
    const processedCiphers = (ciphers || []).map((cipher) => {
      try {
        return {
          ...cipher,
          name:
            typeof cipher.name === "string" && cipher.name.startsWith("{")
              ? JSON.parse(cipher.name)
              : cipher.name,
          data:
            typeof cipher.data === "string" && cipher.data.startsWith("{")
              ? JSON.parse(cipher.data)
              : cipher.data,
          notes:
            cipher.notes &&
            typeof cipher.notes === "string" &&
            cipher.notes.startsWith("{")
              ? JSON.parse(cipher.notes)
              : cipher.notes,
        };
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse cipher ${cipher.id}:`, parseError);
        return cipher; // Return original if parsing fails
      }
    });

    return NextResponse.json({
      success: true,
      ciphers: processedCiphers,
      count: processedCiphers.length,
    });
  } catch (error) {
    console.error("❌ Password load API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
