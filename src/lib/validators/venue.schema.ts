import { z } from "zod";

export const venueStatusSchema = z.enum([
  "draft",
  "active",
  "inactive",
  "maintenance",
  "archived",
]);

export const venueImageSchema = z.object({
  url: z.string().url(),
  path: z.string().min(1),
  caption: z.string().max(200).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isCover: z.boolean(),
});

export const operatingHourSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  isClosed: z.boolean(),
});

export const venueHolidaySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Holiday name is required").max(100),
  holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  isRecurringYearly: z.boolean(),
});

export const blackoutPeriodSchema = z.object({
  id: z.string().uuid().optional(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  reason: z.string().max(300).optional().or(z.literal("")),
});

export const pricingRuleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  sportType: z
    .enum([
      "football",
      "cricket",
      "cricket_nets",
      "pickleball",
      "badminton",
      "tennis",
      "squash",
      "basketball",
      "volleyball",
      "swimming",
      "running_track",
    ])
    .optional()
    .or(z.literal("")),
  dayOfWeek: z.array(z.coerce.number().int().min(0).max(6)),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal("")),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal("")),
  pricePerSlot: z.coerce.number().min(0),
  slotDurationMinutes: z.coerce.number().int().min(15).max(480),
  priority: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export const createVenueSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only"
    ),
  description: z.string().max(2000).optional().or(z.literal("")),
  addressLine1: z.string().min(2, "Address is required").max(200),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().length(2, "Use 2-letter country code"),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  amenities: z.array(z.string().min(1).max(50)),
  images: z.array(venueImageSchema),
  status: venueStatusSchema,
  operatingHours: z.array(operatingHourSchema).length(7),
  holidays: z.array(venueHolidaySchema),
  blackouts: z.array(blackoutPeriodSchema),
  pricingRules: z.array(pricingRuleSchema),
});

export const updateVenueSchema = createVenueSchema.partial().extend({
  id: z.string().uuid(),
});

export const venueListFiltersSchema = z.object({
  search: z.string().optional(),
  status: venueStatusSchema.optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(6).max(48).default(12),
  view: z.enum(["grid", "list"]).default("grid"),
});

export type VenueImageInput = z.infer<typeof venueImageSchema>;
export type OperatingHourInput = z.infer<typeof operatingHourSchema>;
export type VenueHolidayInput = z.infer<typeof venueHolidaySchema>;
export type BlackoutPeriodInput = z.infer<typeof blackoutPeriodSchema>;
export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type VenueListFilters = z.infer<typeof venueListFiltersSchema>;

export function slugifyVenueName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const DEFAULT_OPERATING_HOURS: OperatingHourInput[] = Array.from(
  { length: 7 },
  (_, dayOfWeek) => ({
    dayOfWeek,
    openTime: "06:00",
    closeTime: "22:00",
    isClosed: false,
  })
);

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
