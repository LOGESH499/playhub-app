"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelBookingAction,
  completeBookingAction,
  confirmBookingAction,
} from "@/features/bookings/actions/booking.actions";
import type { BookingWithRelations } from "@/features/bookings/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface BookingActionsMenuProps {
  booking: BookingWithRelations;
  canManage?: boolean;
}

export function BookingActionsMenu({
  booking,
  canManage = true,
}: BookingActionsMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.error) router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`/bookings/${booking.id}`}>View details</a>
        </DropdownMenuItem>
        {booking.status === "pending" && (
          <DropdownMenuItem
            onClick={() => run(() => confirmBookingAction(booking.id))}
          >
            Confirm
          </DropdownMenuItem>
        )}
        {canManage && booking.status === "confirmed" && (
          <DropdownMenuItem
            onClick={() => run(() => completeBookingAction(booking.id))}
          >
            Mark completed
          </DropdownMenuItem>
        )}
        {["pending", "confirmed"].includes(booking.status) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                const reason = prompt("Cancellation reason (optional)") ?? "";
                run(() =>
                  cancelBookingAction({
                    bookingId: booking.id,
                    reason,
                  })
                );
              }}
            >
              Cancel booking
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
