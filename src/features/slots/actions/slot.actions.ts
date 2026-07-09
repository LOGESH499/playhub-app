"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import {
  blockSlotsSchema,
  bulkDeleteSlotsSchema,
  bulkGenerateSlotsSchema,
  bulkUpdateSlotsSchema,
  createSlotSchema,
  createSlotTemplateSchema,
  updateSlotSchema,
  updateSlotTemplateSchema,
  type BlockSlotsInput,
  type BulkDeleteSlotsInput,
  type BulkGenerateSlotsInput,
  type BulkUpdateSlotsInput,
  type CreateSlotInput,
  type CreateSlotTemplateInput,
  type UpdateSlotInput,
  type UpdateSlotTemplateInput,
} from "@/lib/validators/slot.schema";
import type { Json, TablesInsert } from "@/types/database.types";
import { getSlotById } from "@/features/slots/lib/queries";
import { buildSlotGenerationPlan } from "@/features/slots/lib/generation";
import { isPeakSlotTime, resolveSlotPrice } from "@/features/slots/lib/pricing";

export type SlotActionResult = {
  error?: string;
  success?: string;
  created?: number;
  skipped?: number;
};

async function requireSlotManager() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  if (!canManageOrganization(context.appRole)) {
    throw new Error("You do not have permission to manage slots");
  }
  if (!context.activeTenant?.tenantId) {
    throw new Error("Select an organization to manage slots");
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
  await supabase.rpc("log_slot_audit", {
    p_tenant_id: tenantId,
    p_action: action,
    p_entity_id: entityId,
    p_old_values: oldValues ?? null,
    p_new_values: newValues ?? null,
  });
}

async function validateWindow(
  tenantId: string,
  venueId: string,
  resourceId: string,
  startTime: string,
  endTime: string,
  excludeSlotId?: string
): Promise<{ valid: boolean; reason?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_slot_window", {
    p_tenant_id: tenantId,
    p_venue_id: venueId,
    p_resource_id: resourceId,
    p_start_time: startTime,
    p_end_time: endTime,
    p_exclude_slot_id: excludeSlotId ?? null,
  });

  if (error) return { valid: false, reason: error.message };
  const result = data as { valid?: boolean; reason?: string } | null;
  if (!result?.valid) {
    return { valid: false, reason: result?.reason ?? "Invalid slot window" };
  }
  return { valid: true };
}

function mapSlotStatus(slotType: CreateSlotInput["slotType"]) {
  if (slotType === "blocked" || slotType === "holiday") return "blocked" as const;
  if (slotType === "maintenance") return "maintenance" as const;
  return "available" as const;
}

export async function createSlotAction(
  input: CreateSlotInput
): Promise<SlotActionResult> {
  const parsed = createSlotSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const tenantId = context.activeTenant!.tenantId;
  const validation = await validateWindow(
    tenantId,
    parsed.data.venueId,
    parsed.data.resourceId,
    parsed.data.startTime,
    parsed.data.endTime
  );
  if (!validation.valid) return { error: validation.reason };

  const supabase = await createClient();
  const insert: TablesInsert<"slots"> = {
    tenant_id: tenantId,
    venue_id: parsed.data.venueId,
    resource_id: parsed.data.resourceId,
    template_id: parsed.data.templateId || null,
    slot_type: parsed.data.slotType,
    recurrence: parsed.data.recurrence,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    duration_minutes: parsed.data.durationMinutes,
    buffer_minutes: parsed.data.bufferMinutes,
    price_per_slot: parsed.data.pricePerSlot,
    capacity: parsed.data.capacity,
    status: parsed.data.status ?? mapSlotStatus(parsed.data.slotType),
    block_reason: parsed.data.blockReason || null,
  };

  const { data, error } = await supabase
    .from("slots")
    .insert(insert)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit(tenantId, "slot.created", data.id, null, insert as Json);
  revalidatePath("/slots");
  redirect(`/slots/${data.id}/edit?created=1`);
}

