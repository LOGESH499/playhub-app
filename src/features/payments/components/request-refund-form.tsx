"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestRefundAction } from "@/features/payments/actions/payment.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RequestRefundFormProps {
  bookingId: string;
  maxAmount: number;
  disabled?: boolean;
}

export function RequestRefundForm({
  bookingId,
  maxAmount,
  disabled,
}: RequestRefundFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (disabled) return null;

  return (
    <form
      className="space-y-3 rounded-lg border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await requestRefundAction({
            bookingId,
            amount: Number(fd.get("amount")),
            reason: String(fd.get("reason") ?? ""),
          });
          if (!result.error) router.refresh();
        });
      }}
    >
      <h3 className="font-semibold">Request refund</h3>
      <p className="text-xs text-muted-foreground">
        Submit a refund request for staff review. Refunds are processed
        offline.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="refund-amount">Amount (₹)</Label>
          <Input
            id="refund-amount"
            name="amount"
            type="number"
            min={1}
            max={maxAmount}
            step="0.01"
            defaultValue={maxAmount}
            required
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="reason">Reason</Label>
          <Input id="reason" name="reason" placeholder="Why are you requesting a refund?" />
        </div>
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit refund request"}
      </Button>
    </form>
  );
}
