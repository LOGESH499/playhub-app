"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import {
  createCourtSchema,
  updateCourtSchema,
  type CreateCourtInput,
  type CourtPricingRuleInput,
  type UpdateCourtInput,
} from "@/lib/validators/court.schema";
import type { OperatingHourInput } from "@/lib/validators/venue.schema";
import type { Json, TablesInsert } from "@/types/database.types";
import { getCourtById } from "@/features/courts/lib/queries";
import {
  buildCourtMediaPath,
  COURT_MEDIA_BUCKET,
  getCourtMediaPublicUrl,
} from "@/features/courts/lib/storage";

export type CourtActionResult = {
  error?: string;
  success?: string;
  url?: string;
  path?: string;
};

async function requireCourtManager() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  if (!canManageOrganization(context.appRole)) {
    throw new Error("You do not have permission to manage courts");
  }
  if (!context.activeTenant?.tenantId) {
    throw new Error("Select an organization to manage courts");
  }
  return context;
}

async function logAudit(
  tenantId: string,
  action: string,
  entityId: string,
  oldValues?: Json,
  newValues?: Json
) {
  const supabase = await createClient();
  await supabase.rpc("log_resource_audit", {
    p_tenant_id: tenantId,
    p_action: action,
    p_entity_id: entityId,
    p_old_values: oldValues ?? null,
    p_new_values: newValues ?? null,
  });
}

function normalizeTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

function toCourtImagesJson(images: CreateCourtInput["images"]): Json {
  return images.map((img) => ({
    url: img.url,
    path: img.path,
    caption: img.caption ?? "",
    sortOrder: img.sortOrder,
    isCover: img.isCover,
  })) as Json;
}

function toEquipmentJson(equipment: CreateCourtInput["equipment"]): Json {
  return equipment as Json;
}

async function syncOperatingHours(
  tenantId: string,
  venueId: string,
  resourceId: string,
  hours: OperatingHourInput[]
) {
  const supabase = await createClient();

  await supabase.from("operating_hours").delete().eq("resource_id", resourceId);

  const rows: TablesInsert<"operating_hours">[] = hours.map((hour) => ({
    tenant_id: tenantId,
    venue_id: venueId,
    resource_id: resourceId,
    day_of_week: hour.dayOfWeek,
    open_time: normalizeTime(hour.openTime),
    close_time: normalizeTime(hour.closeTime),
    is_closed: hour.isClosed,
  }));

  if (rows.length > 0) {
    await supabase.from("operating_hours").insert(rows);
  }
}

async function syncBlackouts(
  tenantId: string,
  venueId: string,
  resourceId: string,
  userId: string,
  blackouts: CreateCourtInput["blackouts"]
) {
  const supabase = await createClient();

  await supabase.from("blackout_periods").delete().eq("resource_id", resourceId);

  if (blackouts.length === 0) return;

  const rows: TablesInsert<"blackout_periods">[] = blackouts.map((blackout) => ({
    tenant_id: tenantId,
    venue_id: venueId,
    resource_id: resourceId,
    start_time: blackout.startTime,
    end_time: blackout.endTime,
    reason: blackout.reason || null,
    created_by: userId,
  }));

  await supabase.from("blackout_periods").insert(rows);
}

async function syncPricingRules(
  tenantId: string,
  venueId: string,
  resourceId: string,
  sportType: CreateCourtInput["sportType"],
  rules: CourtPricingRuleInput[]
) {
  const supabase = await createClient();

  await supabase.from("pricing_rules").delete().eq("resource_id", resourceId);

  if (rules.length === 0) return;

  const rows: TablesInsert<"pricing_rules">[] = rules.map((rule) => ({
    tenant_id: tenantId,
    venue_id: venueId,
    resource_id: resourceId,
    sport_type: sportType,
    name: rule.name,
    day_of_week: rule.dayOfWeek,
    start_time: rule.startTime ? normalizeTime(rule.startTime) : null,
    end_time: rule.endTime ? normalizeTime(rule.endTime) : null,
    price_per_slot: rule.pricePerSlot,
    slot_duration_minutes: rule.slotDurationMinutes,
    priority: rule.priority,
    is_active: rule.isActive,
  }));

  await supabase.from("pricing_rules").insert(rows);
}

