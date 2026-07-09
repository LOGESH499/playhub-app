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
import type { PaymentStats } from "@/features/payments/lib/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/validators/payment.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentReportsChartsProps {
  stats: PaymentStats;
}

export function PaymentReportsCharts({ stats }: PaymentReportsChartsProps) {
  const data = stats.byMethod.map((row) => ({
    method:
      PAYMENT_METHOD_LABELS[
        row.method as keyof typeof PAYMENT_METHOD_LABELS
      ] ?? row.method,
    amount: row.amount,
    count: row.count,
  }));

  if (data.length === 0) return null;

  return (
    <Card className="surface-card-hover">
      <CardHeader>
        <CardTitle className="text-base">Revenue by payment method</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="method" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                }}
              />
              <Bar dataKey="amount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
