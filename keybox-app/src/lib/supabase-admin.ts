import { createClient } from "@supabase/supabase-js";

// Supabase Admin Client Configuration
// This client bypasses Row Level Security (RLS) and should only be used in server-side API routes

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

// Create Supabase Admin Client (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to check if admin client is properly configured
export const isAdminConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseServiceKey);
};

// Test admin connection
export const testAdminConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
      .from("keybox_users")
      .select("count")
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error("Admin connection test failed:", error);
    return false;
  }
};
