import type { PaymentStats } from "@/features/payments/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentStatsCardsProps {
  stats: PaymentStats;
}

export function PaymentStatsCards({ stats }: PaymentStatsCardsProps) {
  const cards = [
    {
      title: "Net revenue",
      value: `₹${stats.netRevenue.toLocaleString("en-IN")}`,
      hint: "Collected minus refunds",
    },
    {
      title: "Collected",
      value: `₹${stats.totalCollected.toLocaleString("en-IN")}`,
      hint: `${stats.transactionCount} transactions`,
    },
    {
      title: "Refunded",
      value: `₹${stats.totalRefunded.toLocaleString("en-IN")}`,
      hint: "Offline refunds processed",
    },
    {
      title: "Pending refunds",
      value: String(stats.pendingRefunds),
      hint: "Awaiting admin review",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
