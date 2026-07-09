"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CalendarEvent, DashboardStat } from "@/features/dashboard/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardChartsProps {
  stats: DashboardStat[];
  calendarEvents: CalendarEvent[];
}

function buildWeeklyData(events: CalendarEvent[]) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const dayKey = day.toDateString();
    const count = events.filter(
      (e) => new Date(e.start).toDateString() === dayKey
    ).length;

    return {
      day: day.toLocaleDateString("en-IN", { weekday: "short" }),
      bookings: count,
    };
  });
}

function buildStatBarData(stats: DashboardStat[]) {
  return stats
    .filter((s) => /^\d+$/.test(s.value.replace(/,/g, "")))
    .slice(0, 4)
    .map((s) => ({
      name: s.label.split(" ")[0],
      value: Number(s.value.replace(/,/g, "")),
    }));
}

export function DashboardCharts({ stats, calendarEvents }: DashboardChartsProps) {
  const weeklyData = buildWeeklyData(calendarEvents);
  const statBarData = buildStatBarData(stats);
  const hasWeekly = weeklyData.some((d) => d.bookings > 0);
  const hasStats = statBarData.length > 0;

  if (!hasWeekly && !hasStats) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {hasWeekly && (
        <Card className="surface-card-hover">
          <CardHeader>
            <CardTitle className="text-base font-medium">Weekly bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="bookingFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="var(--primary)"
                    fill="url(#bookingFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {hasStats && (
        <Card className="surface-card-hover">
          <CardHeader>
            <CardTitle className="text-base font-medium">Key metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statBarData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
