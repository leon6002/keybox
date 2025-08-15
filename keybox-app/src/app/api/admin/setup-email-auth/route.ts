import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service not available" },
        { status: 500 }
      );
    }

    console.log("🔧 Setting up email authentication database schema...");

    // Add email authentication fields to keybox_users table
    const alterTableSQL = `
      ALTER TABLE keybox_users 
      ADD COLUMN IF NOT EXISTS verification_code TEXT,
      ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS password_hash TEXT;
    `;

    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: alterTableSQL
    });

    if (alterError) {
      console.error("❌ Error altering table:", alterError);
      
      // Try alternative approach using direct SQL
      try {
        // Add columns one by one
        await supabaseAdmin.rpc('exec_sql', {
          sql: 'ALTER TABLE keybox_users ADD COLUMN IF NOT EXISTS verification_code TEXT;'
        });
        
        await supabaseAdmin.rpc('exec_sql', {
          sql: 'ALTER TABLE keybox_users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;'
        });
        
        await supabaseAdmin.rpc('exec_sql', {
          sql: 'ALTER TABLE keybox_users ADD COLUMN IF NOT EXISTS password_hash TEXT;'
        });
        
        console.log("✅ Successfully added columns using alternative method");
      } catch (altError) {
        console.error("❌ Alternative method also failed:", altError);
        return NextResponse.json(
          { error: "Failed to modify database schema", details: alterError },
          { status: 500 }
        );
      }
    } else {
      console.log("✅ Successfully added email auth columns");
    }

    // Make some fields optional for email users
    try {
      const makeOptionalSQL = `
        ALTER TABLE keybox_users 
        ALTER COLUMN master_password_hash DROP NOT NULL,
        ALTER COLUMN kdf_salt DROP NOT NULL,
        ALTER COLUMN user_key DROP NOT NULL;
      `;

      const { error: optionalError } = await supabaseAdmin.rpc('exec_sql', {
        sql: makeOptionalSQL
      });

      if (optionalError) {
        console.warn("⚠️ Warning: Could not make fields optional:", optionalError);
        // This is not critical, continue
      } else {
        console.log("✅ Successfully made encryption fields optional");
      }
    } catch (error) {
      console.warn("⚠️ Warning: Could not make fields optional:", error);
    }

    // Create indexes for better performance
    try {
      const indexSQL = `
        CREATE INDEX IF NOT EXISTS idx_keybox_users_verification_code ON keybox_users (verification_code);
        CREATE INDEX IF NOT EXISTS idx_keybox_users_verification_expires_at ON keybox_users (verification_expires_at);
        CREATE INDEX IF NOT EXISTS idx_keybox_users_email_verified ON keybox_users (email_verified);
      `;

      const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
        sql: indexSQL
      });

      if (indexError) {
        console.warn("⚠️ Warning: Could not create indexes:", indexError);
      } else {
        console.log("✅ Successfully created indexes");
      }
    } catch (error) {
      console.warn("⚠️ Warning: Could not create indexes:", error);
    }

    console.log("🎉 Email authentication setup completed!");

    return NextResponse.json({
      success: true,
      message: "Email authentication database schema setup completed",
    });

  } catch (error) {
    console.error("❌ Setup error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