export async function updateSlotAction(
  input: UpdateSlotInput
): Promise<SlotActionResult> {
  const parsed = updateSlotSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getSlotById(parsed.data.id);
  if (!existing) return { error: "Slot not found" };

  const tenantId = context.activeTenant!.tenantId;
  const venueId = parsed.data.venueId ?? existing.venue_id;
  const resourceId = parsed.data.resourceId ?? existing.resource_id;
  const startTime = parsed.data.startTime ?? existing.start_time;
  const endTime = parsed.data.endTime ?? existing.end_time;

  const validation = await validateWindow(
    tenantId,
    venueId,
    resourceId,
    startTime,
    endTime,
    parsed.data.id
  );
  if (!validation.valid) return { error: validation.reason };

  const supabase = await createClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.venueId !== undefined) update.venue_id = parsed.data.venueId;
  if (parsed.data.resourceId !== undefined)
    update.resource_id = parsed.data.resourceId;
  if (parsed.data.templateId !== undefined)
    update.template_id = parsed.data.templateId || null;
  if (parsed.data.slotType !== undefined) update.slot_type = parsed.data.slotType;
  if (parsed.data.recurrence !== undefined)
    update.recurrence = parsed.data.recurrence;
  if (parsed.data.startTime !== undefined) update.start_time = parsed.data.startTime;
  if (parsed.data.endTime !== undefined) update.end_time = parsed.data.endTime;
  if (parsed.data.durationMinutes !== undefined)
    update.duration_minutes = parsed.data.durationMinutes;
  if (parsed.data.bufferMinutes !== undefined)
    update.buffer_minutes = parsed.data.bufferMinutes;
  if (parsed.data.pricePerSlot !== undefined)
    update.price_per_slot = parsed.data.pricePerSlot;
  if (parsed.data.capacity !== undefined) update.capacity = parsed.data.capacity;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.blockReason !== undefined)
    update.block_reason = parsed.data.blockReason || null;

  const { error } = await supabase
    .from("slots")
    .update(update)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  await logAudit(
    tenantId,
    "slot.updated",
    parsed.data.id,
    existing as unknown as Json,
    update as Json
  );

  revalidatePath("/slots");
  revalidatePath(`/slots/${parsed.data.id}/edit`);
  return { success: "Slot updated successfully" };
}

