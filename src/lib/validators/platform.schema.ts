import { z } from "zod";

export const SUBSCRIPTION_TIERS = ["free", "pro", "enterprise"] as const;
export const SUBSCRIPTION_STATUSES = ["active", "trialing", "cancelled", "suspended"] as const;
export const TENANT_STATUSES = ["active", "suspended"] as const;
export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export const updateTenantStatusSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(TENANT_STATUSES),
});

export const updateSubscriptionSchema = z.object({
  tenantId: z.string().uuid(),
  tier: z.enum(SUBSCRIPTION_TIERS).optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  seatsLimit: z.coerce.number().int().min(1).max(10000).optional(),
  venuesLimit: z.coerce.number().int().min(1).max(1000).optional(),
});

export const setPlatformAdminSchema = z.object({
  userId: z.string().uuid(),
  isAdmin: z.boolean(),
});

export const upsertFeatureFlagSchema = z.object({
  key: z.string().min(2).max(80).regex(/^[a-z][a-z0-9_]*$/),
  enabled: z.boolean(),
  description: z.string().max(200).optional().or(z.literal("")),
  rolloutPercent: z.coerce.number().int().min(0).max(100).default(100),
});

export const upsertPlatformSettingSchema = z.object({
  key: z.string().min(2).max(80),
  value: z.record(z.unknown()),
  description: z.string().max(200).optional().or(z.literal("")),
});

export const updateSupportTicketSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  resolutionNotes: z.string().max(2000).optional().or(z.literal("")),
});

export const createSupportTicketSchema = z.object({
  subject: z.string().min(3).max(120),
  body: z.string().max(2000).optional().or(z.literal("")),
  priority: z.enum(TICKET_PRIORITIES).default("normal"),
});

export const tenantListFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(TENANT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const userListFiltersSchema = z.object({
  search: z.string().optional(),
  adminsOnly: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type UpdateTenantStatusInput = z.infer<typeof updateTenantStatusSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type SetPlatformAdminInput = z.infer<typeof setPlatformAdminSchema>;
export type UpsertFeatureFlagInput = z.infer<typeof upsertFeatureFlagSchema>;
export type UpsertPlatformSettingInput = z.infer<typeof upsertPlatformSettingSchema>;
export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>;
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
export type TenantListFilters = z.infer<typeof tenantListFiltersSchema>;
export type UserListFilters = z.infer<typeof userListFiltersSchema>;

export const TIER_LABELS: Record<(typeof SUBSCRIPTION_TIERS)[number], string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};
