import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageAcademy,
  canManageOrganization,
} from "@/lib/auth/roles";
import type { ProgramListFilters } from "@/lib/validators/academy.schema";
import { parseBatchSchedule } from "./parse";
import type {
  AcademyStats,
  BatchCoachRow,
  BatchWithRelations,
  EnrollmentWithStudent,
  FeeRecordRow,
  ProgramDetail,
  ProgramsListResult,
  ProgramWithRelations,
  SessionWithBatch,
} from "./types";

export { parseBatchSchedule, slugifyAcademyName } from "./parse";

export async function listPrograms(
  filters: ProgramListFilters
): Promise<ProgramsListResult> {
  const supabase = await createClient();
  const context = await getAuthContext();
  const tenantId = context?.activeTenant?.tenantId;

  if (!tenantId) {
    return emptyPrograms(filters);
  }

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("academy_programs")
    .select(
      `
      *,
      venue:venues ( id, name )
    `,
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .range(from, to);

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }
  if (filters.academyType) query = query.eq("academy_type", filters.academyType);
  if (filters.published === "true") query = query.eq("is_published", true);
  if (filters.published === "false") query = query.eq("is_published", false);

  const { data, count, error } = await query;
  if (error) return emptyPrograms(filters);

  const programs = (data ?? []).map((row) => {
    const { venue, ...program } = row as typeof row & {
      venue: ProgramWithRelations["venue"];
    };
    return { ...program, venue };
  }) as ProgramWithRelations[];

  const total = count ?? 0;
  return {
    programs,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 1,
  };
}

function emptyPrograms(filters: ProgramListFilters): ProgramsListResult {
  return {
    programs: [],
    total: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: 0,
  };
}

export async function getProgramById(id: string): Promise<ProgramDetail | null> {
  const supabase = await createClient();
  const context = await getAuthContext();
  if (!context?.activeTenant) return null;

  const { data: program } = await supabase
    .from("academy_programs")
    .select(
      `
      *,
      venue:venues ( id, name )
    `
    )
    .eq("id", id)
    .eq("tenant_id", context.activeTenant.tenantId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!program) return null;

  const { data: batches } = await supabase
    .from("batches")
    .select("*")
    .eq("program_id", id)
    .is("deleted_at", null)
    .order("name");

  const row = program as typeof program & {
    venue: ProgramWithRelations["venue"];
  };

  return {
    ...row,
    venue: row.venue,
    batches: (batches ?? []) as BatchWithRelations[],
  };
}

