import type { Venue } from "./types";

export const VENUE_STATUS_LABELS: Record<Venue["status"], string> = {
  draft: "Draft",
  active: "Active",
  inactive: "Inactive",
  maintenance: "Maintenance",
  archived: "Archived",
};

export const VENUE_STATUS_VARIANTS: Record<
  Venue["status"],
  "default" | "secondary" | "outline" | "success" | "warning"
> = {
  draft: "secondary",
  active: "success",
  inactive: "outline",
  maintenance: "warning",
  archived: "warning",
};
