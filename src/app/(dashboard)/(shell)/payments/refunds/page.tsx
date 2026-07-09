import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { RefundRequestsPanel } from "@/features/payments";
import {
  canManagePayments,
  listRefundRequests,
} from "@/features/payments/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Refund requests" };
export const dynamic = "force-dynamic";

export default async function PaymentRefundsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/payments/refunds");

  if (!canManagePayments(context.appRole)) {
    redirect("/payments");
  }

  const refunds = await listRefundRequests();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refund requests"
        description="Review and process offline refund requests"
        actions={
          <Button asChild variant="outline">
            <Link href="/payments">Back to payments</Link>
          </Button>
        }
      />

      <RefundRequestsPanel refunds={refunds} canManage />
    </div>
  );
}
