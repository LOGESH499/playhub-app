import type { AnalyticsWidget } from "@/features/analytics/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsStatsCardsProps {
  widgets: AnalyticsWidget[];
}

export function AnalyticsStatsCards({ widgets }: AnalyticsStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {widgets.map((w) => (
        <Card key={w.id} className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {w.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{w.value}</p>
            {w.hint && (
              <p className="mt-1 text-xs text-muted-foreground">{w.hint}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
