"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageAcademy, canManageOrganization } from "@/lib/auth/roles";
import {
  assignCoachSchema,
  createBatchSchema,
  createProgramSchema,
  enrollStudentSchema,
  generateFeesSchema,
  generateSessionsSchema,
  progressSchema,
  recordFeePaymentSchema,
  updateBatchSchema,
  updateEnrollmentSchema,
  updateProgramSchema,
  upsertAttendanceSchema,
  type AssignCoachInput,
  type CreateBatchInput,
  type CreateProgramInput,
  type EnrollStudentInput,
  type GenerateFeesInput,
  type GenerateSessionsInput,
  type ProgressInput,
  type RecordFeePaymentInput,
  type UpdateBatchInput,
  type UpdateEnrollmentInput,
  type UpdateProgramInput,
  type UpsertAttendanceInput,
} from "@/lib/validators/academy.schema";
import type { Json, TablesInsert, TablesUpdate } from "@/types/database.types";
import { getProgramById } from "@/features/academies/lib/queries";

export type AcademyActionResult = {
  error?: string;
  success?: string;
  id?: string;
};

async function requireAcademyAccess() {
  const context = await getAuthContext();
  if (!context) throw new Error("Unauthorized");
  if (!canManageAcademy(context.appRole)) {
    throw new Error("You do not have permission to access academies");
  }
  if (!context.activeTenant?.tenantId) {
    throw new Error("Select an organization first");
  }
  return context;
}

