import type { BookingStats } from "@/features/bookings/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingStatsCardsProps {
  stats: BookingStats;
}

export function BookingStatsCards({ stats }: BookingStatsCardsProps) {
  const items = [
    { label: "Total (MTD)", value: stats.total },
    { label: "Confirmed", value: stats.confirmed },
    { label: "Pending", value: stats.pending },
    { label: "Revenue (paid)", value: `₹${stats.revenue.toLocaleString("en-IN")}` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="surface-card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
