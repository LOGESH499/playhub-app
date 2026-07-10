import { CalendarDays } from "lucide-react";
import { formatTimeRange } from "@/features/dashboard/lib/format";
import type { CalendarEvent } from "@/features/dashboard/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusState } from "@/components/layout/status-state";
import { cn } from "@/lib/utils";

interface DashboardCalendarProps {
  events: CalendarEvent[];
}

function groupEventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dayKey = new Date(event.start).toDateString();
    const existing = map.get(dayKey) ?? [];
    existing.push(event);
    map.set(dayKey, existing);
  }

  return map;
}

function getWeekDays(): Date[] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function DashboardCalendar({ events }: DashboardCalendarProps) {
  const weekDays = getWeekDays();
  const grouped = groupEventsByDay(events);
  const todayKey = new Date().toDateString();

  return (
    <Card id="calendar" className="h-full scroll-mt-20 surface-card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />
          Upcoming schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day) => {
            const isToday = day.toDateString() === todayKey;
            const dayEvents = grouped.get(day.toDateString()) ?? [];

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded-lg border border-border/70 bg-background/50 p-2",
                  isToday && "border-primary/40 bg-primary/10"
                )}
              >
                <p className="text-[10px] uppercase text-muted-foreground">
                  {day.toLocaleDateString("en-IN", { weekday: "short" })}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isToday && "text-primary"
                  )}
                >
                  {day.getDate()}
                </p>
                {dayEvents.length > 0 && (
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>

        {events.length === 0 ? (
          <StatusState
            title="No upcoming bookings"
            description="Book a court to see this week's schedule here."
            className="min-h-40 border-dashed shadow-none"
          />
        ) : (
          <ul className="space-y-3">
            {events.slice(0, 6).map((event) => (
              <li
                key={event.id}
                className="interactive-list-item flex items-center justify-between gap-3 border border-border/70 bg-background/50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium capitalize">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.start).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {formatTimeRange(event.start, event.end)}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 capitalize">
                  {event.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
