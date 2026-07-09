"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  createVenueAction,
  updateVenueAction,
} from "@/features/venues/actions/venue.actions";
import type { VenueDetail } from "@/features/venues/lib/types";
import {
  parseVenueAmenities,
  parseVenueImages,
} from "@/features/venues/lib/parse";
import { VenueMapPicker } from "@/features/venues/components/venue-map";
import { VenueGalleryUpload } from "@/features/venues/components/venue-gallery-upload";
import {
  VenueAmenitiesPicker,
  VenueBlackoutsEditor,
  VenueHolidaysEditor,
  VenueHoursEditor,
  VenuePricingEditor,
} from "@/features/venues/components/venue-section-editors";
import {
  createVenueSchema,
  DEFAULT_OPERATING_HOURS,
  slugifyVenueName,
  type CreateVenueInput,
} from "@/lib/validators/venue.schema";
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

interface VenueFormProps {
  venue?: VenueDetail;
  mode: "create" | "edit";
}

function buildOperatingHours(venue?: VenueDetail): CreateVenueInput["operatingHours"] {
  if (!venue?.operatingHours?.length) return DEFAULT_OPERATING_HOURS;

  const byDay = new Map(
    venue.operatingHours.map((hour) => [hour.day_of_week, hour])
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

function buildDefaultValues(venue?: VenueDetail): CreateVenueInput {
  return {
    name: venue?.name ?? "",
    slug: venue?.slug ?? "",
    description: venue?.description ?? "",
    addressLine1: venue?.address_line1 ?? "",
    addressLine2: venue?.address_line2 ?? "",
    city: venue?.city ?? "",
    state: venue?.state ?? "",
    postalCode: venue?.postal_code ?? "",
    country: venue?.country ?? "IN",
    latitude: venue?.latitude ?? "",
    longitude: venue?.longitude ?? "",
    phone: venue?.phone ?? "",
    email: venue?.email ?? "",
    amenities: parseVenueAmenities(venue?.amenities),
    images: parseVenueImages(venue?.images).map((img) => ({
      url: img.url,
      path: img.path,
      caption: img.caption ?? "",
      sortOrder: img.sortOrder,
      isCover: img.isCover,
    })),
    status: venue?.status ?? "draft",
    operatingHours: buildOperatingHours(venue),
    holidays:
      venue?.holidays?.map((holiday) => ({
        id: holiday.id,
        name: holiday.name,
        holidayDate: holiday.holiday_date,
        isRecurringYearly: holiday.is_recurring_yearly,
      })) ?? [],
    blackouts:
      venue?.blackouts?.map((blackout) => ({
        id: blackout.id,
        startTime: blackout.start_time,
        endTime: blackout.end_time,
        reason: blackout.reason ?? "",
      })) ?? [],
    pricingRules:
      venue?.pricingRules?.map((rule) => ({
        id: rule.id,
        name: rule.name,
        sportType: rule.sport_type ?? "",
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

export function VenueForm({ venue, mode }: VenueFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(venue?.slug));

  const form = useForm<CreateVenueInput>({
    resolver: zodResolver(createVenueSchema),
    defaultValues: buildDefaultValues(venue),
  });

  const watchName = form.watch("name");
  const watchLat = form.watch("latitude");
  const watchLng = form.watch("longitude");

  useEffect(() => {
    if (!slugTouched && watchName) {
      form.setValue("slug", slugifyVenueName(watchName), { shouldValidate: true });
    }
  }, [watchName, slugTouched, form]);

  function onSubmit(values: CreateVenueInput) {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      if (mode === "create") {
        const result = await createVenueAction(values);
        if (result?.error) setServerError(result.error);
      } else if (venue) {
        const result = await updateVenueAction({ ...values, id: venue.id });
        if (result.error) setServerError(result.error);
        else if (result.success) {
          setServerSuccess(result.success);
          router.refresh();
        }
      }
    });
  }

  const latitude =
    watchLat === "" || watchLat === undefined ? null : Number(watchLat);
  const longitude =
    watchLng === "" || watchLng === undefined ? null : Number(watchLng);

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
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending}
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true);
                        field.onChange(e);
                      }}
                    />
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
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="archived">Archived</option>
                    </select>
                  </FormControl>
                  <FormDescription>
                    Active venues are visible on public listings.
                  </FormDescription>
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
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Address & location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address line 1</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address line 2</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal code</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        disabled={isPending}
                        value={field.value === "" ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        disabled={isPending}
                        value={field.value === "" ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <VenueMapPicker
              latitude={latitude}
              longitude={longitude}
              disabled={isPending}
              onChange={(lat, lng) => {
                form.setValue("latitude", lat, { shouldDirty: true });
                form.setValue("longitude", lng, { shouldDirty: true });
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <VenueAmenitiesPicker form={form} disabled={isPending} />
          </CardContent>
        </Card>

        {mode === "edit" && venue && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <VenueGalleryUpload
                venueId={venue.id}
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
            <CardTitle className="text-base">Working hours</CardTitle>
          </CardHeader>
          <CardContent>
            <VenueHoursEditor form={form} disabled={isPending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <VenueHolidaysEditor form={form} disabled={isPending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blackout dates</CardTitle>
          </CardHeader>
          <CardContent>
            <VenueBlackoutsEditor form={form} disabled={isPending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing rules</CardTitle>
          </CardHeader>
          <CardContent>
            <VenuePricingEditor form={form} disabled={isPending} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create venue" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.push("/venues")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
