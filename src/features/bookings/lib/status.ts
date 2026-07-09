import type { BadgeProps } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/database/enums";

export const BOOKING_STATUS_VARIANTS: Record<
  BookingStatus | "expired",
  NonNullable<BadgeProps["variant"]>
> = {
  pending: "warning",
  confirmed: "default",
  completed: "success",
  cancelled: "secondary",
  expired: "outline",
  no_show: "secondary",
};
