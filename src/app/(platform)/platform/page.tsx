import { Building2, Users } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const context = await getAuthContext();
  const supabase = await createClient();

  const [{ count: tenantCount }, { count: profileCount }] = await Promise.all([
    supabase
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform administration</h1>
        <p className="mt-1 text-muted-foreground">
          Signed in as {context?.profile.full_name} (Super Admin)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tenantCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Active tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{profileCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Registered profiles</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform tools</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Full platform admin features (tenant management, audit logs, system
          settings) will be built in Module 15. This page confirms super-admin
          access and role-based routing.
        </CardContent>
      </Card>
    </div>
  );
}
