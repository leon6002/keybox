import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service not available" },
        { status: 500 }
      );
    }

    console.log("🔍 Testing database connection...");

    // Test basic connection
    const { data: users, error: selectError } = await supabaseAdmin
      .from("keybox_users")
      .select("id, email, name")
      .limit(1);

    if (selectError) {
      console.error("❌ Database select error:", selectError);
      return NextResponse.json(
        { error: "Database connection failed", details: selectError },
        { status: 500 }
      );
    }

    console.log("✅ Database connection successful");

    // Test table structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'keybox_users' 
          ORDER BY ordinal_position;
        `
      });

    if (tableError) {
      console.warn("⚠️ Could not get table info:", tableError);
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount: users?.length || 0,
      tableStructure: tableInfo || "Could not retrieve table structure",
    });

  } catch (error) {
    console.error("❌ Database test error:", error);
    return NextResponse.json(
      { 
        error: "Database test failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
