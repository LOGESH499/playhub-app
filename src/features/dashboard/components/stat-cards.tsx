import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import type { DashboardStat } from "@/features/dashboard/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  stats: DashboardStat[];
}

function TrendIcon({ trend }: { trend?: DashboardStat["trend"] }) {
  if (trend === "up") {
    return <ArrowUpRight className="h-3.5 w-3.5 text-success" />;
  }
  if (trend === "down") {
    return <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />;
  }
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.id} className="surface-card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <TrendIcon trend={stat.trend} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
            {(stat.description || stat.change) && (
              <p
                className={cn(
                  "mt-1 text-xs text-muted-foreground",
                  stat.change && "text-success"
                )}
              >
                {stat.change ?? stat.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
