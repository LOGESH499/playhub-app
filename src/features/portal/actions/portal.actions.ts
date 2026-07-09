"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import {
  portalPreferencesSchema,
  toggleFavoriteSchema,
  upsertReviewSchema,
  type PortalPreferences,
  type ToggleFavoriteInput,
  type UpsertReviewInput,
} from "@/lib/validators/portal.schema";
import type { Json, TablesUpdate } from "@/types/database.types";

export type PortalActionResult = {
  error?: string;
  success?: string;
  favorited?: boolean;
};

async function requireAuth() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  return context;
}

export async function toggleFavoriteAction(
  input: ToggleFavoriteInput
): Promise<PortalActionResult> {
  const parsed = toggleFavoriteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_user_favorite", {
    p_entity_type: parsed.data.entityType,
    p_entity_id: parsed.data.entityId,
    p_tenant_id: parsed.data.tenantId ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/portal/favorites");
  return {
    success: data ? "Added to favorites" : "Removed from favorites",
    favorited: Boolean(data),
  };
}

export async function upsertReviewAction(
  input: UpsertReviewInput
): Promise<PortalActionResult> {
  const parsed = upsertReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_venue_review", {
    p_venue_id: parsed.data.venueId,
    p_rating: parsed.data.rating,
    p_comment: parsed.data.comment || null,
    p_booking_id: parsed.data.bookingId ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/portal/reviews");
  return { success: "Review saved" };
}

export async function updatePortalSettingsAction(
  preferences: PortalPreferences
): Promise<PortalActionResult> {
  const parsed = portalPreferencesSchema.safeParse(preferences);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireAuth();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing =
    context.profile.preferences && typeof context.profile.preferences === "object"
      ? (context.profile.preferences as Record<string, unknown>)
      : {};

  const update: TablesUpdate<"profiles"> = {
    preferences: { ...existing, portal: parsed.data } as Json,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", context.userId);

  if (error) return { error: error.message };

  revalidatePath("/portal/settings");
  revalidatePath("/portal");
  return { success: "Settings saved" };
}
