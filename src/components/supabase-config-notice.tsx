import { Alert } from "@/components/ui/alert";
import { isSupabaseConfigured, SUPABASE_CONFIG_MESSAGE } from "@/lib/supabase/config";

export function SupabaseConfigNotice() {
  if (isSupabaseConfigured()) return null;

  return (
    <Alert variant="destructive" className="mb-4 text-left">
      <p className="font-medium">Supabase not configured</p>
      <p className="mt-1 text-sm">{SUPABASE_CONFIG_MESSAGE}</p>
      <p className="mt-2 text-sm">
        Restart the dev server after saving{" "}
        <code className="rounded bg-muted px-1">.env.local</code>.
      </p>
    </Alert>
  );
}
