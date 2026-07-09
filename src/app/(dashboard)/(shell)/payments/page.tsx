import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, RotateCcw } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import {
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

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

interface PaymentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/payments");

  const raw = await searchParams;
  const filters = paymentListFiltersSchema.parse({
    method: typeof raw.method === "string" ? raw.method : undefined,
    direction: typeof raw.direction === "string" ? raw.direction : undefined,
    entityType: typeof raw.entityType === "string" ? raw.entityType : undefined,
    startDate: typeof raw.startDate === "string" ? raw.startDate : undefined,
    endDate: typeof raw.endDate === "string" ? raw.endDate : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });

  const canManage = canManagePayments(context.appRole);
  const [result, stats] = await Promise.all([
    listPayments(filters),
    canManage ? getPaymentStats() : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={canManage ? "Payments" : "My payments"}
        description={
          canManage
            ? "Offline payment ledger — cash, UPI, card (manual), and refunds"
            : "Your payment and refund history"
        }
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/payments/refunds">
                  <RotateCcw className="h-4 w-4" />
                  Refunds
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/payments/reports">
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      />

      {canManage && stats && <PaymentStatsCards stats={stats} />}

      <PaymentTransactionsTable
        transactions={result.transactions}
        showBooking={canManage}
      />

      {result.totalPages > 1 && (
        <p className="text-sm text-muted-foreground">
          Page {result.page} of {result.totalPages} · {result.total} total
        </p>
      )}
    </div>
  );
}
