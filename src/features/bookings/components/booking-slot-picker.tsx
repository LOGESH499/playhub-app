"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  bookSlotAction,
  createSlotHoldAction,
  joinWaitlistAction,
} from "@/features/bookings/actions/booking.actions";
import type { BookableSlot } from "@/features/bookings/lib/types";
import { formatTimeRange } from "@/features/slots/lib/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookingSlotPickerProps {
  slots: BookableSlot[];
}

export function BookingSlotPicker({ slots }: BookingSlotPickerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [holdId, setHoldId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleHold(slotId: string) {
    setError(null);
    setActiveSlot(slotId);
    startTransition(async () => {
      const result = await createSlotHoldAction({ slotId, durationMinutes: 10 });
      if (result?.error) setError(result.error);
      else if (result?.holdId) setHoldId(result.holdId);
    });
  }

  function handleBook(slotId: string) {
    setError(null);
    startTransition(async () => {
      const result = await bookSlotAction({
        slotId,
        holdId: holdId ?? "",
        notes,
      });
      if (result?.error) setError(result.error);
    });
  }

  function handleWaitlist(slotId: string) {
    setError(null);
    startTransition(async () => {
      const result = await joinWaitlistAction({ slotId });
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  if (slots.length === 0) {
    return (
      <Card className="surface-card">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No available slots in this range. Try another date or resource.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <Card
            key={slot.id}
            className={`surface-card-hover ${activeSlot === slot.id ? "ring-2 ring-primary" : ""}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {slot.venue?.name} · {slot.resource?.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(slot.start_time).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                {formatTimeRange(slot.start_time, slot.end_time)}
              </p>
              <Badge variant="secondary">
                ₹{Number(slot.price_per_slot).toLocaleString("en-IN")}
              </Badge>
              <div className="flex flex-wrap gap-2">
                {slot.status === "available" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleHold(slot.id)}
                    >
                      Hold
                    </Button>
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleBook(slot.id)}
                    >
                      Book now
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => handleWaitlist(slot.id)}
                  >
                    Join waitlist
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {activeSlot && (
        <Card className="surface-card">
          <CardContent className="pt-6">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Input
              className="mt-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requests..."
              disabled={isPending}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
