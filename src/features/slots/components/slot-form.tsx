"use client";

/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch is required for dependent resource filtering. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  createSlotAction,
  deleteSlotAction,
  duplicateSlotAction,
  updateSlotAction,
} from "@/features/slots/actions/slot.actions";
import type { SlotFormResource, SlotFormVenue, SlotWithRelations } from "@/features/slots/lib/types";
import {
  createSlotSchema,
  type CreateSlotInput,
} from "@/lib/validators/slot.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface SlotFormProps {
  slot?: SlotWithRelations;
  venues: SlotFormVenue[];
  resources: SlotFormResource[];
  mode: "create" | "edit";
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function buildDefaults(
  slot: SlotWithRelations | undefined,
  venues: SlotFormVenue[],
  resources: SlotFormResource[]
): CreateSlotInput {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    venueId: slot?.venue_id ?? venues[0]?.id ?? "",
    resourceId: slot?.resource_id ?? resources[0]?.id ?? "",
    templateId: slot?.template_id ?? "",
    slotType: slot?.slot_type ?? "standard",
    recurrence: slot?.recurrence ?? "none",
    startTime: slot?.start_time ?? now.toISOString(),
    endTime: slot?.end_time ?? later.toISOString(),
    durationMinutes: slot?.duration_minutes ?? 60,
    bufferMinutes: slot?.buffer_minutes ?? 0,
    pricePerSlot: slot?.price_per_slot ?? 500,
    capacity: slot?.capacity ?? 4,
    status: slot?.status ?? "available",
    blockReason: slot?.block_reason ?? "",
  };
}

export function SlotForm({ slot, venues, resources, mode }: SlotFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateSlotInput>({
    resolver: zodResolver(createSlotSchema),
    defaultValues: buildDefaults(slot, venues, resources),
  });

  const venueId = form.watch("venueId");
  const filteredResources = resources.filter(
    (r) => !venueId || r.venue_id === venueId
  );

  function onSubmit(values: CreateSlotInput) {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      if (mode === "create") {
        const result = await createSlotAction(values);
        if (result?.error) setServerError(result.error);
      } else if (slot) {
        const result = await updateSlotAction({ ...values, id: slot.id });
        if (result.error) setServerError(result.error);
        else if (result.success) {
          setServerSuccess(result.success);
          router.refresh();
        }
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError && <Alert variant="destructive">{serverError}</Alert>}
        {serverSuccess && <Alert variant="success">{serverSuccess}</Alert>}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slot details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="venueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      {...field}
                    >
                      {venues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      {...field}
                    >
                      {filteredResources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slotType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      {...field}
                    >
                      <option value="standard">Standard</option>
                      <option value="peak">Peak</option>
                      <option value="off_peak">Off Peak</option>
                      <option value="blocked">Blocked</option>
                      <option value="holiday">Holiday</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      {...field}
                    >
                      <option value="none">One-time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={isPending}
                      value={toLocalInput(field.value)}
                      onChange={(e) =>
                        field.onChange(new Date(e.target.value).toISOString())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={isPending}
                      value={toLocalInput(field.value)}
                      onChange={(e) =>
                        field.onChange(new Date(e.target.value).toISOString())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (min)</FormLabel>
                  <FormControl>
                    <Input type="number" min={15} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bufferMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buffer (min)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricePerSlot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      {...field}
                    >
                      <option value="available">Available</option>
                      <option value="blocked">Blocked</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="booked">Booked</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="blockReason"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Block reason</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create slot" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/slots")}>
            Cancel
          </Button>
          {mode === "edit" && slot && (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await duplicateSlotAction(slot.id);
                    if (result?.error) setServerError(result.error);
                    else if (result?.success) {
                      setServerSuccess(result.success);
                      router.refresh();
                    }
                  })
                }
              >
                Duplicate (+1 day)
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    if (!confirm("Delete this slot?")) return;
                    const result = await deleteSlotAction(slot.id);
                    if (result.error) setServerError(result.error);
                    else router.push("/slots");
                  })
                }
              >
                Delete slot
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
