import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  AnalyticsCharts,
  AnalyticsExportBar,
  AnalyticsFiltersBar,
  AnalyticsLiveShell,
  AnalyticsStatsCards,
  AnalyticsTables,
} from "@/features/analytics";
import {
  buildAnalyticsWidgets,
  canViewAnalytics,
  getEnterpriseAnalytics,
} from "@/features/analytics/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import {
  analyticsFiltersSchema,
  defaultAnalyticsRange,
} from "@/lib/validators/analytics.schema";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Enterprise analytics" };
export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function FiltersSkeleton() {
  return <Skeleton className="h-20 w-full" />;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/reports");

  if (!canViewAnalytics(context.appRole)) {
    redirect("/dashboard");
  }

  if (!context.activeTenant) {
    redirect("/organizations");
  }

  const raw = await searchParams;
  const defaults = defaultAnalyticsRange();
  const filters = analyticsFiltersSchema.parse({
    startDate:
      typeof raw.startDate === "string" ? raw.startDate : defaults.startDate,
    endDate: typeof raw.endDate === "string" ? raw.endDate : defaults.endDate,
  });

  const analytics = await getEnterpriseAnalytics(filters);
  if (!analytics) redirect("/dashboard");

  const widgets = buildAnalyticsWidgets(analytics);

  return (
    <AnalyticsLiveShell tenantId={context.activeTenant.tenantId}>
      <div className="space-y-6">
        <PageHeader
          title="Enterprise analytics"
          description="Venue utilization, revenue, booking trends, academy & coach performance"
        />

        <Suspense fallback={<FiltersSkeleton />}>
          <AnalyticsFiltersBar filters={filters} />
        </Suspense>

        <AnalyticsStatsCards widgets={widgets} />
        <AnalyticsExportBar analytics={analytics} />
        <AnalyticsCharts analytics={analytics} />
        <AnalyticsTables analytics={analytics} />

        <p className="text-xs text-muted-foreground">
          Live updates when bookings or payments change · Last generated{" "}
          {new Date(analytics.generatedAt).toLocaleString("en-IN")}
        </p>
      </div>
    </AnalyticsLiveShell>
  );
}