export async function createCourtAction(
  input: CreateCourtInput
): Promise<CourtActionResult> {
  const parsed = createCourtSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireCourtManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const tenantId = context.activeTenant!.tenantId;
  const supabase = await createClient();

  const insert: TablesInsert<"resources"> = {
    tenant_id: tenantId,
    venue_id: parsed.data.venueId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    sport_type: parsed.data.sportType,
    resource_subtype: parsed.data.resourceSubtype || null,
    capacity: parsed.data.capacity,
    surface_type: parsed.data.surfaceType || null,
    length_m:
      parsed.data.lengthM === "" || parsed.data.lengthM === undefined
        ? null
        : parsed.data.lengthM,
    width_m:
      parsed.data.widthM === "" || parsed.data.widthM === undefined
        ? null
        : parsed.data.widthM,
    is_indoor: parsed.data.isIndoor,
    sort_order: parsed.data.sortOrder,
    status: parsed.data.status,
    maintenance_until:
      parsed.data.maintenanceUntil === "" || !parsed.data.maintenanceUntil
        ? null
        : parsed.data.maintenanceUntil,
    images: toCourtImagesJson(parsed.data.images),
    equipment: toEquipmentJson(parsed.data.equipment),
    booking_rules: parsed.data.bookingRules as Json,
    metadata: {},
  };

  const { data, error } = await supabase
    .from("resources")
    .insert(insert)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await Promise.all([
    syncOperatingHours(
      tenantId,
      parsed.data.venueId,
      data.id,
      parsed.data.operatingHours
    ),
    syncBlackouts(
      tenantId,
      parsed.data.venueId,
      data.id,
      context.userId,
      parsed.data.blackouts
    ),
    syncPricingRules(
      tenantId,
      parsed.data.venueId,
      data.id,
      parsed.data.sportType,
      parsed.data.pricingRules
    ),
  ]);

  await logAudit(tenantId, "resource.created", data.id, null, insert as Json);

  revalidatePath("/courts");
  redirect(`/courts/${data.id}/edit?created=1`);
}

export async function updateCourtAction(
  input: UpdateCourtInput
): Promise<CourtActionResult> {
  const parsed = updateCourtSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireCourtManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getCourtById(parsed.data.id);
  if (!existing) return { error: "Court not found" };

  const tenantId = context.activeTenant!.tenantId;
  if (existing.tenant_id !== tenantId) {
    return { error: "Court not found" };
  }

  const venueId = parsed.data.venueId ?? existing.venue_id;
  const sportType = parsed.data.sportType ?? existing.sport_type;

  const supabase = await createClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.venueId !== undefined) update.venue_id = parsed.data.venueId;
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.description !== undefined)
    update.description = parsed.data.description || null;
  if (parsed.data.sportType !== undefined) update.sport_type = parsed.data.sportType;
  if (parsed.data.resourceSubtype !== undefined)
    update.resource_subtype = parsed.data.resourceSubtype || null;
  if (parsed.data.capacity !== undefined) update.capacity = parsed.data.capacity;
  if (parsed.data.surfaceType !== undefined)
    update.surface_type = parsed.data.surfaceType || null;
  if (parsed.data.lengthM !== undefined) {
    update.length_m = parsed.data.lengthM === "" ? null : parsed.data.lengthM;
  }
  if (parsed.data.widthM !== undefined) {
    update.width_m = parsed.data.widthM === "" ? null : parsed.data.widthM;
  }
  if (parsed.data.isIndoor !== undefined) update.is_indoor = parsed.data.isIndoor;
  if (parsed.data.sortOrder !== undefined) update.sort_order = parsed.data.sortOrder;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.maintenanceUntil !== undefined) {
    update.maintenance_until =
      parsed.data.maintenanceUntil === "" ? null : parsed.data.maintenanceUntil;
  }
  if (parsed.data.images !== undefined)
    update.images = toCourtImagesJson(parsed.data.images);
  if (parsed.data.equipment !== undefined)
    update.equipment = toEquipmentJson(parsed.data.equipment);
  if (parsed.data.bookingRules !== undefined)
    update.booking_rules = parsed.data.bookingRules as Json;

  const { error } = await supabase
    .from("resources")
    .update(update)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  if (parsed.data.operatingHours) {
    await syncOperatingHours(
      tenantId,
      venueId,
      parsed.data.id,
      parsed.data.operatingHours
    );
  }
  if (parsed.data.blackouts) {
    await syncBlackouts(
      tenantId,
      venueId,
      parsed.data.id,
      context.userId,
      parsed.data.blackouts
    );
  }
  if (parsed.data.pricingRules) {
    await syncPricingRules(
      tenantId,
      venueId,
      parsed.data.id,
      sportType,
      parsed.data.pricingRules
    );
  }

  await logAudit(
    tenantId,
    "resource.updated",
    parsed.data.id,
    existing as unknown as Json,
    update as Json
  );

  revalidatePath("/courts");
  revalidatePath(`/courts/${parsed.data.id}/edit`);
  return { success: "Court updated successfully" };
}

