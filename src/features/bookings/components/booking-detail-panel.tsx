"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  cancelBookingAction,
} from "@/features/bookings/actions/booking.actions";
import type { BookingWithRelations } from "@/features/bookings/lib/types";
import { BookingInvoice } from "@/features/bookings/components/booking-invoice";
import { BookingQr } from "@/features/bookings/components/booking-qr";
import { BOOKING_STATUS_LABELS } from "@/lib/validators/booking.schema";
import { BOOKING_STATUS_VARIANTS } from "@/features/bookings/lib/status";
import { formatTimeRange } from "@/features/slots/lib/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingDetailPanelProps {
  booking: BookingWithRelations;
  canManage?: boolean;
  confirmed?: boolean;
}

export function BookingDetailPanel({
  booking,
  canManage,
  confirmed,
}: BookingDetailPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const code = booking.confirmation_code ?? booking.id.slice(0, 10).toUpperCase();

  return (
    <div className="space-y-6">
      {confirmed && (
        <Alert variant="success">Booking confirmed successfully.</Alert>
      )}

      <Card className="surface-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Booking {code}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {booking.venue?.name} · {booking.resource?.name}
            </p>
          </div>
          <Badge variant={BOOKING_STATUS_VARIANTS[booking.status]}>
            {BOOKING_STATUS_LABELS[booking.status]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            <span className="text-muted-foreground">When: </span>
            {new Date(booking.start_time).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {formatTimeRange(booking.start_time, booking.end_time)}
          </p>
          <p>
            <span className="text-muted-foreground">Amount: </span>₹
            {Number(booking.amount).toLocaleString("en-IN")}
          </p>
          {canManage && booking.user && (
            <p>
              <span className="text-muted-foreground">Customer: </span>
              {booking.user.full_name}
            </p>
          )}
          {booking.notes && (
            <p>
              <span className="text-muted-foreground">Notes: </span>
              {booking.notes}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/bookings/new?reschedule=${booking.id}`}>
                Reschedule
              </Link>
            </Button>
            {["pending", "confirmed"].includes(booking.status) && (
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const reason = prompt("Cancellation reason?") ?? "";
                    const result = await cancelBookingAction({
                      bookingId: booking.id,
                      reason,
                    });
                    if (!result.error) router.push("/bookings");
                  })
                }
              >
                Cancel booking
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              Print invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingQr confirmationCode={code} bookingId={booking.id} />
        <BookingInvoice booking={booking} />
      </div>
    </div>
  );
}
