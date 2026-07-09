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
import type { AcademyStats } from "@/features/academies/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AcademyReportsChartsProps {
  stats: AcademyStats;
}

export function AcademyReportsCharts({ stats }: AcademyReportsChartsProps) {
  const data = [
    { name: "Programs", value: stats.programs },
    { name: "Batches", value: stats.batches },
    { name: "Enrollments", value: stats.activeEnrollments },
    { name: "Sessions", value: stats.sessionsThisMonth },
  ];

  return (
    <Card className="surface-card-hover">
      <CardHeader>
        <CardTitle className="text-base">Academy overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                }}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
