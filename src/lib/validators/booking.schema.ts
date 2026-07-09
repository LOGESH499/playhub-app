import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
  "no_show",
]);

export const paymentStatusSchema = z.enum([
  "unpaid",
  "paid",
  "refunded",
  "partial",
]);

export const bookSlotSchema = z.object({
  slotId: z.string().uuid(),
  holdId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  userId: z.string().uuid().optional(),
});

export const createHoldSchema = z.object({
  slotId: z.string().uuid(),
  durationMinutes: z.coerce.number().int().min(1).max(30).default(10),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().max(300).optional().or(z.literal("")),
});

export const rescheduleBookingSchema = z.object({
  bookingId: z.string().uuid(),
  newSlotId: z.string().uuid(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const joinWaitlistSchema = z.object({
  slotId: z.string().uuid(),
});

export const bookingListFiltersSchema = z.object({
  search: z.string().optional(),
  status: bookingStatusSchema.optional(),
  venueId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  view: z.enum(["list", "grid"]).default("list"),
});

export type BookSlotInput = z.infer<typeof bookSlotSchema>;
export type CreateHoldInput = z.infer<typeof createHoldSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;
export type BookingListFilters = z.infer<typeof bookingListFiltersSchema>;

export const BOOKING_STATUS_LABELS: Record<
  z.infer<typeof bookingStatusSchema>,
  string
> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
  no_show: "No Show",
};

export const PAYMENT_STATUS_LABELS: Record<
  z.infer<typeof paymentStatusSchema>,
  string
> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
  partial: "Partial",
};