export async function deleteSlotAction(id: string): Promise<SlotActionResult> {
  try {
    await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getSlotById(id);
  if (!existing) return { error: "Slot not found" };

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("slots")
    .update({
      deleted_at: deletedAt,
      status: "cancelled",
      updated_at: deletedAt,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(
    existing.tenant_id,
    "slot.deleted",
    id,
    existing as unknown as Json,
    { deleted_at: deletedAt }
  );

  revalidatePath("/slots");
  return { success: "Slot deleted" };
}

export async function bulkGenerateSlotsAction(
  input: BulkGenerateSlotsInput
): Promise<SlotActionResult> {
  const parsed = bulkGenerateSlotsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const tenantId = context.activeTenant!.tenantId;
  const supabase = await createClient();

  const { data: resource } = await supabase
    .from("resources")
    .select("capacity, sport_type")
    .eq("id", parsed.data.resourceId)
    .single();

  const plan = buildSlotGenerationPlan(parsed.data);
  let created = 0;
  let skipped = 0;
  const peakStart =
    parsed.data.peakStartTime && parsed.data.peakStartTime !== ""
      ? parsed.data.peakStartTime
      : "17:00";
  const peakEnd =
    parsed.data.peakEndTime && parsed.data.peakEndTime !== ""
      ? parsed.data.peakEndTime
      : "22:00";

  for (const window of plan.windows) {
    const validation = await validateWindow(
      tenantId,
      parsed.data.venueId,
      parsed.data.resourceId,
      window.startTime,
      window.endTime
    );
    if (!validation.valid) {
      skipped++;
      continue;
    }

    const isPeak = isPeakSlotTime(window.startTime, peakStart, peakEnd);
    const priced = await resolveSlotPrice(supabase, {
      tenantId,
      venueId: parsed.data.venueId,
      resourceId: parsed.data.resourceId,
      sportType: resource?.sport_type ?? "",
      startTime: window.startTime,
      peakPrice: Number(parsed.data.peakPrice || window.pricePerSlot),
      offPeakPrice: Number(parsed.data.offPeakPrice || window.pricePerSlot),
      isPeakWindow: isPeak,
      isWeekend: window.isWeekend,
    });

    const insert: TablesInsert<"slots"> = {
      tenant_id: tenantId,
      venue_id: parsed.data.venueId,
      resource_id: parsed.data.resourceId,
      template_id: parsed.data.templateId || null,
      slot_type: priced.slotType,
      recurrence: parsed.data.recurrence,
      recurring_group_id: plan.recurringGroupId,
      start_time: window.startTime,
      end_time: window.endTime,
      duration_minutes: parsed.data.slotDurationMinutes,
      buffer_minutes: parsed.data.bufferMinutes,
      price_per_slot: priced.price,
      capacity: resource?.capacity ?? 1,
      status: "available",
    };

    const { error } = await supabase.from("slots").insert(insert);
    if (error) {
      skipped++;
    } else {
      created++;
    }
  }

  await logAudit(tenantId, "slot.bulk_generated", plan.recurringGroupId, null, {
    created,
    skipped,
  } as Json);

  revalidatePath("/slots");
  return {
    success: `Generated ${created} slots (${skipped} skipped)`,
    created,
    skipped,
  };
}

export async function bulkUpdateSlotsAction(
  input: BulkUpdateSlotsInput
): Promise<SlotActionResult> {
  const parsed = bulkUpdateSlotsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.slotType !== undefined) update.slot_type = parsed.data.slotType;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.pricePerSlot !== undefined)
    update.price_per_slot = parsed.data.pricePerSlot;
  if (parsed.data.blockReason !== undefined)
    update.block_reason = parsed.data.blockReason || null;

  const { error } = await supabase
    .from("slots")
    .update(update)
    .in("id", parsed.data.slotIds);

  if (error) return { error: error.message };

  revalidatePath("/slots");
  return { success: `Updated ${parsed.data.slotIds.length} slots` };
}

export async function bulkDeleteSlotsAction(
  input: BulkDeleteSlotsInput
): Promise<SlotActionResult> {
  const parsed = bulkDeleteSlotsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("slots")
    .update({
      deleted_at: deletedAt,
      status: "cancelled",
      updated_at: deletedAt,
    })
    .in("id", parsed.data.slotIds);

  if (error) return { error: error.message };

  revalidatePath("/slots");
  return { success: `Deleted ${parsed.data.slotIds.length} slots` };
}

export async function blockSlotsAction(
  input: BlockSlotsInput
): Promise<SlotActionResult> {
  const parsed = blockSlotsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const tenantId = context.activeTenant!.tenantId;
  const durationMinutes = Math.round(
    (new Date(parsed.data.endTime).getTime() -
      new Date(parsed.data.startTime).getTime()) /
      60000
  );

  const validation = await validateWindow(
    tenantId,
    parsed.data.venueId,
    parsed.data.resourceId,
    parsed.data.startTime,
    parsed.data.endTime
  );
  if (!validation.valid) return { error: validation.reason };

  const supabase = await createClient();
  const { data: resource } = await supabase
    .from("resources")
    .select("capacity")
    .eq("id", parsed.data.resourceId)
    .single();

  const insert: TablesInsert<"slots"> = {
    tenant_id: tenantId,
    venue_id: parsed.data.venueId,
    resource_id: parsed.data.resourceId,
    slot_type: parsed.data.slotType,
    recurrence: "none",
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    duration_minutes: durationMinutes,
    buffer_minutes: 0,
    price_per_slot: 0,
    capacity: resource?.capacity ?? 1,
    status:
      parsed.data.slotType === "maintenance" ? "maintenance" : "blocked",
    block_reason: parsed.data.blockReason || null,
  };

  const { data, error } = await supabase
    .from("slots")
    .insert(insert)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit(tenantId, "slot.blocked", data.id, null, insert as Json);
  revalidatePath("/slots");
  return { success: "Block created" };
}

export async function moveSlotAction(
  id: string,
  startTime: string,
  endTime: string
): Promise<SlotActionResult> {
  return updateSlotAction({ id, startTime, endTime });
}

export async function createSlotTemplateAction(
  input: CreateSlotTemplateInput
): Promise<SlotActionResult> {
  const parsed = createSlotTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const tenantId = context.activeTenant!.tenantId;
  const supabase = await createClient();

  const insert: TablesInsert<"slot_templates"> = {
    tenant_id: tenantId,
    venue_id: parsed.data.venueId,
    resource_id: parsed.data.resourceId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    recurrence: parsed.data.recurrence,
    days_of_week: parsed.data.daysOfWeek,
    start_time: parsed.data.startTime.length === 5
      ? `${parsed.data.startTime}:00`
      : parsed.data.startTime,
    end_time: parsed.data.endTime.length === 5
      ? `${parsed.data.endTime}:00`
      : parsed.data.endTime,
    slot_duration_minutes: parsed.data.slotDurationMinutes,
    buffer_minutes: parsed.data.bufferMinutes,
    peak_price:
      parsed.data.peakPrice === "" || parsed.data.peakPrice === undefined
        ? null
        : parsed.data.peakPrice,
    off_peak_price:
      parsed.data.offPeakPrice === "" || parsed.data.offPeakPrice === undefined
        ? null
        : parsed.data.offPeakPrice,
    peak_start_time:
      parsed.data.peakStartTime && parsed.data.peakStartTime !== ""
        ? parsed.data.peakStartTime.length === 5
          ? `${parsed.data.peakStartTime}:00`
          : parsed.data.peakStartTime
        : "17:00:00",
    peak_end_time:
      parsed.data.peakEndTime && parsed.data.peakEndTime !== ""
        ? parsed.data.peakEndTime.length === 5
          ? `${parsed.data.peakEndTime}:00`
          : parsed.data.peakEndTime
        : "22:00:00",
    default_slot_type: parsed.data.defaultSlotType,
    valid_from: parsed.data.validFrom,
    valid_until: parsed.data.validUntil || null,
    is_active: parsed.data.isActive,
  };

  const { data, error } = await supabase
    .from("slot_templates")
    .insert(insert)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/slots/templates");
  redirect(`/slots/templates/${data.id}/edit?created=1`);
}

export async function updateSlotTemplateAction(
  input: UpdateSlotTemplateInput
): Promise<SlotActionResult> {
  const parsed = updateSlotTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.description !== undefined)
    update.description = parsed.data.description || null;
  if (parsed.data.recurrence !== undefined)
    update.recurrence = parsed.data.recurrence;
  if (parsed.data.daysOfWeek !== undefined)
    update.days_of_week = parsed.data.daysOfWeek;
  if (parsed.data.startTime !== undefined)
    update.start_time =
      parsed.data.startTime.length === 5
        ? `${parsed.data.startTime}:00`
        : parsed.data.startTime;
  if (parsed.data.endTime !== undefined)
    update.end_time =
      parsed.data.endTime.length === 5
        ? `${parsed.data.endTime}:00`
        : parsed.data.endTime;
  if (parsed.data.slotDurationMinutes !== undefined)
    update.slot_duration_minutes = parsed.data.slotDurationMinutes;
  if (parsed.data.bufferMinutes !== undefined)
    update.buffer_minutes = parsed.data.bufferMinutes;
  if (parsed.data.peakPrice !== undefined)
    update.peak_price = parsed.data.peakPrice === "" ? null : parsed.data.peakPrice;
  if (parsed.data.offPeakPrice !== undefined)
    update.off_peak_price =
      parsed.data.offPeakPrice === "" ? null : parsed.data.offPeakPrice;
  if (parsed.data.peakStartTime !== undefined)
    update.peak_start_time =
      parsed.data.peakStartTime === ""
        ? "17:00:00"
        : parsed.data.peakStartTime.length === 5
          ? `${parsed.data.peakStartTime}:00`
          : parsed.data.peakStartTime;
  if (parsed.data.peakEndTime !== undefined)
    update.peak_end_time =
      parsed.data.peakEndTime === ""
        ? "22:00:00"
        : parsed.data.peakEndTime.length === 5
          ? `${parsed.data.peakEndTime}:00`
          : parsed.data.peakEndTime;
  if (parsed.data.defaultSlotType !== undefined)
    update.default_slot_type = parsed.data.defaultSlotType;
  if (parsed.data.validFrom !== undefined) update.valid_from = parsed.data.validFrom;
  if (parsed.data.validUntil !== undefined)
    update.valid_until = parsed.data.validUntil || null;
  if (parsed.data.isActive !== undefined) update.is_active = parsed.data.isActive;

  const { error } = await supabase
    .from("slot_templates")
    .update(update)
    .eq("id", parsed.data.id);

  if (error) return { error: error.message };

  revalidatePath("/slots/templates");
  return { success: "Template updated" };
}

