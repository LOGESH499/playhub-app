"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordBookingPaymentAction } from "@/features/payments/actions/payment.actions";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/validators/payment.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RecordPaymentFormProps {
  bookingId: string;
  bookingAmount: number;
  paymentStatus: string;
}

export function RecordPaymentForm({
  bookingId,
  bookingAmount,
  paymentStatus,
}: RecordPaymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (paymentStatus === "paid" || paymentStatus === "refunded") {
    return null;
  }

  return (
    <form
      className="space-y-3 rounded-lg border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await recordBookingPaymentAction({
            bookingId,
            amount: Number(fd.get("amount")),
            paymentMethod: String(fd.get("paymentMethod")) as (typeof PAYMENT_METHODS)[number],
            reference: String(fd.get("reference") ?? ""),
            notes: String(fd.get("notes") ?? ""),
          });
          if (!result.error) router.refresh();
        });
      }}
    >
      <h3 className="font-semibold">Record offline payment</h3>
      <p className="text-xs text-muted-foreground">
        Cash, UPI, card (manual entry), or other offline methods. No payment
        gateway.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={1}
            step="0.01"
            defaultValue={bookingAmount}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="paymentMethod">Method</Label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="cash"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="reference">Reference (UPI ID, receipt #)</Label>
          <Input id="reference" name="reference" placeholder="Optional" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" placeholder="Optional" />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}
