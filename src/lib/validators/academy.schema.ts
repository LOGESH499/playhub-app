import { z } from "zod";
import {
  ACADEMY_TYPES,
  type AcademyType,
} from "@/lib/database/enums";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const scheduleDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const skillLevels = ["beginner", "intermediate", "advanced"] as const;
const feePeriods = ["monthly", "quarterly", "annual"] as const;
const enrollmentStatuses = [
  "pending",
  "active",
  "suspended",
  "completed",
  "cancelled",
] as const;
const attendanceStatuses = ["present", "absent", "late", "excused"] as const;
const feeStatuses = ["pending", "paid", "overdue", "waived"] as const;

export const batchScheduleSchema = z.object({
  days: z.array(z.enum(scheduleDays)).min(1, "Select at least one training day"),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
});

export const createProgramSchema = z.object({
  venueId: z.string().uuid("Select a venue"),
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(slugRegex, "Lowercase letters, numbers, and hyphens only"),
  academyType: z.enum(ACADEMY_TYPES as unknown as [AcademyType, ...AcademyType[]]),
  description: z.string().max(2000).optional(),
  isPublished: z.boolean().default(false),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        path: z.string(),
        caption: z.string().optional(),
        sortOrder: z.number().int().min(0),
        isCover: z.boolean(),
      })
    )
    .default([]),
});

export const updateProgramSchema = createProgramSchema.partial().extend({
  id: z.string().uuid(),
});

export const createBatchSchema = z.object({
  programId: z.string().uuid(),
  name: z.string().min(2).max(120),
  ageGroupMin: z.coerce.number().int().min(0).optional(),
  ageGroupMax: z.coerce.number().int().min(0).optional(),
  skillLevel: z.enum(skillLevels).optional(),
  capacity: z.coerce.number().int().min(1).max(500),
  feeAmount: z.coerce.number().min(0).optional(),
  feePeriod: z.enum(feePeriods).optional(),
  schedule: batchScheduleSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateBatchSchema = createBatchSchema.partial().extend({
  id: z.string().uuid(),
});

export const assignCoachSchema = z.object({
  batchId: z.string().uuid(),
  coachId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
});

export const enrollStudentSchema = z.object({
  batchId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
});

export const updateEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid(),
  status: z.enum(enrollmentStatuses),
  notes: z.string().max(500).optional(),
});

export const generateSessionsSchema = z.object({
  batchId: z.string().uuid(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const attendanceRecordSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(attendanceStatuses),
  notes: z.string().max(200).optional(),
});

export const upsertAttendanceSchema = z.object({
  sessionId: z.string().uuid(),
  records: z.array(attendanceRecordSchema).min(1),
});

export const progressSchema = z.object({
  enrollmentId: z.string().uuid(),
  skillLevel: z.enum(skillLevels).optional(),
  completionPercent: z.coerce.number().int().min(0).max(100).optional(),
  milestones: z.array(z.string()).optional(),
  performanceNotes: z.string().max(2000).optional(),
});

export const generateFeesSchema = z.object({
  batchId: z.string().uuid(),
  periodLabel: z.string().min(2).max(80),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const recordFeePaymentSchema = z.object({
  feeId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const programListFiltersSchema = z.object({
  search: z.string().optional(),
  academyType: z.enum(ACADEMY_TYPES as unknown as [AcademyType, ...AcademyType[]]).optional(),
  published: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  view: z.enum(["grid", "list"]).default("grid"),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type AssignCoachInput = z.infer<typeof assignCoachSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type ProgramListFilters = z.infer<typeof programListFiltersSchema>;
export type BatchSchedule = z.infer<typeof batchScheduleSchema>;
export type ProgressInput = z.infer<typeof progressSchema>;
export type GenerateFeesInput = z.infer<typeof generateFeesSchema>;
export type RecordFeePaymentInput = z.infer<typeof recordFeePaymentSchema>;
export type GenerateSessionsInput = z.infer<typeof generateSessionsSchema>;
export type UpsertAttendanceInput = z.infer<typeof upsertAttendanceSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;

export const ENROLLMENT_STATUS_LABELS: Record<
  (typeof enrollmentStatuses)[number],
  string
> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ATTENDANCE_STATUS_LABELS: Record<
  (typeof attendanceStatuses)[number],
  string
> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

export const FEE_STATUS_LABELS: Record<(typeof feeStatuses)[number], string> = {
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  waived: "Waived",
};

export const SKILL_LEVEL_LABELS: Record<(typeof skillLevels)[number], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const SCHEDULE_DAY_LABELS: Record<(typeof scheduleDays)[number], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};
