import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { APP_ROLE_LABELS } from "@/lib/auth/roles";
import { getDashboardData } from "@/features/dashboard/lib/queries";
import {
  DashboardCalendar,
  RecentActivity,
  StatCards,
} from "@/features/dashboard";
import { RoleBadge } from "@/features/organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Supabase not configured</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Copy <code className="rounded bg-muted px-1">.env.example</code> to{" "}
            <code className="rounded bg-muted px-1">.env.local</code> and add
            your Supabase project URL and anon key.
          </p>
        </CardContent>
      </Card>
    );
  }

  const context = await getAuthContext();
  if (!context) {
    redirect("/login");
  }

  const data = await getDashboardData(context);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {context.profile.full_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {context.activeTenant
              ? `${context.activeTenant.tenant.name} · ${APP_ROLE_LABELS[context.appRole]}`
              : "Browsing as a player — join or create an organization to manage venues"}
          </p>
        </div>
        <RoleBadge role={context.appRole} />
      </div>

      <StatCards stats={data.stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCalendar events={data.calendarEvents} />
        <RecentActivity items={data.activity} />
      </div>

      {!context.activeTenant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Get started</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/onboarding">Create organization</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/organizations">View organizations</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
