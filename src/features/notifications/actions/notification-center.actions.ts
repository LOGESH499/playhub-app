"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import { deliverEmail } from "@/lib/email/deliver";
import {
  notificationPreferencesSchema,
  sendBroadcastSchema,
  type NotificationPreferences,
  type SendBroadcastInput,
} from "@/lib/validators/notification.schema";

export type NotificationCenterActionResult = {
  error?: string;
  success?: string;
  count?: number;
};

async function requireAuth() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  return context;
}

async function requireNotificationManager() {
  const context = await requireAuth();
  if (!canManageOrganization(context.appRole)) {
    throw new Error("You do not have permission to manage notifications");
  }
  if (!context.activeTenant?.tenantId) {
    throw new Error("Select an organization first");
  }
  return context;
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationCenterActionResult> {
  try {
    const context = await requireAuth();
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", context.userId);

    if (error) return { error: error.message };
    revalidateNotificationPaths();
    return { success: "Marked as read" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function markAllNotificationsReadAction(): Promise<NotificationCenterActionResult> {
  try {
    const context = await requireAuth();
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);

    if (error) return { error: error.message };
    revalidateNotificationPaths();
    return { success: "All notifications marked as read" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function updateNotificationPreferencesAction(
  preferences: NotificationPreferences
): Promise<NotificationCenterActionResult> {
  const parsed = notificationPreferencesSchema.safeParse(preferences);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid preferences" };
  }

  try {
    const context = await requireAuth();
    const supabase = await createClient();
    const current =
      context.profile.preferences && typeof context.profile.preferences === "object"
        ? (context.profile.preferences as Record<string, unknown>)
        : {};

    const { error } = await supabase
      .from("profiles")
      .update({
        preferences: {
          ...current,
          portal: parsed.data,
        },
      })
      .eq("id", context.userId);

    if (error) return { error: error.message };
    revalidatePath("/notifications/preferences");
    revalidatePath("/portal/settings");
    return { success: "Preferences saved" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function sendBroadcastAction(
  input: SendBroadcastInput
): Promise<NotificationCenterActionResult> {
  const parsed = sendBroadcastSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const context = await requireNotificationManager();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("send_tenant_broadcast", {
      p_tenant_id: context.activeTenant!.tenantId,
      p_kind: parsed.data.kind,
      p_title: parsed.data.title,
      p_body: parsed.data.body || null,
      p_target_audience: parsed.data.targetAudience,
    });

    if (error) return { error: error.message };
    revalidateNotificationPaths();
    return {
      success: `Broadcast sent to ${data?.recipients_count ?? 0} recipients`,
      count: data?.recipients_count ?? 0,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function runReminderJobsAction(): Promise<NotificationCenterActionResult> {
  try {
    await requireNotificationManager();
    const supabase = await createClient();
    const [{ data: bookingCount }, { data: academyCount }] = await Promise.all([
      supabase.rpc("queue_booking_reminders", { p_hours_before: 24 }),
      supabase.rpc("queue_academy_reminders", { p_hours_before: 24 }),
    ]);

    revalidateNotificationPaths();
    return {
      success: `Queued ${bookingCount ?? 0} booking and ${academyCount ?? 0} academy reminders`,
      count: Number(bookingCount ?? 0) + Number(academyCount ?? 0),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function processEmailQueueAction(): Promise<NotificationCenterActionResult> {
  try {
    const context = await requireNotificationManager();
    const supabase = await createClient();
    const { data: pending } = await supabase
      .from("notification_emails")
      .select("id, recipient_email, subject, body")
      .eq("tenant_id", context.activeTenant!.tenantId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(25);

    if (!pending?.length) {
      return { success: "No pending emails" };
    }

    let sent = 0;
    let skipped = 0;

    for (const email of pending) {
      const result = await deliverEmail({
        id: email.id,
        to: email.recipient_email,
        subject: email.subject,
        body: email.body,
      });

      const status = result.ok ? "sent" : "skipped";
      await supabase.rpc("mark_notification_email_status", {
        p_email_id: email.id,
        p_status: status,
        p_error_message: result.error ?? null,
      });

      if (result.ok) sent++;
      else skipped++;
    }

    revalidatePath("/notifications/broadcasts");
    return {
      success: `Processed ${pending.length} emails (${sent} sent, ${skipped} skipped)`,
      count: sent,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

function revalidateNotificationPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/notifications/broadcasts");
  revalidatePath("/portal");
  revalidatePath("/portal/notifications");
}
