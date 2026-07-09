import type { BadgeProps } from "@/components/ui/badge";
import type { EnrollmentStatus } from "@/lib/database/enums";

export const ENROLLMENT_STATUS_VARIANTS: Record<
  EnrollmentStatus,
  NonNullable<BadgeProps["variant"]>
> = {
  pending: "warning",
  active: "default",
  suspended: "secondary",
  completed: "success",
  cancelled: "outline",
};

export const ATTENDANCE_STATUS_VARIANTS: Record<
  string,
  NonNullable<BadgeProps["variant"]>
> = {
  present: "success",
  absent: "secondary",
  late: "warning",
  excused: "outline",
};

export const FEE_STATUS_VARIANTS: Record<
  string,
  NonNullable<BadgeProps["variant"]>
> = {
  pending: "warning",
  paid: "success",
  overdue: "secondary",
  waived: "outline",
};
