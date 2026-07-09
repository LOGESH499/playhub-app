"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canAccessPlatformAdmin, canManageOrganization } from "@/lib/auth/roles";
import {
  createSportSchema,
  updateSportSchema,
  type CreateSportInput,
  type UpdateSportInput,
} from "@/lib/validators/sports.schema";
import type { Json, TablesInsert, TablesUpdate } from "@/types/database.types";
import { getSportById } from "@/features/sports/lib/queries";

export type SportActionResult = {
  error?: string;
  success?: string;
};

async function requireSportManager() {
  const context = await getAuthContext();
  if (!context) {
    throw new Error("Unauthorized");
  }

  const canManage =
    canManageOrganization(context.appRole) ||
    canAccessPlatformAdmin(context.appRole);

  if (!canManage) {
    throw new Error("You do not have permission to manage sports");
  }

  return context;
}

async function logAudit(
  tenantId: string | null,
  action: string,
  entityId: string,
  oldValues?: Json,
  newValues?: Json
) {
  const supabase = await createClient();
  await supabase.rpc("log_sport_audit", {
    p_tenant_id: tenantId,
    p_action: action,
    p_entity_id: entityId,
    p_old_values: oldValues ?? null,
    p_new_values: newValues ?? null,
  });
}

async function syncVenueSports(
  sportId: string,
  tenantId: string,
  venueIds: string[],
  defaultPrice: number | null
) {
  const supabase = await createClient();

  await supabase
    .from("venue_sports")
    .delete()
    .eq("sport_id", sportId)
    .eq("tenant_id", tenantId);

  if (venueIds.length === 0) return;

  const rows: TablesInsert<"venue_sports">[] = venueIds.map((venueId) => ({
    tenant_id: tenantId,
    venue_id: venueId,
    sport_id: sportId,
    default_price: defaultPrice,
    is_active: true,
  }));

  await supabase.from("venue_sports").insert(rows);

  if (defaultPrice != null) {
    const sport = await getSportById(sportId);
    if (!sport?.sport_type) return;

    for (const venueId of venueIds) {
      const { data: existing } = await supabase
        .from("pricing_rules")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("venue_id", venueId)
        .eq("sport_type", sport.sport_type)
        .limit(1);

      if (!existing?.length) {
        await supabase.from("pricing_rules").insert({
          tenant_id: tenantId,
          venue_id: venueId,
          sport_type: sport.sport_type,
          name: `${sport.name} default`,
          price_per_slot: defaultPrice,
          slot_duration_minutes: sport.default_slot_minutes,
          priority: 0,
          is_active: true,
        });
      }
    }
  }
}

export async function createSportAction(
  input: CreateSportInput
): Promise<SportActionResult> {
  const parsed = createSportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireSportManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const tenantId = context.activeTenant?.tenantId ?? null;
  const isPlatform = canAccessPlatformAdmin(context.appRole) && !tenantId;

  if (!tenantId && !canAccessPlatformAdmin(context.appRole)) {
    return { error: "Select an organization or use platform admin access" };
  }

  const insert: TablesInsert<"sports"> = {
    tenant_id: isPlatform ? null : tenantId,
    category_id: parsed.data.categoryId || null,
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description || null,
    icon_name: parsed.data.iconName || null,
    image_url: parsed.data.imageUrl || null,
    resource_label: parsed.data.resourceLabel,
    default_slot_minutes: parsed.data.defaultSlotMinutes,
    default_price: parsed.data.defaultPrice === "" || parsed.data.defaultPrice === undefined
      ? null
      : parsed.data.defaultPrice,
    status: parsed.data.status,
    is_featured: parsed.data.isFeatured,
    display_order: parsed.data.displayOrder,
    sport_type: parsed.data.sportType || null,
    booking_rules: parsed.data.bookingRules as Json,
    created_by: context.userId,
  };

  const { data, error } = await supabase
    .from("sports")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A sport with this name or slug already exists" };
    }
    return { error: error.message };
  }

  if (tenantId && parsed.data.venueIds?.length) {
    await syncVenueSports(
      data.id,
      tenantId,
      parsed.data.venueIds,
      insert.default_price ?? null
    );
  }

  await logAudit(tenantId, "sport.created", data.id, null, insert as Json);

  revalidatePath("/sports");
  redirect(`/sports/${data.id}/edit?created=1`);
}