export async function getBatchById(id: string): Promise<BatchWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("batches")
    .select(
      `
      *,
      program:academy_programs ( id, name, academy_type )
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;

  const { program, ...batch } = data as typeof data & {
    program: BatchWithRelations["program"];
  };

  const [{ data: coaches }, { count: enrollmentCount }, { count: sessionCount }] =
    await Promise.all([
      supabase
        .from("batch_coaches")
        .select(
          `
          id,
          coach_id,
          is_primary,
          coach:profiles!batch_coaches_coach_id_fkey ( id, full_name, email )
        `
        )
        .eq("batch_id", id),
      supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("batch_id", id)
        .eq("status", "active"),
      supabase
        .from("batch_sessions")
        .select("id", { count: "exact", head: true })
        .eq("batch_id", id),
    ]);

  return {
    ...batch,
    program,
    coaches: (coaches ?? []).map((row) => {
      const item = row as typeof row & {
        coach: BatchCoachRow["coach"];
      };
      return {
        id: item.id,
        coach_id: item.coach_id,
        is_primary: item.is_primary,
        coach: item.coach,
      };
    }),
    enrollment_count: enrollmentCount ?? 0,
    session_count: sessionCount ?? 0,
  };
}

export async function listBatchEnrollments(
  batchId: string
): Promise<EnrollmentWithStudent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select(
      `
      *,
      student:profiles!enrollments_student_id_fkey ( id, full_name, email )
    `
    )
    .eq("batch_id", batchId)
    .order("enrolled_at", { ascending: false });

  const rows = (data ?? []) as EnrollmentWithStudent[];
  const enrollmentIds = rows.map((r) => r.id);
  if (enrollmentIds.length === 0) return rows;

  const { data: progressRows } = await supabase
    .from("enrollment_progress")
    .select("*")
    .in("enrollment_id", enrollmentIds);

  const progressMap = new Map(
    (progressRows ?? []).map((p) => [p.enrollment_id, p])
  );

  return rows.map((row) => ({
    ...row,
    progress: progressMap.get(row.id) ?? null,
  }));
}

export async function listBatchSessions(
  batchId: string
): Promise<SessionWithBatch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("batch_sessions")
    .select("*")
    .eq("batch_id", batchId)
    .order("session_date", { ascending: false })
    .limit(100);

  return (data ?? []) as SessionWithBatch[];
}

export async function getSessionWithAttendance(sessionId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("batch_sessions")
    .select(
      `
      *,
      batch:batches ( id, name, program_id )
    `
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return null;

  const batchId = (session.batch as { id: string } | null)?.id;
  const [enrollments, { data: attendance }] = await Promise.all([
    batchId ? listBatchEnrollments(batchId) : Promise.resolve([]),
    supabase
      .from("attendance_records")
      .select("*")
      .eq("session_id", sessionId),
  ]);

  return {
    session,
    enrollments: enrollments.filter((e) => e.status === "active"),
    attendance: attendance ?? [],
  };
}

export async function listBatchFees(batchId: string): Promise<FeeRecordRow[]> {
  const supabase = await createClient();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id")
    .eq("batch_id", batchId);

  const ids = (enrollments ?? []).map((e) => e.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("fee_records")
    .select(
      `
      *,
      enrollment:enrollments (
        student:profiles!enrollments_student_id_fkey ( id, full_name )
      )
    `
    )
    .in("enrollment_id", ids)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const enrollment = row.enrollment as {
      student: { id: string; full_name: string } | null;
    } | null;
    return {
      id: row.id,
      enrollment_id: row.enrollment_id,
      amount: Number(row.amount),
      period_label: row.period_label,
      due_date: row.due_date,
      status: row.status,
      paid_at: row.paid_at,
      student: enrollment?.student ?? null,
    };
  });
}

export async function listMyEnrollments(): Promise<EnrollmentWithStudent[]> {
  const context = await getAuthContext();
  if (!context) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select(
      `
      *,
      student:profiles!enrollments_student_id_fkey ( id, full_name, email ),
      batch:batches ( id, name, program_id )
    `
    )
    .eq("student_id", context.userId)
    .order("enrolled_at", { ascending: false });

  return (data ?? []) as EnrollmentWithStudent[];
}

export async function listCoachBatches(): Promise<BatchWithRelations[]> {
  const context = await getAuthContext();
  if (!context) return [];

  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("batch_coaches")
    .select("batch_id")
    .eq("coach_id", context.userId);

  const batchIds = (assignments ?? []).map((a) => a.batch_id);
  if (batchIds.length === 0) return [];

  const { data } = await supabase
    .from("batches")
    .select(
      `
      *,
      program:academy_programs ( id, name, academy_type )
    `
    )
    .in("id", batchIds)
    .is("deleted_at", null);

  return (data ?? []).map((row) => {
    const { program, ...batch } = row as typeof row & {
      program: BatchWithRelations["program"];
    };
    return { ...batch, program };
  });
}

export async function getAcademyStats(): Promise<AcademyStats> {
  const context = await getAuthContext();
  if (!context?.activeTenant || !canManageOrganization(context.appRole)) {
    return {
      programs: 0,
      batches: 0,
      activeEnrollments: 0,
      sessionsThisMonth: 0,
      feesCollected: 0,
      feesPending: 0,
      avgAttendanceRate: 0,
    };
  }

  const tenantId = context.activeTenant.tenantId;
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const [
    { count: programs },
    { count: batches },
    { count: activeEnrollments },
    { count: sessionsThisMonth },
    { data: fees },
    { data: progress },
  ] = await Promise.all([
    supabase
      .from("academy_programs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("batches")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
    supabase
      .from("batch_sessions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("session_date", monthStartStr),
    supabase
      .from("fee_records")
      .select("amount, status")
      .eq("tenant_id", tenantId),
    supabase
      .from("enrollment_progress")
      .select("attendance_rate")
      .eq("tenant_id", tenantId),
  ]);

  const feeRows = fees ?? [];
  const rates = (progress ?? [])
    .map((p) => Number(p.attendance_rate))
    .filter((r) => !Number.isNaN(r));

  return {
    programs: programs ?? 0,
    batches: batches ?? 0,
    activeEnrollments: activeEnrollments ?? 0,
    sessionsThisMonth: sessionsThisMonth ?? 0,
    feesCollected: feeRows
      .filter((f) => f.status === "paid")
      .reduce((sum, f) => sum + Number(f.amount ?? 0), 0),
    feesPending: feeRows
      .filter((f) => f.status === "pending" || f.status === "overdue")
      .reduce((sum, f) => sum + Number(f.amount ?? 0), 0),
    avgAttendanceRate:
      rates.length > 0
        ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
        : 0,
  };
}

export async function getVenuesForAcademyForm() {
  const context = await getAuthContext();
  if (!context?.activeTenant) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("venues")
    .select("id, name")
    .eq("tenant_id", context.activeTenant.tenantId)
    .is("deleted_at", null)
    .eq("status", "active")
    .order("name");
  return data ?? [];
}

export async function getCoachesForTenant() {
  const context = await getAuthContext();
  if (!context?.activeTenant) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_members")
    .select(
      `
      user_id,
      profile:profiles!tenant_members_user_id_fkey ( id, full_name, email )
    `
    )
    .eq("tenant_id", context.activeTenant.tenantId)
    .eq("role", "coach")
    .eq("status", "active");

  return (data ?? [])
    .map((row) => {
      const profile = row.profile as
        | { id: string; full_name: string; email: string }
        | { id: string; full_name: string; email: string }[]
        | null;
      if (!profile) return null;
      return Array.isArray(profile) ? profile[0] ?? null : profile;
    })
    .filter((p): p is { id: string; full_name: string; email: string } => Boolean(p));
}

export async function getTenantMembersForEnrollment() {
  const context = await getAuthContext();
  if (!context?.activeTenant) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_members")
    .select(
      `
      user_id,
      profile:profiles!tenant_members_user_id_fkey ( id, full_name, email )
    `
    )
    .eq("tenant_id", context.activeTenant.tenantId)
    .eq("status", "active");

  return (data ?? [])
    .map((row) => {
      const profile = row.profile as
        | { id: string; full_name: string; email: string }
        | { id: string; full_name: string; email: string }[]
        | null;
      if (!profile) return null;
      return Array.isArray(profile) ? profile[0] ?? null : profile;
    })
    .filter((p): p is { id: string; full_name: string; email: string } => Boolean(p));
}

export function canManageAcademies(appRole: string): boolean {
  return canManageOrganization(appRole as never);
}

export function canAccessAcademy(appRole: string): boolean {
  return canManageAcademy(appRole as never);
}

export function getBatchSchedule(batch: { schedule: unknown }) {
  return parseBatchSchedule(batch.schedule);
}
