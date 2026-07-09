"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  createSportAction,
  updateSportAction,
} from "@/features/sports/actions/sports.actions";
import type { SportFormVenue, SportWithCategory } from "@/features/sports/lib/types";
import type { SportCategory } from "@/features/sports/lib/types";
import {
  createSportSchema,
  DEFAULT_BOOKING_RULES,
  SPORT_ICON_OPTIONS,
  slugifySportName,
  type CreateSportInput,
} from "@/lib/validators/sports.schema";
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

interface SportFormProps {
  sport?: SportWithCategory;
  categories: SportCategory[];
  venues?: SportFormVenue[];
  mode: "create" | "edit";
}

function parseBookingRules(value: unknown): CreateSportInput["bookingRules"] {
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

export function SportForm({ sport, categories, venues = [], mode }: SportFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(sport?.slug));

  const form = useForm<CreateSportInput>({
    resolver: zodResolver(createSportSchema),
    defaultValues: {
      name: sport?.name ?? "",
      slug: sport?.slug ?? "",
      description: sport?.description ?? "",
      categoryId: sport?.category_id ?? "",
      iconName: sport?.icon_name ?? "activity",
      imageUrl: sport?.image_url ?? "",
      resourceLabel: sport?.resource_label ?? "Court",
      defaultSlotMinutes: sport?.default_slot_minutes ?? 60,
      defaultPrice: sport?.default_price ?? "",
      status: sport?.status ?? "active",
      isFeatured: sport?.is_featured ?? false,
      displayOrder: sport?.display_order ?? 0,
      sportType: sport?.sport_type ?? "",
      bookingRules: parseBookingRules(sport?.booking_rules),
      venueIds: venues.filter((v) => v.assigned).map((v) => v.id),
    },
  });

  const watchName = useWatch({ control: form.control, name: "name" });

  useEffect(() => {
    if (!slugTouched && watchName) {
      form.setValue("slug", slugifySportName(watchName), { shouldValidate: true });
    }
  }, [watchName, slugTouched, form]);

  function onSubmit(values: CreateSportInput) {
    setServerError(null);
    setServerSuccess(null);
    startTransition(async () => {
      if (mode === "create") {
        const result = await createSportAction(values);
        if (result?.error) setServerError(result.error);
      } else if (sport) {
        const result = await updateSportAction({ ...values, id: sport.id });
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
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      disabled={isPending}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      disabled={isPending}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="iconName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      disabled={isPending}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {SPORT_ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
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
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 sm:col-span-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                      className="h-4 w-4 rounded border"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Featured sport</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display order</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={isPending} {...field} />
                  </FormControl>
                  <FormDescription>Lower numbers appear first</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking & pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="resourceLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource label</FormLabel>
                  <FormControl>
                    <Input placeholder="Court, Lane, Pitch..." disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultSlotMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default slot duration (min)</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={isPending} {...field} />
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
                  <FormLabel>Legacy sport type (optional)</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      disabled={isPending}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Custom sport</option>
                      <option value="badminton">Badminton</option>
                      <option value="football">Football</option>
                      <option value="cricket">Cricket</option>
                      <option value="tennis">Tennis</option>
                      <option value="swimming">Swimming</option>
                      <option value="pickleball">Pickleball</option>
                      <option value="squash">Squash</option>
                      <option value="basketball">Basketball</option>
                      <option value="volleyball">Volleyball</option>
                      <option value="cricket_nets">Cricket Nets</option>
                    </select>
                  </FormControl>
                  <FormDescription>Links to booking engine enum</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bookingRules.min_advance_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min advance (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={isPending} {...field} />
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
                    <Input type="number" disabled={isPending} {...field} />
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
                    <Input type="number" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bookingRules.allow_same_day"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                      className="h-4 w-4 rounded border"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Allow same-day booking</FormLabel>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {venues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assign to venues</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="venueIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-2">
                      {venues.map((venue) => (
                        <label
                          key={venue.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={field.value?.includes(venue.id)}
                            onChange={(e) => {
                              const current = field.value ?? [];
                              field.onChange(
                                e.target.checked
                                  ? [...current, venue.id]
                                  : current.filter((id) => id !== venue.id)
                              );
                            }}
                            disabled={isPending}
                            className="h-4 w-4 rounded border"
                          />
                          {venue.name}
                        </label>
                      ))}
                    </div>
                    <FormDescription>
                      Assigning venues creates default pricing rules when a price is set
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving...
              </>
            ) : mode === "create" ? (
              "Create sport"
            ) : (
              "Save changes"
            )}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push("/sports")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
