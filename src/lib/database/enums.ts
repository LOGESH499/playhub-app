import type { Enums } from "@/types/database.types";

export type SportType = Enums<"sport_type">;
export type AcademyType = Enums<"academy_type">;
export type TenantRole = Enums<"tenant_role">;
export type BookingStatus = Enums<"booking_status">;
export type EnrollmentStatus = Enums<"enrollment_status">;
export type PaymentStatus = Enums<"payment_status">;

export const SPORT_TYPES = [
  "football",
  "cricket",
  "cricket_nets",
  "pickleball",
  "badminton",
  "tennis",
  "squash",
  "basketball",
  "volleyball",
  "swimming",
  "running_track",
] as const satisfies readonly SportType[];

export const ACADEMY_TYPES = [
  "running_academy",
  "football_academy",
  "cricket_academy",
  "tennis_academy",
  "swimming_academy",
  "badminton_academy",
] as const satisfies readonly AcademyType[];

export const TENANT_ROLES = [
  "owner",
  "admin",
  "manager",
  "staff",
  "coach",
  "member",
] as const satisfies readonly TenantRole[];

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const satisfies readonly BookingStatus[];

export const SPORT_LABELS: Record<SportType, string> = {
  football: "Football",
  cricket: "Cricket",
  cricket_nets: "Cricket Nets",
  pickleball: "Pickleball",
  badminton: "Badminton",
  tennis: "Tennis",
  squash: "Squash",
  basketball: "Basketball",
  volleyball: "Volleyball",
  swimming: "Swimming",
  running_track: "Running Track",
};

export const ACADEMY_LABELS: Record<AcademyType, string> = {
  running_academy: "Running Academy",
  football_academy: "Football Academy",
  cricket_academy: "Cricket Academy",
  tennis_academy: "Tennis Academy",
  swimming_academy: "Swimming Academy",
  badminton_academy: "Badminton Academy",
};
