import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import type { NotificationListFilters } from "@/lib/validators/notification.schema";
import {
  parseProfileNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/validators/notification.schema";
import type {
  NotificationBroadcast,
  NotificationEmailRecord,
  NotificationRecord,
  NotificationsListResult,
} from "./types";

function emptyResult(filters: NotificationListFilters): NotificationsListResult {
  return {
    notifications: [],
    total: 0,
    unreadCount: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: 0,
  };
}

export function canManageNotifications(appRole: string): boolean {
  return canManageOrganization(appRole as never);
}

export async function listNotifications(
  filters: NotificationListFilters
): Promise<NotificationsListResult> {
  const supabase = await createClient();
  const context = await getAuthContext();
  if (!context) return emptyResult(filters);

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("notifications")
    .select("id, title, body, type, tenant_id, read_at, created_at, data", {
      count: "exact",
    })
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false });

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.unreadOnly === "true") query = query.is("read_at", null);

  const { data, count, error } = await query.range(from, to);
  if (error) return emptyResult(filters);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", context.userId)
    .is("read_at", null);

  const total = count ?? 0;
  return {
    notifications: (data ?? []).map(mapNotification),
    total,
    unreadCount: unreadCount ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 0,
  };
}

function mapNotification(row: {
  id: string;
  title: string;
  body: string | null;
  type: string;
  tenant_id: string | null;
  read_at: string | null;
  created_at: string;
  data: unknown;
}): NotificationRecord {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    tenantId: row.tenant_id,
    readAt: row.read_at,
    createdAt: row.created_at,
    data:
      row.data && typeof row.data === "object"
        ? (row.data as Record<string, unknown>)
        : undefined,
  };
}

export async function getUnreadCount(): Promise<number> {
  const context = await getAuthContext();
  if (!context) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", context.userId)
    .is("read_at", null);

  return count ?? 0;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const context = await getAuthContext();
  if (!context) return null;
  return parseProfileNotificationPreferences(context.profile.preferences);
}

export async function listBroadcasts(): Promise<NotificationBroadcast[]> {
  const context = await getAuthContext();
  if (!context?.activeTenant || !canManageOrganization(context.appRole)) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_broadcasts")
    .select(
      "id, kind, title, body, target_audience, recipients_count, created_at, created_by"
    )
    .eq("tenant_id", context.activeTenant.tenantId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    targetAudience: row.target_audience,
    recipientsCount: row.recipients_count,
    createdAt: row.created_at,
  }));
}

export async function listEmailQueue(): Promise<NotificationEmailRecord[]> {
  const context = await getAuthContext();
  if (!context?.activeTenant || !canManageOrganization(context.appRole)) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_emails")
    .select("id, notification_id, recipient_email, subject, status, sent_at, created_at")
    .eq("tenant_id", context.activeTenant.tenantId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    data?.map((row) => ({
      id: row.id,
      notificationId: row.notification_id,
      recipientEmail: row.recipient_email,
      subject: row.subject,
      status: row.status,
      sentAt: row.sent_at,
      createdAt: row.created_at,
    })) ?? []
  );
}
