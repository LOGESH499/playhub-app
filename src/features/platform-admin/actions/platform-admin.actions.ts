"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canAccessPlatformAdmin } from "@/lib/auth/roles";
import {
  createSupportTicketSchema,
  setPlatformAdminSchema,
  updateSubscriptionSchema,
  updateSupportTicketSchema,
  updateTenantStatusSchema,
  upsertFeatureFlagSchema,
  upsertPlatformSettingSchema,
  type CreateSupportTicketInput,
  type SetPlatformAdminInput,
  type UpdateSubscriptionInput,
  type UpdateSupportTicketInput,
  type UpdateTenantStatusInput,
  type UpsertFeatureFlagInput,
  type UpsertPlatformSettingInput,
} from "@/lib/validators/platform.schema";

export type PlatformAdminActionResult = {
  error?: string;
  success?: string;
};

async function requirePlatformAdmin() {
  const context = await getAuthContext();
  if (!context || !canAccessPlatformAdmin(context.appRole)) {
    throw new Error("Platform admin access required");
  }
  return context;
}

function revalidatePlatform() {
  const paths = [
    "/platform",
    "/platform/tenants",
    "/platform/users",
    "/platform/subscriptions",
    "/platform/audit",
    "/platform/settings",
    "/platform/feature-flags",
    "/platform/support",
    "/platform/monitoring",
  ];
  for (const path of paths) revalidatePath(path);
}

export async function updateTenantStatusAction(
  input: UpdateTenantStatusInput
): Promise<PlatformAdminActionResult> {
  const parsed = updateTenantStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requirePlatformAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_tenant_status", {
    p_tenant_id: parsed.data.tenantId,
    p_status: parsed.data.status,
  });

  if (error) return { error: error.message };
  revalidatePlatform();
  return { success: "Tenant status updated" };
}

export async function updateSubscriptionAction(
  input: UpdateSubscriptionInput
): Promise<PlatformAdminActionResult> {
  const parsed = updateSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requirePlatformAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_tenant_subscription", {
    p_tenant_id: parsed.data.tenantId,
    p_tier: parsed.data.tier ?? undefined,
    p_status: parsed.data.status ?? undefined,
    p_seats_limit: parsed.data.seatsLimit ?? undefined,
    p_venues_limit: parsed.data.venuesLimit ?? undefined,
  });

  if (error) return { error: error.message };
  revalidatePlatform();
  return { success: "Subscription updated" };
}

export async function setPlatformAdminAction(
  input: SetPlatformAdminInput
): Promise<PlatformAdminActionResult> {
  const parsed = setPlatformAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requirePlatformAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_platform_admin", {
    p_user_id: parsed.data.userId,
    p_is_admin: parsed.data.isAdmin,
  });

  if (error) return { error: error.message };
  revalidatePlatform();
  return { success: parsed.data.isAdmin ? "Platform admin granted" : "Platform admin revoked" };
}

export async function upsertFeatureFlagAction(
  input: UpsertFeatureFlagInput
): Promise<PlatformAdminActionResult> {
  const parsed = upsertFeatureFlagSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requirePlatformAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_upsert_feature_flag", {
    p_key: parsed.data.key,
    p_enabled: parsed.data.enabled,
    p_description: parsed.data.description || null,
    p_rollout_percent: parsed.data.rolloutPercent,
  });

  if (error) return { error: error.message };
  revalidatePlatform();
  return { success: "Feature flag saved" };
}

export async function upsertPlatformSettingAction(
  input: UpsertPlatformSettingInput
): Promise<PlatformAdminActionResult> {
  const parsed = upsertPlatformSettingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requirePlatformAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_upsert_platform_setting", {
    p_key: parsed.data.key,
    p_value: parsed.data.value,
    p_description: parsed.data.description || null,
  });

  if (error) return { error: error.message };
  revalidatePlatform();
  return { success: "Setting saved" };
}

export async function updateSupportTicketAction(
  input: UpdateSupportTicketInput
): Promise<PlatformAdminActionResult> {
  const parsed = updateSupportTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requirePlatformAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_support_ticket", {
    p_ticket_id: parsed.data.ticketId,
    p_status: parsed.data.status,
    p_priority: parsed.data.priority ?? undefined,
    p_resolution_notes: parsed.data.resolutionNotes || null,
  });

  if (error) return { error: error.message };
  revalidatePlatform();
  return { success: "Ticket updated" };
}

export async function createSupportTicketAction(
  input: CreateSupportTicketInput
): Promise<PlatformAdminActionResult> {
  const parsed = createSupportTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const context = await getAuthContext();
    if (!context) throw new Error("Unauthorized");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_support_ticket", {
    p_subject: parsed.data.subject,
    p_body: parsed.data.body || null,
    p_priority: parsed.data.priority,
  });

  if (error) return { error: error.message };
  revalidatePlatform();
  return { success: "Support ticket created" };
}

export async function recordHealthSnapshotAction(): Promise<PlatformAdminActionResult> {
  try {
    await requirePlatformAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_platform_health_snapshot");

  if (error) return { error: error.message };
  revalidatePath("/platform/monitoring");
  return { success: "Health snapshot recorded" };
}
