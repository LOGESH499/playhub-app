import type { BookingWithRelations } from "@/features/bookings/lib/types";
import type { PaymentTransactionWithRelations } from "@/features/payments/lib/types";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/validators/booking.schema";
import { PAYMENT_METHOD_LABELS } from "@/lib/validators/payment.schema";
import { formatTimeRange } from "@/features/slots/lib/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BookingInvoiceProps {
  booking: BookingWithRelations;
  transactions?: PaymentTransactionWithRelations[];
}

export function BookingInvoice({ booking, transactions = [] }: BookingInvoiceProps) {
  const subtotal = Number(booking.amount);
  const tax = 0;
  const total = subtotal + tax;

  return (
    <Card className="surface-card" id="booking-invoice">
      <CardHeader>
        <CardTitle className="text-base">Booking invoice</CardTitle>
        <p className="text-xs text-muted-foreground">
          {booking.confirmation_code ?? booking.id}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Venue</p>
            <p className="font-medium">{booking.venue?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Resource</p>
            <p className="font-medium">{booking.resource?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Schedule</p>
            <p className="font-medium">
              {formatTimeRange(booking.start_time, booking.end_time)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium">{BOOKING_STATUS_LABELS[booking.status]}</p>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>₹{tax.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Payment: {PAYMENT_STATUS_LABELS[booking.payment_status]} · {booking.currency}
        </p>
        {transactions.length > 0 && (
          <div className="space-y-1 border-t border-border pt-3 text-xs">
            <p className="font-medium">Payment records</p>
            {transactions
              .filter((tx) => tx.direction === "payment")
              .map((tx) => (
                <p key={tx.id} className="text-muted-foreground">
                  {PAYMENT_METHOD_LABELS[tx.payment_method]} · ₹
                  {Number(tx.amount).toLocaleString("en-IN")}
                  {tx.reference ? ` · ${tx.reference}` : ""}
                </p>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
