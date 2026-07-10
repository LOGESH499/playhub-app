import { z } from "zod";

export const NOTIFICATION_KINDS = [
  "booking_confirmation",
  "booking_reminder",
  "booking_cancelled",
  "academy_reminder",
  "announcement",
  "maintenance",
  "broadcast",
  "payment",
  "system",
] as const;

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  bookingReminders: z.boolean().default(true),
  academyReminders: z.boolean().default(true),
  announcements: z.boolean().default(true),
  maintenanceAlerts: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

export const notificationListFiltersSchema = z.object({
  type: z.enum(NOTIFICATION_KINDS).optional(),
  unreadOnly: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

export const sendBroadcastSchema = z.object({
  kind: z.enum(["announcement", "maintenance", "broadcast"]),
  title: z.string().min(2).max(120),
  body: z.string().max(2000).optional().or(z.literal("")),
  targetAudience: z.enum(["all", "members", "staff"]).default("all"),
});

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type NotificationListFilters = z.infer<typeof notificationListFiltersSchema>;
export type SendBroadcastInput = z.infer<typeof sendBroadcastSchema>;

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  booking_confirmation: "Booking confirmed",
  booking_reminder: "Booking reminder",
  booking_cancelled: "Booking cancelled",
  academy_reminder: "Academy reminder",
  announcement: "Announcement",
  maintenance: "Maintenance",
  broadcast: "Broadcast",
  payment: "Payment",
  system: "System",
};

export function parseNotificationPreferences(value: unknown): NotificationPreferences {
  const defaults = notificationPreferencesSchema.parse({});
  if (!value || typeof value !== "object") return defaults;
  const obj = value as Record<string, unknown>;
  return notificationPreferencesSchema.parse({
    emailNotifications: obj.emailNotifications !== false,
    bookingReminders: obj.bookingReminders !== false,
    academyReminders: obj.academyReminders !== false,
    announcements: obj.announcements !== false,
    maintenanceAlerts: obj.maintenanceAlerts !== false,
    marketingEmails: Boolean(obj.marketingEmails),
  });
}

export function parseProfileNotificationPreferences(
  profilePreferences: unknown
): NotificationPreferences {
  if (!profilePreferences || typeof profilePreferences !== "object") {
    return parseNotificationPreferences(null);
  }
  const root = profilePreferences as Record<string, unknown>;
  return parseNotificationPreferences(root.portal ?? root);
}
