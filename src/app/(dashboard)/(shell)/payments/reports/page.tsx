import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  PaymentReportsCharts,
  PaymentStatsCards,
  PaymentTransactionsTable,
} from "@/features/payments";
import {
  canManagePayments,
  getPaymentStats,
  listPayments,
} from "@/features/payments/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { paymentListFiltersSchema } from "@/lib/validators/payment.schema";

export const metadata: Metadata = { title: "Payment reports" };
export const dynamic = "force-dynamic";

export default async function PaymentReportsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/payments/reports");

  if (!canManagePayments(context.appRole)) {
    redirect("/payments");
  }

  const filters = paymentListFiltersSchema.parse({ pageSize: 50 });
  const [stats, result] = await Promise.all([
    getPaymentStats(),
    listPayments(filters),
  ]);

  if (!stats) redirect("/payments");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment reports"
        description="Revenue breakdown by offline payment method"
        actions={
          <Button asChild variant="outline">
            <Link href="/payments">Back to payments</Link>
          </Button>
        }
      />

      <PaymentStatsCards stats={stats} />
      <PaymentReportsCharts stats={stats} />
      <PaymentTransactionsTable
        transactions={result.transactions.slice(0, 25)}
        showBooking
      />
    </div>
  );
}
