import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role Supabase client — SERVER ONLY.
 * Bypasses RLS. Use only in API routes, server actions, and edge functions.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || url.includes("your-project")) {
    throw new Error("Supabase admin client is not configured");
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isAdminClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")
  );
}
