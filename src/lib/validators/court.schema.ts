import { z } from "zod";
import { bookingRulesSchema } from "@/lib/validators/sports.schema";
import {
  blackoutPeriodSchema,
  operatingHourSchema,
} from "@/lib/validators/venue.schema";

export const courtSportTypeSchema = z.enum([
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
]);

export const resourceStatusSchema = z.enum([
  "active",
  "maintenance",
  "inactive",
  "archived",
]);

export const courtImageSchema = z.object({
  url: z.string().url(),
  path: z.string().min(1),
  caption: z.string().max(200).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isCover: z.boolean(),
});

export const equipmentItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  quantity: z.coerce.number().int().min(0).max(9999),
  included: z.boolean(),
});

export const courtPricingRuleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  dayOfWeek: z.array(z.coerce.number().int().min(0).max(6)),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal("")),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal("")),
  pricePerSlot: z.coerce.number().min(0),
  slotDurationMinutes: z.coerce.number().int().min(15).max(480),
  priority: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export const createCourtSchema = z.object({
  venueId: z.string().uuid("Select a venue"),
  name: z.string().min(2, "Name is required").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  sportType: courtSportTypeSchema,
  resourceSubtype: z.string().max(50).optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(1).max(500),
  surfaceType: z.string().max(50).optional().or(z.literal("")),
  lengthM: z.coerce.number().min(0).optional().or(z.literal("")),
  widthM: z.coerce.number().min(0).optional().or(z.literal("")),
  isIndoor: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  status: resourceStatusSchema,
  maintenanceUntil: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  images: z.array(courtImageSchema),
  equipment: z.array(equipmentItemSchema),
  bookingRules: bookingRulesSchema,
  operatingHours: z.array(operatingHourSchema).length(7),
  blackouts: z.array(blackoutPeriodSchema),
  pricingRules: z.array(courtPricingRuleSchema),
});

export const updateCourtSchema = createCourtSchema.partial().extend({
  id: z.string().uuid(),
});

export const courtListFiltersSchema = z.object({
  search: z.string().optional(),
  venueId: z.string().uuid().optional(),
  sportType: courtSportTypeSchema.optional(),
  status: resourceStatusSchema.optional(),
  isIndoor: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(6).max(48).default(12),
  view: z.enum(["grid", "list"]).default("grid"),
});

export type CourtSportType = z.infer<typeof courtSportTypeSchema>;
export type ResourceStatus = z.infer<typeof resourceStatusSchema>;
export type CourtImageInput = z.infer<typeof courtImageSchema>;
export type EquipmentItemInput = z.infer<typeof equipmentItemSchema>;
export type CourtPricingRuleInput = z.infer<typeof courtPricingRuleSchema>;
export type CreateCourtInput = z.infer<typeof createCourtSchema>;
export type UpdateCourtInput = z.infer<typeof updateCourtSchema>;
export type CourtListFilters = z.infer<typeof courtListFiltersSchema>;

export const DEFAULT_COURT_OPERATING_HOURS = Array.from(
  { length: 7 },
  (_, dayOfWeek) => ({
    dayOfWeek,
    openTime: "06:00",
    closeTime: "22:00",
    isClosed: false,
  })
);
