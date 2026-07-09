"use client";

import { useState, useTransition } from "react";
import {
  blockSlotsAction,
  bulkDeleteSlotsAction,
  bulkGenerateSlotsAction,
  bulkUpdateSlotsAction,
  duplicateSlotAction,
  unblockSlotsAction,
} from "@/features/slots/actions/slot.actions";
import type { SlotFormResource, SlotFormVenue } from "@/features/slots/lib/types";
import { DAY_LABELS_SHORT } from "@/lib/validators/slot.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SlotBulkPanelProps {
  venues: SlotFormVenue[];
  resources: SlotFormResource[];
  selectedSlotIds?: string[];
}

export function SlotBulkPanel({
  venues,
  resources,
  selectedSlotIds = [],
}: SlotBulkPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [resourceId, setResourceId] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [bulkPrice, setBulkPrice] = useState("");

  const filteredResources = resources.filter(
    (r) => !venueId || r.venue_id === venueId
  );

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function run(action: () => Promise<{ error?: string; success?: string } | void>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result && "error" in result && result.error) setError(result.error);
      else if (result && "success" in result && result.success) setMessage(result.success);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bulk operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
          >
            <option value="">Select resource</option>
            {filteredResources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!resourceId || daysOfWeek.length === 0) return;
            const fd = new FormData(e.currentTarget);
            run(() =>
              bulkGenerateSlotsAction({
                venueId,
                resourceId,
                startDate: String(fd.get("startDate")),
                endDate: String(fd.get("endDate")),
                daysOfWeek,
                dailyStartTime: String(fd.get("dailyStartTime")),
                dailyEndTime: String(fd.get("dailyEndTime")),
                slotDurationMinutes: Number(fd.get("duration")),
                bufferMinutes: Number(fd.get("buffer")),
                peakPrice: Number(fd.get("peakPrice")),
                offPeakPrice: Number(fd.get("offPeakPrice")),
                peakStartTime: String(fd.get("peakStartTime")),
                peakEndTime: String(fd.get("peakEndTime")),
                recurrence: String(fd.get("recurrence")) as "daily" | "weekly" | "monthly",
              })
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input name="startDate" type="date" required disabled={isPending} />
            <Input name="endDate" type="date" required disabled={isPending} />
            <select
              name="recurrence"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="weekly"
              disabled={isPending}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <Input name="dailyStartTime" type="time" defaultValue="06:00" disabled={isPending} />
            <Input name="dailyEndTime" type="time" defaultValue="22:00" disabled={isPending} />
            <Input name="duration" type="number" defaultValue={60} min={15} disabled={isPending} />
            <Input name="buffer" type="number" defaultValue={0} min={0} disabled={isPending} />
            <Input name="peakPrice" type="number" defaultValue={600} min={0} disabled={isPending} />
            <Input name="offPeakPrice" type="number" defaultValue={400} min={0} disabled={isPending} />
            <Input name="peakStartTime" type="time" defaultValue="17:00" disabled={isPending} />
            <Input name="peakEndTime" type="time" defaultValue="22:00" disabled={isPending} />
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Days of week</p>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS_SHORT.map((label, index) => (
                <Button
                  key={label}
                  type="button"
                  size="sm"
                  variant={daysOfWeek.includes(index) ? "default" : "outline"}
                  onClick={() => toggleDay(index)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={isPending || !resourceId || daysOfWeek.length === 0}>
            Bulk generate slots
          </Button>
        </form>

        {selectedSlotIds.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    bulkUpdateSlotsAction({
                      slotIds: selectedSlotIds,
                      status: "blocked",
                      slotType: "blocked",
                    })
                  )
                }
              >
                Block selected ({selectedSlotIds.length})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  run(() => unblockSlotsAction(selectedSlotIds))
                }
              >
                Unblock selected
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    bulkUpdateSlotsAction({
                      slotIds: selectedSlotIds,
                      slotType: "peak",
                    })
                  )
                }
              >
                Mark peak
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={async () => {
                  setError(null);
                  setMessage(null);
                  startTransition(async () => {
                    let ok = 0;
                    for (const id of selectedSlotIds) {
                      const result = await duplicateSlotAction(id);
                      if (!result?.error) ok += 1;
                    }
                    setMessage(`Duplicated ${ok} slot(s)`);
                  });
                }}
              >
                Duplicate selected
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  run(() => bulkDeleteSlotsAction({ slotIds: selectedSlotIds }))
                }
              >
                Delete selected
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Bulk price (₹)"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="w-40"
                disabled={isPending}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isPending || !bulkPrice}
                onClick={() =>
                  run(() =>
                    bulkUpdateSlotsAction({
                      slotIds: selectedSlotIds,
                      pricePerSlot: Number(bulkPrice),
                    })
                  )
                }
              >
                Update price
              </Button>
            </div>
          </div>
        )}

        <form
          className="grid gap-3 border-t pt-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!resourceId) return;
            const fd = new FormData(e.currentTarget);
            run(() =>
              blockSlotsAction({
                venueId,
                resourceId,
                startTime: new Date(String(fd.get("blockStart"))).toISOString(),
                endTime: new Date(String(fd.get("blockEnd"))).toISOString(),
                blockReason: String(fd.get("reason") ?? ""),
                slotType: String(fd.get("blockType")) as "blocked" | "holiday" | "maintenance",
              })
            );
          }}
        >
          <Input name="blockStart" type="datetime-local" required disabled={isPending} />
          <Input name="blockEnd" type="datetime-local" required disabled={isPending} />
          <Input name="reason" placeholder="Block reason" disabled={isPending} />
          <select
            name="blockType"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            disabled={isPending}
          >
            <option value="blocked">Block</option>
            <option value="holiday">Holiday</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <Button type="submit" variant="secondary" disabled={isPending || !resourceId}>
            Create block
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
