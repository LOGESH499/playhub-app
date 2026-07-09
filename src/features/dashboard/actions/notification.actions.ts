"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";

export type NotificationActionResult = {
  error?: string;
  success?: string;
};

export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const context = await getAuthContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", context.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/portal");
  revalidatePath("/portal/notifications");
  return { success: "Marked as read" };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const context = await getAuthContext();
  if (!context) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", context.userId)
    .is("read_at", null);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/portal");
  revalidatePath("/portal/notifications");
  return { success: "All notifications marked as read" };
}