export async function updateSportAction(
  input: UpdateSportInput
): Promise<SportActionResult> {
  const parsed = updateSportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireSportManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getSportById(parsed.data.id);
  if (!existing) {
    return { error: "Sport not found" };
  }

  const supabase = await createClient();
  const tenantId = context.activeTenant?.tenantId ?? existing.tenant_id;

  const update: TablesUpdate<"sports"> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.slug !== undefined) update.slug = parsed.data.slug;
  if (parsed.data.description !== undefined)
    update.description = parsed.data.description || null;
  if (parsed.data.categoryId !== undefined)
    update.category_id = parsed.data.categoryId || null;
  if (parsed.data.iconName !== undefined)
    update.icon_name = parsed.data.iconName || null;
  if (parsed.data.imageUrl !== undefined)
    update.image_url = parsed.data.imageUrl || null;
  if (parsed.data.resourceLabel !== undefined)
    update.resource_label = parsed.data.resourceLabel;
  if (parsed.data.defaultSlotMinutes !== undefined)
    update.default_slot_minutes = parsed.data.defaultSlotMinutes;
  if (parsed.data.defaultPrice !== undefined) {
    update.default_price =
      parsed.data.defaultPrice === "" ? null : parsed.data.defaultPrice;
  }
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.isFeatured !== undefined)
    update.is_featured = parsed.data.isFeatured;
  if (parsed.data.displayOrder !== undefined)
    update.display_order = parsed.data.displayOrder;
  if (parsed.data.sportType !== undefined)
    update.sport_type = parsed.data.sportType || null;
  if (parsed.data.bookingRules !== undefined)
    update.booking_rules = parsed.data.bookingRules as Json;

  const { error } = await supabase
    .from("sports")
    .update(update)
    .eq("id", parsed.data.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "A sport with this name or slug already exists" };
    }
    return { error: error.message };
  }

  if (tenantId && parsed.data.venueIds) {
    await syncVenueSports(
      parsed.data.id,
      tenantId,
      parsed.data.venueIds,
      update.default_price ?? existing.default_price
    );
  }

  await logAudit(
    tenantId,
    "sport.updated",
    parsed.data.id,
    existing as unknown as Json,
    update as Json
  );

  revalidatePath("/sports");
  revalidatePath(`/sports/${parsed.data.id}/edit`);
  return { success: "Sport updated successfully" };
}

export async function archiveSportAction(id: string): Promise<SportActionResult> {
  try {
    await requireSportManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getSportById(id);
  if (!existing) return { error: "Sport not found" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sports")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(
    existing.tenant_id,
    "sport.archived",
    id,
    existing as unknown as Json,
    { status: "archived" }
  );

  revalidatePath("/sports");
  return { success: "Sport archived" };
}

export async function deleteSportAction(id: string): Promise<SportActionResult> {
  try {
    await requireSportManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getSportById(id);
  if (!existing) return { error: "Sport not found" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sports")
    .update({
      deleted_at: new Date().toISOString(),
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(
    existing.tenant_id,
    "sport.deleted",
    id,
    existing as unknown as Json,
    { deleted_at: new Date().toISOString() }
  );

  revalidatePath("/sports");
  return { success: "Sport deleted" };
}

export async function toggleSportStatusAction(
  id: string,
  status: "active" | "disabled"
): Promise<SportActionResult> {
  try {
    await requireSportManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sports")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/sports");
  return { success: `Sport ${status === "active" ? "enabled" : "disabled"}` };
}
