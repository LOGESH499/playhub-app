"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  createSlotTemplateAction,
  generateFromTemplateAction,
  updateSlotTemplateAction,
} from "@/features/slots/actions/slot.actions";
import type { SlotFormResource, SlotFormVenue } from "@/features/slots/lib/types";
import type { SlotTemplate } from "@/features/slots/lib/types";
import {
  createSlotTemplateSchema,
  type CreateSlotTemplateInput,
} from "@/lib/validators/slot.schema";
import { DAY_LABELS_SHORT } from "@/lib/validators/slot.schema";
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

interface SlotTemplateFormProps {
  template?: SlotTemplate;
  venues: SlotFormVenue[];
  resources: SlotFormResource[];
  mode: "create" | "edit";
}

function buildDefaults(
  template: SlotTemplate | undefined,
  venues: SlotFormVenue[],
  resources: SlotFormResource[]
): CreateSlotTemplateInput {
  return {
    venueId: template?.venue_id ?? venues[0]?.id ?? "",
    resourceId: template?.resource_id ?? resources[0]?.id ?? "",
    name: template?.name ?? "",
    description: template?.description ?? "",
    recurrence: template?.recurrence ?? "weekly",
    daysOfWeek: template?.days_of_week ?? [1, 2, 3, 4, 5],
    startTime: template?.start_time?.slice(0, 5) ?? "06:00",
    endTime: template?.end_time?.slice(0, 5) ?? "22:00",
    slotDurationMinutes: template?.slot_duration_minutes ?? 60,
    bufferMinutes: template?.buffer_minutes ?? 0,
    peakPrice: template?.peak_price ?? "",
    offPeakPrice: template?.off_peak_price ?? "",
    peakStartTime:
      (template as { peak_start_time?: string } | undefined)?.peak_start_time?.slice(0, 5) ??
      "17:00",
    peakEndTime:
      (template as { peak_end_time?: string } | undefined)?.peak_end_time?.slice(0, 5) ??
      "22:00",
    defaultSlotType: template?.default_slot_type ?? "standard",
    validFrom: template?.valid_from ?? new Date().toISOString().slice(0, 10),
    validUntil: template?.valid_until ?? "",
    isActive: template?.is_active ?? true,
  };
}

export function SlotTemplateForm({
  template,
  venues,
  resources,
  mode,
}: SlotTemplateFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [genStart, setGenStart] = useState("");
  const [genEnd, setGenEnd] = useState("");

  const form = useForm<CreateSlotTemplateInput>({
    resolver: zodResolver(createSlotTemplateSchema),
    defaultValues: buildDefaults(template, venues, resources),
  });

  const venueId = form.watch("venueId");
  const days = form.watch("daysOfWeek");
  const filteredResources = resources.filter(
    (r) => !venueId || r.venue_id === venueId
  );

  function toggleDay(day: number) {
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
    form.setValue("daysOfWeek", next, { shouldDirty: true });
  }

  function onSubmit(values: CreateSlotTemplateInput) {
    setServerError(null);
    startTransition(async () => {
      if (mode === "create") {
        const result = await createSlotTemplateAction(values);
        if (result?.error) setServerError(result.error);
      } else if (template) {
        const result = await updateSlotTemplateAction({ ...values, id: template.id });
        if (result.error) setServerError(result.error);
        else if (result.success) {
          setServerSuccess(result.success);
          router.refresh();
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {serverError && <Alert variant="destructive">{serverError}</Alert>}
          {serverSuccess && <Alert variant="success">{serverSuccess}</Alert>}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily start</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={isPending} {...field} />
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
                    <FormLabel>Daily end</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slotDurationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slot duration</FormLabel>
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
                    <FormLabel>Buffer</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="peakPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peak price</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="offPeakPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Off-peak price</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="peakStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peak window start</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="peakEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peak window end</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2">
                <FormLabel>Days of week</FormLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DAY_LABELS_SHORT.map((label, index) => (
                    <Button
                      key={label}
                      type="button"
                      size="sm"
                      variant={days.includes(index) ? "default" : "outline"}
                      onClick={() => toggleDay(index)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create template" : "Save template"}
          </Button>
        </form>
      </Form>

      {mode === "edit" && template && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate from template</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Input type="date" value={genStart} onChange={(e) => setGenStart(e.target.value)} />
            <Input type="date" value={genEnd} onChange={(e) => setGenEnd(e.target.value)} />
            <Button
              type="button"
              disabled={isPending || !genStart || !genEnd}
              onClick={() =>
                startTransition(async () => {
                  const result = await generateFromTemplateAction(
                    template.id,
                    genStart,
                    genEnd
                  );
                  if (result.error) setServerError(result.error);
                  else if (result.success) setServerSuccess(result.success);
                })
              }
            >
              Generate slots
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
