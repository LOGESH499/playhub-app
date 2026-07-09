import type { ResourceStatus } from "@/lib/validators/court.schema";

export const RESOURCE_STATUS_LABELS: Record<ResourceStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  inactive: "Inactive",
  archived: "Archived",
};

export const RESOURCE_STATUS_VARIANTS: Record<
  ResourceStatus,
  "default" | "secondary" | "outline" | "success" | "warning"
> = {
  active: "success",
  maintenance: "warning",
  inactive: "secondary",
  archived: "outline",
};
