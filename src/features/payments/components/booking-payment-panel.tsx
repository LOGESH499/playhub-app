import type { BookingWithRelations } from "@/features/bookings/lib/types";
import type {
  PaymentTransactionWithRelations,
  RefundRequestWithRelations,
} from "@/features/payments/lib/types";
import { RecordPaymentForm } from "@/features/payments/components/record-payment-form";
import { RequestRefundForm } from "@/features/payments/components/request-refund-form";
import { PaymentTransactionsTable } from "@/features/payments/components/payment-transactions-table";
import { RefundRequestsPanel } from "@/features/payments/components/refund-requests-panel";
import { PAYMENT_STATUS_LABELS } from "@/lib/validators/booking.schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingPaymentPanelProps {
  booking: BookingWithRelations;
  transactions: PaymentTransactionWithRelations[];
  refunds: RefundRequestWithRelations[];
  canManage?: boolean;
}

export function BookingPaymentPanel({
  booking,
  transactions,
  refunds,
  canManage,
}: BookingPaymentPanelProps) {
  const hasPendingRefund = refunds.some((r) =>
    ["requested", "approved"].includes(r.status)
  );
  const canRequestRefund =
    !canManage &&
    ["paid", "partial"].includes(booking.payment_status) &&
    !hasPendingRefund;

  return (
    <div className="space-y-6">
      <Card className="surface-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Payment status</CardTitle>
          <Badge variant="outline">
            {PAYMENT_STATUS_LABELS[booking.payment_status]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <RecordPaymentForm
              bookingId={booking.id}
              bookingAmount={Number(booking.amount)}
              paymentStatus={booking.payment_status}
            />
          )}
          {canRequestRefund && (
            <RequestRefundForm
              bookingId={booking.id}
              maxAmount={Number(booking.amount)}
            />
          )}
          {refunds.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Refund requests</h4>
              <RefundRequestsPanel refunds={refunds} canManage={canManage} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold">Transaction history</h3>
        <PaymentTransactionsTable transactions={transactions} />
      </div>
    </div>
  );
}
