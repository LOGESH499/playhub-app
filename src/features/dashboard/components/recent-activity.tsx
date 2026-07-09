import { Activity } from "lucide-react";
import { formatRelativeTime } from "@/features/dashboard/lib/format";
import type { ActivityItem } from "@/features/dashboard/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentActivityProps {
  items: ActivityItem[];
}

const TYPE_COLORS: Record<ActivityItem["type"], string> = {
  booking: "bg-primary/15 text-primary",
  audit: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  notification: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  system: "bg-muted text-muted-foreground",
};

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card className="h-full surface-card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recent activity yet. Bookings and updates will appear here.
          </p>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium capitalize ${TYPE_COLORS[item.type]}`}
                  >
                    {item.type[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