async function requireAcademyManager() {
  const context = await requireAcademyAccess();
  if (!canManageOrganization(context.appRole)) {
    throw new Error("You do not have permission to manage academies");
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
  await supabase.rpc("log_academy_audit", {
    p_tenant_id: tenantId,
    p_action: action,
    p_entity_id: entityId,
    p_old_values: oldValues ?? null,
    p_new_values: newValues ?? null,
  });
}

export async function createProgramAction(
  input: CreateProgramInput
): Promise<AcademyActionResult | void> {
  const parsed = createProgramSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const tenantId = context.activeTenant!.tenantId;
  const supabase = await createClient();

  const row: TablesInsert<"academy_programs"> = {
    tenant_id: tenantId,
    venue_id: parsed.data.venueId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    academy_type: parsed.data.academyType,
    description: parsed.data.description ?? null,
    is_published: parsed.data.isPublished,
    images: parsed.data.images as Json,
  };

  const { data, error } = await supabase
    .from("academy_programs")
    .insert(row)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit(tenantId, "program.created", data.id, null, row as Json);
  revalidatePath("/academies");
  redirect(`/academies/${data.id}`);
}

export async function updateProgramAction(
  input: UpdateProgramInput
): Promise<AcademyActionResult> {
  const parsed = updateProgramSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const { id, ...fields } = parsed.data;
  const existing = await getProgramById(id);
  if (!existing) return { error: "Program not found" };

  const update: TablesUpdate<"academy_programs"> = {};
  if (fields.venueId) update.venue_id = fields.venueId;
  if (fields.name) update.name = fields.name;
  if (fields.slug) update.slug = fields.slug;
  if (fields.academyType) update.academy_type = fields.academyType;
  if (fields.description !== undefined) update.description = fields.description ?? null;
  if (fields.isPublished !== undefined) update.is_published = fields.isPublished;
  if (fields.images) update.images = fields.images as Json;

  const supabase = await createClient();
  const { error } = await supabase
    .from("academy_programs")
    .update(update)
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(
    context.activeTenant!.tenantId,
    "program.updated",
    id,
    existing as unknown as Json,
    update as Json
  );
  revalidatePath("/academies");
  revalidatePath(`/academies/${id}`);
  return { success: "Program updated" };
}

export async function deleteProgramAction(id: string): Promise<AcademyActionResult> {
  let context;
  try {
    context = await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("academy_programs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(context.activeTenant!.tenantId, "program.deleted", id);
  revalidatePath("/academies");
  return { success: "Program archived" };
}

export async function createBatchAction(
  input: CreateBatchInput
): Promise<AcademyActionResult | void> {
  const parsed = createBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const program = await getProgramById(parsed.data.programId);
  if (!program) return { error: "Program not found" };

  const row: TablesInsert<"batches"> = {
    tenant_id: context.activeTenant!.tenantId,
    program_id: parsed.data.programId,
    name: parsed.data.name,
    age_group_min: parsed.data.ageGroupMin ?? null,
    age_group_max: parsed.data.ageGroupMax ?? null,
    skill_level: parsed.data.skillLevel ?? null,
    capacity: parsed.data.capacity,
    fee_amount: parsed.data.feeAmount ?? null,
    fee_period: parsed.data.feePeriod ?? null,
    schedule: parsed.data.schedule as Json,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate || null,
    is_active: parsed.data.isActive,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.from("batches").insert(row).select("id").single();
  if (error) return { error: error.message };

  await logAudit(context.activeTenant!.tenantId, "batch.created", data.id, null, row as Json);
  revalidatePath(`/academies/${parsed.data.programId}`);
  redirect(`/academies/${parsed.data.programId}/batches/${data.id}`);
}

export async function updateBatchAction(
  input: UpdateBatchInput
): Promise<AcademyActionResult> {
  const parsed = updateBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const { id, programId, ...fields } = parsed.data;
  const update: TablesUpdate<"batches"> = {};
  if (fields.name) update.name = fields.name;
  if (fields.ageGroupMin !== undefined) update.age_group_min = fields.ageGroupMin ?? null;
  if (fields.ageGroupMax !== undefined) update.age_group_max = fields.ageGroupMax ?? null;
  if (fields.skillLevel !== undefined) update.skill_level = fields.skillLevel ?? null;
  if (fields.capacity) update.capacity = fields.capacity;
  if (fields.feeAmount !== undefined) update.fee_amount = fields.feeAmount ?? null;
  if (fields.feePeriod !== undefined) update.fee_period = fields.feePeriod ?? null;
  if (fields.schedule) update.schedule = fields.schedule as Json;
  if (fields.startDate) update.start_date = fields.startDate;
  if (fields.endDate !== undefined) update.end_date = fields.endDate || null;
  if (fields.isActive !== undefined) update.is_active = fields.isActive;

  const supabase = await createClient();
  const { data: batch } = await supabase
    .from("batches")
    .select("program_id")
    .eq("id", id!)
    .single();

  const { error } = await supabase.from("batches").update(update).eq("id", id!);
  if (error) return { error: error.message };

  await logAudit(context.activeTenant!.tenantId, "batch.updated", id!, null, update as Json);
  revalidatePath(`/academies/${batch?.program_id ?? programId}`);
  revalidatePath(`/academies/${batch?.program_id}/batches/${id}`);
  return { success: "Batch updated" };
}

export async function assignCoachAction(
  input: AssignCoachInput
): Promise<AcademyActionResult> {
  const parsed = assignCoachSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  if (parsed.data.isPrimary) {
    await supabase
      .from("batch_coaches")
      .update({ is_primary: false })
      .eq("batch_id", parsed.data.batchId);
  }

  const { error } = await supabase.from("batch_coaches").upsert({
    batch_id: parsed.data.batchId,
    coach_id: parsed.data.coachId,
    is_primary: parsed.data.isPrimary,
  });

  if (error) return { error: error.message };
  revalidatePath(`/academies`);
  return { success: "Coach assigned" };
}

export async function removeCoachAction(
  batchId: string,
  coachId: string
): Promise<AcademyActionResult> {
  try {
    await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("batch_coaches")
    .delete()
    .eq("batch_id", batchId)
    .eq("coach_id", coachId);

  if (error) return { error: error.message };
  return { success: "Coach removed" };
}

export async function enrollStudentAction(
  input: EnrollStudentInput
): Promise<AcademyActionResult> {
  const parsed = enrollStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let context;
  try {
    context = await requireAcademyAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const studentId =
    parsed.data.studentId && canManageOrganization(context.appRole)
      ? parsed.data.studentId
      : context.userId;

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_enrollment", {
    p_batch_id: parsed.data.batchId,
    p_student_id: studentId,
    p_enrolled_by: context.userId,
  });

  if (error) return { error: error.message };
  revalidatePath("/academies");
  return { success: "Enrolled successfully" };
}

export async function updateEnrollmentAction(
  input: UpdateEnrollmentInput
): Promise<AcademyActionResult> {
  const parsed = updateEnrollmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_enrollment_status", {
    p_enrollment_id: parsed.data.enrollmentId,
    p_status: parsed.data.status,
    p_notes: parsed.data.notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/academies");
  return { success: "Enrollment updated" };
}

export async function generateSessionsAction(
  input: GenerateSessionsInput
): Promise<AcademyActionResult> {
  const parsed = generateSessionsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAcademyAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_batch_sessions", {
    p_batch_id: parsed.data.batchId,
    p_from_date: parsed.data.fromDate ?? null,
    p_to_date: parsed.data.toDate ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/academies");
  return { success: `Generated ${data} training sessions` };
}

export async function upsertAttendanceAction(
  input: UpsertAttendanceInput
): Promise<AcademyActionResult> {
  const parsed = upsertAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAcademyAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const records = parsed.data.records.map((r) => ({
    student_id: r.studentId,
    status: r.status,
    notes: r.notes ?? null,
  }));

  const { data, error } = await supabase.rpc("upsert_session_attendance", {
    p_session_id: parsed.data.sessionId,
    p_records: records as Json,
  });

  if (error) return { error: error.message };
  revalidatePath("/academies");
  return { success: `Attendance saved for ${data} students` };
}

export async function updateProgressAction(
  input: ProgressInput
): Promise<AcademyActionResult> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAcademyAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_enrollment_progress", {
    p_enrollment_id: parsed.data.enrollmentId,
    p_skill_level: parsed.data.skillLevel ?? null,
    p_completion_percent: parsed.data.completionPercent ?? null,
    p_milestones: (parsed.data.milestones ?? null) as Json,
    p_performance_notes: parsed.data.performanceNotes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/academies");
  return { success: "Progress updated" };
}

export async function generateFeesAction(
  input: GenerateFeesInput
): Promise<AcademyActionResult> {
  const parsed = generateFeesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_batch_fees", {
    p_batch_id: parsed.data.batchId,
    p_period_label: parsed.data.periodLabel,
    p_due_date: parsed.data.dueDate ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/academies");
  return { success: `Generated ${data} fee records` };
}

export async function recordFeePaymentAction(
  input: RecordFeePaymentInput
): Promise<AcademyActionResult> {
  const parsed = recordFeePaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await requireAcademyManager();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_fee_payment", {
    p_fee_id: parsed.data.feeId,
    p_notes: parsed.data.notes ?? null,
    p_payment_method: parsed.data.paymentMethod,
    p_reference: parsed.data.reference ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/academies");
  return { success: "Payment recorded" };
}