export async function generateFromTemplateAction(
  templateId: string,
  startDate: string,
  endDate: string
): Promise<SlotActionResult> {
  try {
    await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { data: template } = await supabase
    .from("slot_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (!template) return { error: "Template not found" };

  return bulkGenerateSlotsAction({
    venueId: template.venue_id,
    resourceId: template.resource_id,
    templateId: template.id,
    startDate,
    endDate,
    daysOfWeek: template.days_of_week ?? [],
    dailyStartTime: template.start_time.slice(0, 5),
    dailyEndTime: template.end_time.slice(0, 5),
    slotDurationMinutes: template.slot_duration_minutes,
    bufferMinutes: template.buffer_minutes,
    peakPrice: template.peak_price ?? "",
    offPeakPrice: template.off_peak_price ?? "",
    peakStartTime:
      (template as { peak_start_time?: string }).peak_start_time?.slice(0, 5) ??
      "17:00",
    peakEndTime:
      (template as { peak_end_time?: string }).peak_end_time?.slice(0, 5) ??
      "22:00",
    recurrence: template.recurrence,
  });
}

export async function duplicateSlotAction(
  id: string
): Promise<SlotActionResult | void> {
  let context;
  try {
    context = await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const existing = await getSlotById(id);
  if (!existing) return { error: "Slot not found" };

  const start = new Date(existing.start_time);
  const end = new Date(existing.end_time);
  const duration = existing.duration_minutes;
  start.setDate(start.getDate() + 1);
  end.setTime(start.getTime() + duration * 60000);

  return createSlotAction({
    venueId: existing.venue_id,
    resourceId: existing.resource_id,
    templateId: existing.template_id ?? "",
    slotType: existing.slot_type,
    recurrence: "none",
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMinutes: duration,
    bufferMinutes: existing.buffer_minutes,
    pricePerSlot: Number(existing.price_per_slot),
    capacity: existing.capacity,
    status: "available",
    blockReason: "",
  });
}

export async function deleteSlotTemplateAction(
  id: string
): Promise<SlotActionResult> {
  try {
    await requireSlotManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("slot_templates")
    .update({ deleted_at: deletedAt, is_active: false, updated_at: deletedAt })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/slots/templates");
  return { success: "Template deleted" };
}

export async function unblockSlotsAction(
  slotIds: string[]
): Promise<SlotActionResult> {
  return bulkUpdateSlotsAction({
    slotIds,
    status: "available",
    slotType: "standard",
    blockReason: "",
  });
}
