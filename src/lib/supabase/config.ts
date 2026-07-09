const PLACEHOLDER_URL_FRAGMENT = "your-project";
const PLACEHOLDER_ANON_KEY = "your-anon-key";

export const SUPABASE_CONFIG_MESSAGE =
  "Supabase is not configured. Copy .env.example to .env.local and add your project URL and anon key from the Supabase dashboard.";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (url.includes(PLACEHOLDER_URL_FRAGMENT)) return false;
  if (key === PLACEHOLDER_ANON_KEY || key.includes("your-anon")) return false;

  return true;
}
