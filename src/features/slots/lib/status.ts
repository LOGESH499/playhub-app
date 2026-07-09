import type { SlotStatus, SlotType } from "@/lib/validators/slot.schema";

export const SLOT_STATUS_VARIANTS: Record<
  SlotStatus,
  "default" | "secondary" | "outline" | "success" | "warning"
> = {
  available: "success",
  blocked: "warning",
  booked: "default",
  maintenance: "secondary",
  cancelled: "outline",
};

export const SLOT_TYPE_COLORS: Record<SlotType, string> = {
  standard: "bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300",
  peak: "bg-orange-500/15 border-orange-500/40 text-orange-700 dark:text-orange-300",
  off_peak: "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  blocked: "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300",
  holiday: "bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300",
  maintenance: "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200",
};