export async function updateCourtStatusAction(
  id: string,
  status: CreateCourtInput["status"]
): Promise<CourtActionResult> {
  try {
    await requireCourtManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getCourtById(id);
  if (!existing) return { error: "Court not found" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("resources")
    .update({
      status,
      updated_at: new Date().toISOString(),
      maintenance_until:
        status === "maintenance" ? existing.maintenance_until : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(existing.tenant_id, "resource.status_changed", id, {
    status: existing.status,
  }, { status });

  revalidatePath("/courts");
  return { success: `Court marked as ${status}` };
}

export async function archiveCourtAction(id: string): Promise<CourtActionResult> {
  return updateCourtStatusAction(id, "archived");
}

export async function deleteCourtAction(id: string): Promise<CourtActionResult> {
  try {
    await requireCourtManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getCourtById(id);
  if (!existing) return { error: "Court not found" };

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("resources")
    .update({
      deleted_at: deletedAt,
      status: "archived",
      updated_at: deletedAt,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(
    existing.tenant_id,
    "resource.deleted",
    id,
    existing as unknown as Json,
    { deleted_at: deletedAt }
  );

  revalidatePath("/courts");
  return { success: "Court deleted" };
}

export async function uploadCourtMediaAction(
  courtId: string,
  formData: FormData
): Promise<CourtActionResult> {
  let context;
  try {
    context = await requireCourtManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getCourtById(courtId);
  if (!existing) return { error: "Court not found" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Select an image to upload" };
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { error: "Only JPEG, PNG, and WebP images are allowed" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Image must be 5MB or smaller" };
  }

  const tenantId = context.activeTenant!.tenantId;
  const path = buildCourtMediaPath(tenantId, courtId, file.name);
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(COURT_MEDIA_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return { error: "Storage URL not configured" };

  const url = getCourtMediaPublicUrl(supabaseUrl, path);

  await logAudit(tenantId, "resource.media_uploaded", courtId, null, {
    path,
    url,
  } as Json);

  revalidatePath(`/courts/${courtId}/edit`);
  return { success: "Image uploaded", url, path };
}

export async function removeCourtMediaAction(
  courtId: string,
  path: string
): Promise<CourtActionResult> {
  let context;
  try {
    context = await requireCourtManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getCourtById(courtId);
  if (!existing) return { error: "Court not found" };

  const supabase = await createClient();
  await supabase.storage.from(COURT_MEDIA_BUCKET).remove([path]);

  await logAudit(
    context.activeTenant!.tenantId,
    "resource.media_removed",
    courtId,
    { path } as Json,
    null
  );

  revalidatePath(`/courts/${courtId}/edit`);
  return { success: "Image removed" };
}
