import type { Tables } from "@/types/database.types";

export type AcademyProgram = Tables<"academy_programs">;
export type Batch = Tables<"batches">;
export type Enrollment = Tables<"enrollments">;
export type BatchSession = Tables<"batch_sessions">;
export type AttendanceRecord = Tables<"attendance_records">;

export interface ProgramWithRelations extends AcademyProgram {
  venue: { id: string; name: string } | null;
  batch_count?: number;
}

export interface ProgramDetail extends ProgramWithRelations {
  batches: BatchWithRelations[];
}

export interface BatchWithRelations extends Batch {
  program?: { id: string; name: string; academy_type: string } | null;
  coaches?: BatchCoachRow[];
  enrollment_count?: number;
  session_count?: number;
}

export interface BatchCoachRow {
  id: string;
  coach_id: string;
  is_primary: boolean;
  coach: { id: string; full_name: string; email: string } | null;
}

export interface EnrollmentWithStudent extends Enrollment {
  student: { id: string; full_name: string; email: string } | null;
  batch?: { id: string; name: string } | null;
  progress?: EnrollmentProgressRow | null;
}

export interface EnrollmentProgressRow {
  id: string;
  skill_level: string | null;
  completion_percent: number;
  milestones: unknown;
  performance_notes: string | null;
  attendance_rate: number | null;
}

export interface SessionWithBatch extends BatchSession {
  batch?: { id: string; name: string } | null;
  attendance_count?: number;
}

export interface FeeRecordRow {
  id: string;
  enrollment_id: string;
  amount: number;
  period_label: string;
  due_date: string | null;
  status: string;
  paid_at: string | null;
  student?: { id: string; full_name: string } | null;
}

export interface ProgramsListResult {
  programs: ProgramWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AcademyStats {
  programs: number;
  batches: number;
  activeEnrollments: number;
  sessionsThisMonth: number;
  feesCollected: number;
  feesPending: number;
  avgAttendanceRate: number;
}
