"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  createCourtAction,
  updateCourtAction,
} from "@/features/courts/actions/court.actions";
import { COURT_SPORT_OPTIONS } from "@/features/courts/lib/constants";
import type { CourtDetail, CourtFormVenue } from "@/features/courts/lib/types";
import { parseCourtEquipment, parseCourtImages } from "@/features/courts/lib/parse";
import { CourtGalleryUpload } from "@/features/courts/components/court-gallery-upload";
import {
  CourtBlackoutsEditor,
  CourtEquipmentEditor,
  CourtHoursEditor,
  CourtPricingEditor,
  CourtSurfaceFields,
} from "@/features/courts/components/court-section-editors";
import {
  createCourtSchema,
  DEFAULT_COURT_OPERATING_HOURS,
  type CreateCourtInput,
} from "@/lib/validators/court.schema";
import { DEFAULT_BOOKING_RULES } from "@/lib/validators/sports.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface CourtFormProps {
  court?: CourtDetail;
  venues: CourtFormVenue[];
  mode: "create" | "edit";
}

function parseBookingRules(value: unknown): CreateCourtInput["bookingRules"] {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return {
      min_advance_hours: Number(v.min_advance_hours ?? 1),
      max_advance_days: Number(v.max_advance_days ?? 30),
      allow_same_day: Boolean(v.allow_same_day ?? true),
      cancellation_hours: Number(v.cancellation_hours ?? 24),
    };
  }
  return DEFAULT_BOOKING_RULES;
}

function buildOperatingHours(court?: CourtDetail): CreateCourtInput["operatingHours"] {
  if (!court?.operatingHours?.length) return DEFAULT_COURT_OPERATING_HOURS;

  const byDay = new Map(
    court.operatingHours.map((hour) => [hour.day_of_week, hour])
  );

  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const existing = byDay.get(dayOfWeek);
    if (!existing) {
      return {
        dayOfWeek,
        openTime: "06:00",
        closeTime: "22:00",
        isClosed: false,
      };
    }
    return {
      dayOfWeek,
      openTime: existing.open_time.slice(0, 5),
      closeTime: existing.close_time.slice(0, 5),
      isClosed: existing.is_closed,
    };
  });
}

function buildDefaultValues(
  court: CourtDetail | undefined,
  venues: CourtFormVenue[]
): CreateCourtInput {
  const defaultSport = COURT_SPORT_OPTIONS[0];
  return {
    venueId: court?.venue_id ?? venues[0]?.id ?? "",
    name: court?.name ?? "",
    description: court?.description ?? "",
    sportType: court?.sport_type ?? defaultSport.value,
    resourceSubtype: court?.resource_subtype ?? defaultSport.defaultSubtype,
    capacity: court?.capacity ?? 4,
    surfaceType: court?.surface_type ?? "",
    lengthM: court?.length_m ?? "",
    widthM: court?.width_m ?? "",
    isIndoor: court?.is_indoor ?? true,
    sortOrder: court?.sort_order ?? 0,
    status: court?.status ?? "active",
    maintenanceUntil: court?.maintenance_until ?? "",
    images: parseCourtImages(court?.images).map((img) => ({
      url: img.url,
      path: img.path,
      caption: img.caption ?? "",
      sortOrder: img.sortOrder,
      isCover: img.isCover,
    })),
    equipment: parseCourtEquipment(court?.equipment),
    bookingRules: parseBookingRules(court?.booking_rules),
    operatingHours: buildOperatingHours(court),
    blackouts:
      court?.blackouts?.map((blackout) => ({
        id: blackout.id,
        startTime: blackout.start_time,
        endTime: blackout.end_time,
        reason: blackout.reason ?? "",
      })) ?? [],
    pricingRules:
      court?.pricingRules?.map((rule) => ({
        id: rule.id,
        name: rule.name,
        dayOfWeek: rule.day_of_week ?? [],
        startTime: rule.start_time?.slice(0, 5) ?? "",
        endTime: rule.end_time?.slice(0, 5) ?? "",
        pricePerSlot: rule.price_per_slot,
        slotDurationMinutes: rule.slot_duration_minutes,
        priority: rule.priority,
        isActive: rule.is_active,
      })) ?? [],
  };
}

export function CourtForm({ court, venues, mode }: CourtFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateCourtInput>({
    resolver: zodResolver(createCourtSchema),
    defaultValues: buildDefaultValues(court, venues),
  });

  const watchSportType = form.watch("sportType");
  const watchStatus = form.watch("status");

  useEffect(() => {
    const option = COURT_SPORT_OPTIONS.find((o) => o.value === watchSportType);
    if (option && !court) {
      form.setValue("resourceSubtype", option.defaultSubtype);
    }
  }, [watchSportType, court, form]);

  function onSubmit(values: CreateCourtInput) {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      if (mode === "create") {
        const result = await createCourtAction(values);
        if (result?.error) setServerError(result.error);
      } else if (court) {
        const result = await updateCourtAction({ ...values, id: court.id });
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
            <CardTitle className="text-base">Basic information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="venueId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      disabled={isPending}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Select venue</option>
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name}
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
              name="name"
              render={({ field }) => (
                <FormItem>
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
              name="sportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport / resource type</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      disabled={isPending}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {COURT_SPORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
              name="resourceSubtype"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtype</FormLabel>
                  <FormControl>
                    <Input placeholder="court, lane, turf..." disabled={isPending} {...field} />
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
                      disabled={isPending}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isIndoor"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 sm:col-span-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Indoor resource</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display order</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Surface & dimensions</CardTitle>
          </CardHeader>
          <CardContent>
            <CourtSurfaceFields form={form} disabled={isPending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <CourtEquipmentEditor form={form} disabled={isPending} />
          </CardContent>
        </Card>

        {mode === "edit" && court && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <CourtGalleryUpload
                courtId={court.id}
                images={form.watch("images")}
                disabled={isPending}
                onChange={(images) =>
                  form.setValue("images", images, { shouldDirty: true })
                }
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Availability (hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <CourtHoursEditor form={form} disabled={isPending} />
          </CardContent>
        </Card>

        {watchStatus === "maintenance" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="maintenanceUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance until (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        disabled={isPending}
                        value={
                          field.value
                            ? new Date(field.value).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value).toISOString()
                              : ""
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Court is unavailable for booking until this time.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blackout periods</CardTitle>
          </CardHeader>
          <CardContent>
            <CourtBlackoutsEditor form={form} disabled={isPending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking rules</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="bookingRules.min_advance_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min advance (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bookingRules.max_advance_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max advance (days)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bookingRules.cancellation_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation window (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bookingRules.allow_same_day"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 sm:col-span-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Allow same-day booking</FormLabel>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <CourtPricingEditor form={form} disabled={isPending} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create court" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.push("/courts")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
