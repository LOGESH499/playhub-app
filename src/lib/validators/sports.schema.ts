import { z } from "zod";

export const bookingRulesSchema = z.object({
  min_advance_hours: z.coerce.number().int().min(0).max(168),
  max_advance_days: z.coerce.number().int().min(1).max(365),
  allow_same_day: z.boolean(),
  cancellation_hours: z.coerce.number().int().min(0).max(168),
});

export const sportStatusSchema = z.enum(["active", "disabled", "archived"]);

export const createSportSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only"
    ),
  description: z.string().max(500).optional().or(z.literal("")),
  categoryId: z.string().uuid("Select a category").optional().or(z.literal("")),
  iconName: z.string().max(50).optional().or(z.literal("")),
  imageUrl: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
  resourceLabel: z
    .string()
    .min(1, "Resource label is required")
    .max(50, "Resource label is too long"),
  defaultSlotMinutes: z.coerce
    .number()
    .int()
    .min(15, "Minimum 15 minutes")
    .max(480, "Maximum 8 hours"),
  defaultPrice: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .optional()
    .or(z.literal("")),
  status: sportStatusSchema,
  isFeatured: z.boolean(),
  displayOrder: z.coerce.number().int().min(0).max(9999),
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
  bookingRules: bookingRulesSchema,
  venueIds: z.array(z.string().uuid()),
});

export const updateSportSchema = createSportSchema.partial().extend({
  id: z.string().uuid(),
});

export const sportListFiltersSchema = z.object({
  search: z.string().optional(),
  status: sportStatusSchema.optional(),
  categoryId: z.string().uuid().optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(6).max(48).default(12),
  view: z.enum(["grid", "list"]).default("grid"),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(300).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export type BookingRulesInput = z.infer<typeof bookingRulesSchema>;
export type CreateSportInput = z.infer<typeof createSportSchema>;
export type UpdateSportInput = z.infer<typeof updateSportSchema>;
export type SportListFilters = z.infer<typeof sportListFiltersSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export function slugifySportName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const SPORT_ICON_OPTIONS = [
  { value: "trophy", label: "Trophy" },
  { value: "circle-dot", label: "Circle Dot" },
  { value: "target", label: "Target" },
  { value: "disc", label: "Disc" },
  { value: "wind", label: "Wind" },
  { value: "circle", label: "Circle" },
  { value: "square", label: "Square" },
  { value: "waves", label: "Waves" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "activity", label: "Activity" },
] as const;

export const DEFAULT_BOOKING_RULES: BookingRulesInput = {
  min_advance_hours: 1,
  max_advance_days: 30,
  allow_same_day: true,
  cancellation_hours: 24,
};
