import type { PlatformAnalytics } from "@/features/platform-admin/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlatformStatsCardsProps {
  analytics: PlatformAnalytics;
}

export function PlatformStatsCards({ analytics }: PlatformStatsCardsProps) {
  const cards = [
    { label: "Organizations", value: analytics.tenants, hint: `${analytics.activeTenants} active` },
    { label: "Users", value: analytics.users, hint: `${analytics.platformAdmins} platform admins` },
    { label: "Bookings", value: analytics.bookings, hint: `${analytics.bookingsThisMonth} this month` },
    { label: "Open tickets", value: analytics.openSupportTickets, hint: "Support queue" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {c.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
