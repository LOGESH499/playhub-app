"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { processRefundAction } from "@/features/payments/actions/payment.actions";
import type { RefundRequestWithRelations } from "@/features/payments/lib/types";
import { REFUND_STATUS_LABELS } from "@/lib/validators/payment.schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RefundRequestsPanelProps {
  refunds: RefundRequestWithRelations[];
  canManage?: boolean;
}

export function RefundRequestsPanel({
  refunds,
  canManage,
}: RefundRequestsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (refunds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No refund requests.</p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {refunds.map((refund) => (
        <li
          key={refund.id}
          className="flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <div>
            <p className="font-medium">
              {refund.booking?.confirmation_code ??
                refund.booking_id.slice(0, 8)}
            </p>
            <p className="text-sm text-muted-foreground">
              {refund.user?.full_name ?? "Customer"} · ₹
              {Number(refund.amount).toLocaleString("en-IN")}
            </p>
            {refund.reason && (
              <p className="mt-1 text-xs text-muted-foreground">
                {refund.reason}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {REFUND_STATUS_LABELS[refund.status] ?? refund.status}
            </Badge>
            {canManage && refund.status === "requested" && (
              <>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await processRefundAction({
                        refundId: refund.id,
                        action: "approve",
                      });
                      router.refresh();
                    })
                  }
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    const notes =
                      prompt("Rejection notes (optional)") ?? "";
                    startTransition(async () => {
                      await processRefundAction({
                        refundId: refund.id,
                        action: "reject",
                        reviewNotes: notes,
                      });
                      router.refresh();
                    });
                  }}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
