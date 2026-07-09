import { z } from "zod";

export const portalPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  bookingReminders: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

export const upsertReviewSchema = z.object({
  venueId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal("")),
  bookingId: z.string().uuid().optional(),
});

export const toggleFavoriteSchema = z.object({
  entityType: z.enum(["venue", "sport"]),
  entityId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
});

export const portalBookingTabSchema = z.enum(["upcoming", "history"]);

export type PortalPreferences = z.infer<typeof portalPreferencesSchema>;
export type UpsertReviewInput = z.infer<typeof upsertReviewSchema>;
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;

export function parsePortalPreferences(value: unknown): PortalPreferences {
  const defaults = {
    emailNotifications: true,
    bookingReminders: true,
    marketingEmails: false,
  };
  if (!value || typeof value !== "object") return defaults;
  const obj = value as Record<string, unknown>;
  return {
    emailNotifications: obj.emailNotifications !== false,
    bookingReminders: obj.bookingReminders !== false,
    marketingEmails: Boolean(obj.marketingEmails),
  };
}

export function parseProfilePortalPreferences(
  profilePreferences: unknown
): PortalPreferences {
  if (!profilePreferences || typeof profilePreferences !== "object") {
    return parsePortalPreferences(null);
  }
  const root = profilePreferences as Record<string, unknown>;
  return parsePortalPreferences(root.portal ?? root);
}
