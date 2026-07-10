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

interface TierDatum {
  tier: string;
  count: number;
}

interface PlatformAnalyticsChartProps {
  data: TierDatum[];
}

export function PlatformAnalyticsChart({ data }: PlatformAnalyticsChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-4 text-base font-medium">Subscriptions by tier</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="tier" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
