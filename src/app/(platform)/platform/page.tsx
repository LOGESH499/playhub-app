import { getPlatformAnalytics } from "@/features/platform-admin/lib/queries";
import { PlatformAnalyticsChart, PlatformStatsCards } from "@/features/platform-admin";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const analytics = await getPlatformAnalytics();

  if (!analytics) {
    return <p className="text-muted-foreground">Unable to load platform analytics.</p>;
  }

  const tierData = analytics.subscriptionsByTier.map((t) => ({
    tier: t.tier,
    count: Number(t.count),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform overview</h1>
        <p className="mt-1 text-muted-foreground">
          Tenant management, subscriptions (free mode), and system health
        </p>
      </div>

      <PlatformStatsCards analytics={analytics} />

      <PlatformAnalyticsChart data={tierData} />

      <p className="text-xs text-muted-foreground">
        Last updated {new Date(analytics.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
