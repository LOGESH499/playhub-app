import { z } from "zod";

export const slotTypeSchema = z.enum([
  "standard",
  "peak",
  "off_peak",
  "blocked",
  "holiday",
  "maintenance",
]);

export const slotStatusSchema = z.enum([
  "available",
  "blocked",
  "booked",
  "maintenance",
  "cancelled",
]);

export const slotRecurrenceSchema = z.enum([
  "none",
  "daily",
  "weekly",
  "monthly",
]);

export const createSlotSchema = z.object({
  venueId: z.string().uuid("Select a venue"),
  resourceId: z.string().uuid("Select a resource"),
  templateId: z.string().uuid().optional().or(z.literal("")),
  slotType: slotTypeSchema,
  recurrence: slotRecurrenceSchema,
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  pricePerSlot: z.coerce.number().min(0),
  capacity: z.coerce.number().int().min(1).max(500),
  status: slotStatusSchema,
  blockReason: z.string().max(300).optional().or(z.literal("")),
});

export const updateSlotSchema = createSlotSchema.partial().extend({
  id: z.string().uuid(),
});

export const bulkGenerateSlotsSchema = z.object({
  venueId: z.string().uuid(),
  resourceId: z.string().uuid(),
  templateId: z.string().uuid().optional().or(z.literal("")),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)),
  dailyStartTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  dailyEndTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  slotDurationMinutes: z.coerce.number().int().min(15).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  peakPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  offPeakPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  peakStartTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal("")),
  peakEndTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal("")),
  recurrence: slotRecurrenceSchema,
});

export const bulkUpdateSlotsSchema = z.object({
  slotIds: z.array(z.string().uuid()).min(1),
  slotType: slotTypeSchema.optional(),
  status: slotStatusSchema.optional(),
  pricePerSlot: z.coerce.number().min(0).optional(),
  blockReason: z.string().max(300).optional().or(z.literal("")),
});

export const bulkDeleteSlotsSchema = z.object({
  slotIds: z.array(z.string().uuid()).min(1),
});

export const blockSlotsSchema = z.object({
  venueId: z.string().uuid(),
  resourceId: z.string().uuid(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  blockReason: z.string().max(300).optional().or(z.literal("")),
  slotType: z.enum(["blocked", "holiday", "maintenance"]),
});

export const createSlotTemplateSchema = z.object({
  venueId: z.string().uuid(),
  resourceId: z.string().uuid(),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  recurrence: slotRecurrenceSchema,
  daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  slotDurationMinutes: z.coerce.number().int().min(15).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  peakPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  offPeakPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  peakStartTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal("")),
  peakEndTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal("")),
  defaultSlotType: slotTypeSchema,
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  isActive: z.boolean(),
});

export const updateSlotTemplateSchema = createSlotTemplateSchema.partial().extend({
  id: z.string().uuid(),
});

export const slotListFiltersSchema = z.object({
  search: z.string().optional(),
  venueId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  slotType: slotTypeSchema.optional(),
  status: slotStatusSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  view: z.enum(["month", "week", "day", "timeline", "list"]).default("week"),
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(12).max(200).default(50),
});

export type SlotType = z.infer<typeof slotTypeSchema>;
export type SlotStatus = z.infer<typeof slotStatusSchema>;
export type SlotRecurrence = z.infer<typeof slotRecurrenceSchema>;
export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type BulkGenerateSlotsInput = z.infer<typeof bulkGenerateSlotsSchema>;
export type BulkUpdateSlotsInput = z.infer<typeof bulkUpdateSlotsSchema>;
export type BulkDeleteSlotsInput = z.infer<typeof bulkDeleteSlotsSchema>;
export type BlockSlotsInput = z.infer<typeof blockSlotsSchema>;
export type CreateSlotTemplateInput = z.infer<typeof createSlotTemplateSchema>;
export type UpdateSlotTemplateInput = z.infer<typeof updateSlotTemplateSchema>;
export type SlotListFilters = z.infer<typeof slotListFiltersSchema>;

export const SLOT_TYPE_LABELS: Record<SlotType, string> = {
  standard: "Standard",
  peak: "Peak",
  off_peak: "Off Peak",
  blocked: "Blocked",
  holiday: "Holiday",
  maintenance: "Maintenance",
};

export const SLOT_STATUS_LABELS: Record<SlotStatus, string> = {
  available: "Available",
  blocked: "Blocked",
  booked: "Booked",
  maintenance: "Maintenance",
  cancelled: "Cancelled",
};

export const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
