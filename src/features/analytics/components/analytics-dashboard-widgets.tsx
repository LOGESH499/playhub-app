"use client";

import Link from "next/link";
import type { AnalyticsWidget } from "@/features/analytics/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalyticsDashboardWidgetsProps {
  widgets: AnalyticsWidget[];
}

export function AnalyticsDashboardWidgets({
  widgets,
}: AnalyticsDashboardWidgetsProps) {
  if (widgets.length === 0) return null;

  return (
    <Card className="surface-card-hover">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Analytics snapshot</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/reports">Full reports</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {widgets.map((w) => (
            <div key={w.id} className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{w.label}</p>
              <p className="mt-1 text-lg font-semibold">{w.value}</p>
              {w.hint && (
                <p className="text-xs text-muted-foreground">{w.hint}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
