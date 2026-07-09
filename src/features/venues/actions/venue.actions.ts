"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import {
  createVenueSchema,
  updateVenueSchema,
  type CreateVenueInput,
  type OperatingHourInput,
  type PricingRuleInput,
  type UpdateVenueInput,
  type VenueHolidayInput,
} from "@/lib/validators/venue.schema";
import type { Json, TablesInsert } from "@/types/database.types";
import { getVenueById } from "@/features/venues/lib/queries";
import {
  buildVenueMediaPath,
  getVenueMediaPublicUrl,
  VENUE_MEDIA_BUCKET,
} from "@/features/venues/lib/storage";

export type VenueActionResult = {
  error?: string;
  success?: string;
  url?: string;
  path?: string;
};

async function requireVenueManager() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  if (!canManageOrganization(context.appRole)) {
    throw new Error("You do not have permission to manage venues");
  }
  if (!context.activeTenant?.tenantId) {
    throw new Error("Select an organization to manage venues");
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
  await supabase.rpc("log_venue_audit", {
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

function toVenueImagesJson(
  images: CreateVenueInput["images"]
): Json {
  return images.map((img) => ({
    url: img.url,
    path: img.path,
    caption: img.caption ?? "",
    sortOrder: img.sortOrder,
    isCover: img.isCover,
  })) as Json;
}

async function syncOperatingHours(
  tenantId: string,
  venueId: string,
  hours: OperatingHourInput[]
) {
  const supabase = await createClient();

  await supabase
    .from("operating_hours")
    .delete()
    .eq("venue_id", venueId)
    .is("resource_id", null);

  const rows: TablesInsert<"operating_hours">[] = hours.map((hour) => ({
    tenant_id: tenantId,
    venue_id: venueId,
    day_of_week: hour.dayOfWeek,
    open_time: normalizeTime(hour.openTime),
    close_time: normalizeTime(hour.closeTime),
    is_closed: hour.isClosed,
  }));

  if (rows.length > 0) {
    await supabase.from("operating_hours").insert(rows);
  }
}

async function syncHolidays(
  tenantId: string,
  venueId: string,
  holidays: VenueHolidayInput[]
) {
  const supabase = await createClient();

  await supabase.from("venue_holidays").delete().eq("venue_id", venueId);

  if (holidays.length === 0) return;

  const rows: TablesInsert<"venue_holidays">[] = holidays.map((holiday) => ({
    tenant_id: tenantId,
    venue_id: venueId,
    name: holiday.name,
    holiday_date: holiday.holidayDate,
    is_recurring_yearly: holiday.isRecurringYearly,
  }));

  await supabase.from("venue_holidays").insert(rows);
}

async function syncPricingRules(
  tenantId: string,
  venueId: string,
  rules: PricingRuleInput[]
) {
  const supabase = await createClient();

  await supabase
    .from("pricing_rules")
    .delete()
    .eq("venue_id", venueId)
    .is("resource_id", null);

  if (rules.length === 0) return;

  const rows: TablesInsert<"pricing_rules">[] = rules.map((rule) => ({
    tenant_id: tenantId,
    venue_id: venueId,
    name: rule.name,
    sport_type: rule.sportType || null,
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

async function syncBlackouts(
  tenantId: string,
  venueId: string,
  userId: string,
  blackouts: CreateVenueInput["blackouts"]
) {
  const supabase = await createClient();

  await supabase
    .from("blackout_periods")
    .delete()
    .eq("venue_id", venueId)
    .is("resource_id", null);

  if (blackouts.length === 0) return;

  const rows: TablesInsert<"blackout_periods">[] = blackouts.map((blackout) => ({
    tenant_id: tenantId,
    venue_id: venueId,
    start_time: blackout.startTime,
    end_time: blackout.endTime,
    reason: blackout.reason || null,
    created_by: userId,
  }));

  await supabase.from("blackout_periods").insert(rows);
}

export async function createVenueAction(
  input: CreateVenueInput
): Promise<VenueActionResult> {
  const parsed = createVenueSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireVenueManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const tenantId = context.activeTenant!.tenantId;
  const supabase = await createClient();

  const insert: TablesInsert<"venues"> = {
    tenant_id: tenantId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    address_line1: parsed.data.addressLine1,
    address_line2: parsed.data.addressLine2 || null,
    city: parsed.data.city,
    state: parsed.data.state || null,
    postal_code: parsed.data.postalCode || null,
    country: parsed.data.country,
    latitude:
      parsed.data.latitude === "" || parsed.data.latitude === undefined
        ? null
        : parsed.data.latitude,
    longitude:
      parsed.data.longitude === "" || parsed.data.longitude === undefined
        ? null
        : parsed.data.longitude,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    amenities: parsed.data.amenities as Json,
    images: toVenueImagesJson(parsed.data.images),
    status: parsed.data.status,
  };

  const { data, error } = await supabase
    .from("venues")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A venue with this slug already exists" };
    }
    return { error: error.message };
  }

  await Promise.all([
    syncOperatingHours(tenantId, data.id, parsed.data.operatingHours),
    syncHolidays(tenantId, data.id, parsed.data.holidays),
    syncBlackouts(tenantId, data.id, context.userId, parsed.data.blackouts),
    syncPricingRules(tenantId, data.id, parsed.data.pricingRules),
  ]);

  await logAudit(tenantId, "venue.created", data.id, null, insert as Json);

  revalidatePath("/venues");
  redirect(`/venues/${data.id}/edit?created=1`);
}

export async function updateVenueAction(
  input: UpdateVenueInput
): Promise<VenueActionResult> {
  const parsed = updateVenueSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireVenueManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getVenueById(parsed.data.id);
  if (!existing) return { error: "Venue not found" };

  const tenantId = context.activeTenant!.tenantId;
  if (existing.tenant_id !== tenantId) {
    return { error: "Venue not found" };
  }

  const supabase = await createClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.slug !== undefined) update.slug = parsed.data.slug;
  if (parsed.data.description !== undefined)
    update.description = parsed.data.description || null;
  if (parsed.data.addressLine1 !== undefined)
    update.address_line1 = parsed.data.addressLine1;
  if (parsed.data.addressLine2 !== undefined)
    update.address_line2 = parsed.data.addressLine2 || null;
  if (parsed.data.city !== undefined) update.city = parsed.data.city;
  if (parsed.data.state !== undefined) update.state = parsed.data.state || null;
  if (parsed.data.postalCode !== undefined)
    update.postal_code = parsed.data.postalCode || null;
  if (parsed.data.country !== undefined) update.country = parsed.data.country;
  if (parsed.data.latitude !== undefined) {
    update.latitude =
      parsed.data.latitude === "" ? null : parsed.data.latitude;
  }
  if (parsed.data.longitude !== undefined) {
    update.longitude =
      parsed.data.longitude === "" ? null : parsed.data.longitude;
  }
  if (parsed.data.phone !== undefined) update.phone = parsed.data.phone || null;
  if (parsed.data.email !== undefined) update.email = parsed.data.email || null;
  if (parsed.data.amenities !== undefined)
    update.amenities = parsed.data.amenities as Json;
  if (parsed.data.images !== undefined)
    update.images = toVenueImagesJson(parsed.data.images);
  if (parsed.data.status !== undefined) update.status = parsed.data.status;

  const { error } = await supabase
    .from("venues")
    .update(update)
    .eq("id", parsed.data.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "A venue with this slug already exists" };
    }
    return { error: error.message };
  }

  if (parsed.data.operatingHours) {
    await syncOperatingHours(tenantId, parsed.data.id, parsed.data.operatingHours);
  }
  if (parsed.data.holidays) {
    await syncHolidays(tenantId, parsed.data.id, parsed.data.holidays);
  }
  if (parsed.data.blackouts) {
    await syncBlackouts(
      tenantId,
      parsed.data.id,
      context.userId,
      parsed.data.blackouts
    );
  }
  if (parsed.data.pricingRules) {
    await syncPricingRules(tenantId, parsed.data.id, parsed.data.pricingRules);
  }

  await logAudit(
    tenantId,
    "venue.updated",
    parsed.data.id,
    existing as unknown as Json,
    update as Json
  );

  revalidatePath("/venues");
  revalidatePath(`/venues/${parsed.data.id}/edit`);
  return { success: "Venue updated successfully" };
}

export async function updateVenueStatusAction(
  id: string,
  status: CreateVenueInput["status"]
): Promise<VenueActionResult> {
  try {
    await requireVenueManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getVenueById(id);
  if (!existing) return { error: "Venue not found" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("venues")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(existing.tenant_id, "venue.status_changed", id, {
    status: existing.status,
  }, { status });

  revalidatePath("/venues");
  return { success: `Venue marked as ${status}` };
}

export async function archiveVenueAction(id: string): Promise<VenueActionResult> {
  return updateVenueStatusAction(id, "archived");
}

export async function deleteVenueAction(id: string): Promise<VenueActionResult> {
  try {
    await requireVenueManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getVenueById(id);
  if (!existing) return { error: "Venue not found" };

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("venues")
    .update({
      deleted_at: deletedAt,
      status: "archived",
      updated_at: deletedAt,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(
    existing.tenant_id,
    "venue.deleted",
    id,
    existing as unknown as Json,
    { deleted_at: deletedAt }
  );

  revalidatePath("/venues");
  return { success: "Venue deleted" };
}

export async function uploadVenueMediaAction(
  venueId: string,
  formData: FormData
): Promise<VenueActionResult> {
  let context;
  try {
    context = await requireVenueManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getVenueById(venueId);
  if (!existing) return { error: "Venue not found" };

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
  const path = buildVenueMediaPath(tenantId, venueId, file.name);
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(VENUE_MEDIA_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return { error: "Storage URL not configured" };

  const url = getVenueMediaPublicUrl(supabaseUrl, path);

  await logAudit(tenantId, "venue.media_uploaded", venueId, null, {
    path,
    url,
  } as Json);

  revalidatePath(`/venues/${venueId}/edit`);
  return { success: "Image uploaded", url, path };
}

export async function removeVenueMediaAction(
  venueId: string,
  path: string
): Promise<VenueActionResult> {
  let context;
  try {
    context = await requireVenueManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getVenueById(venueId);
  if (!existing) return { error: "Venue not found" };

  const supabase = await createClient();
  await supabase.storage.from(VENUE_MEDIA_BUCKET).remove([path]);

  await logAudit(context.activeTenant!.tenantId, "venue.media_removed", venueId, {
    path,
  } as Json, null);

  revalidatePath(`/venues/${venueId}/edit`);
  return { success: "Image removed" };
}
