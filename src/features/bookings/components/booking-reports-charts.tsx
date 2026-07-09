"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BookingWithRelations } from "@/features/bookings/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingReportsChartsProps {
  bookings: BookingWithRelations[];
}

function buildStatusData(bookings: BookingWithRelations[]) {
  const counts = new Map<string, number>();
  for (const b of bookings) {
    counts.set(b.status, (counts.get(b.status) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([status, count]) => ({
    status,
    count,
  }));
}

export function BookingReportsCharts({ bookings }: BookingReportsChartsProps) {
  const data = buildStatusData(bookings);
  if (data.length === 0) return null;

  return (
    <Card className="surface-card-hover">
      <CardHeader>
        <CardTitle className="text-base">Bookings by status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
