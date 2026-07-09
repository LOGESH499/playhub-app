"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EnterpriseAnalytics } from "@/features/analytics/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsChartsProps {
  analytics: EnterpriseAnalytics;
}

function formatHour(hour: number) {
  const h = hour % 24;
  const suffix = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${suffix}`;
}

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const peakData = analytics.peakHours.map((p) => ({
    ...p,
    label: formatHour(p.hour),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="surface-card-hover">
        <CardHeader>
          <CardTitle className="text-base">Booking trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
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
                  fill="var(--primary)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card-hover">
        <CardHeader>
          <CardTitle className="text-base">Revenue by month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="refunds"
                  stroke="var(--destructive)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card-hover">
        <CardHeader>
          <CardTitle className="text-base">Peak hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="bookings" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card-hover">
        <CardHeader>
          <CardTitle className="text-base">Sports popularity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.sportsPopularity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="sport" type="category" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card-hover">
        <CardHeader>
          <CardTitle className="text-base">Venue utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.venueUtilization}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="venue_name" tick={{ fontSize: 10 }} />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="utilization_pct" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card-hover">
        <CardHeader>
          <CardTitle className="text-base">Customer growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="new_customers" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
