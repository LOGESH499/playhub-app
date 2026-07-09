import type { PaymentTransactionWithRelations } from "@/features/payments/lib/types";
import {
  PAYMENT_METHOD_LABELS,
} from "@/lib/validators/payment.schema";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaymentTransactionsTableProps {
  transactions: PaymentTransactionWithRelations[];
  showBooking?: boolean;
}

export function PaymentTransactionsTable({
  transactions,
  showBooking = false,
}: PaymentTransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No transactions yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {showBooking && <TableHead>Booking</TableHead>}
            <TableHead>Method</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Recorded by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {new Date(tx.created_at).toLocaleString("en-IN")}
              </TableCell>
              {showBooking && (
                <TableCell className="text-sm">
                  {tx.booking?.confirmation_code ??
                    tx.booking_id?.slice(0, 8) ??
                    "—"}
                </TableCell>
              )}
              <TableCell>
                <Badge variant="outline">
                  {PAYMENT_METHOD_LABELS[tx.payment_method]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={tx.direction === "refund" ? "secondary" : "success"}
                >
                  {tx.direction}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {tx.direction === "refund" ? "−" : ""}₹
                {Number(tx.amount).toLocaleString("en-IN")}
              </TableCell>
              <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground">
                {tx.reference ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {tx.recorded_by_profile?.full_name ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
