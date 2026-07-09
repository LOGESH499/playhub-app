import { z } from "zod";

export const PAYMENT_METHODS = ["cash", "upi", "card", "offline"] as const;
export const REFUND_ACTIONS = ["approve", "reject"] as const;

export const recordBookingPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  reference: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const requestRefundSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export const processRefundSchema = z.object({
  refundId: z.string().uuid(),
  action: z.enum(REFUND_ACTIONS),
  reviewNotes: z.string().max(500).optional().or(z.literal("")),
});

export const paymentListFiltersSchema = z.object({
  method: z.enum(PAYMENT_METHODS).optional(),
  direction: z.enum(["payment", "refund"]).optional(),
  entityType: z.enum(["booking", "academy_fee", "membership"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type RecordBookingPaymentInput = z.infer<typeof recordBookingPaymentSchema>;
export type RequestRefundInput = z.infer<typeof requestRefundSchema>;
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
export type PaymentListFilters = z.infer<typeof paymentListFiltersSchema>;

export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card (manual)",
  offline: "Offline",
};

export const REFUND_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  processed: "Processed",
};
