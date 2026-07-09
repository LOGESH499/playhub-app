import type { Enums } from "@/types/database.types";

export type TenantRole = Enums<"tenant_role">;

/** User-facing roles for UI and authorization checks */
export type AppRole = "super_admin" | "venue_admin" | "coach" | "customer";

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  venue_admin: "Venue Admin",
  coach: "Coach",
  customer: "Customer",
};

const VENUE_ADMIN_ROLES: TenantRole[] = ["owner", "admin", "manager", "staff"];

/**
 * Maps database profile + tenant membership to a simplified app role.
 *
 * - Super Admin: platform flag on profile
 * - Venue Admin: owner, admin, manager, staff
 * - Coach: coach assignment
 * - Customer: member or no organization (player)
 */
export function resolveAppRole(
  isPlatformAdmin: boolean,
  tenantRole: TenantRole | null | undefined
): AppRole {
  if (isPlatformAdmin) {
    return "super_admin";
  }

  if (!tenantRole) {
    return "customer";
  }

  if (tenantRole === "coach") {
    return "coach";
  }

  if (VENUE_ADMIN_ROLES.includes(tenantRole)) {
    return "venue_admin";
  }

  return "customer";
}

export function canAccessPlatformAdmin(appRole: AppRole): boolean {
  return appRole === "super_admin";
}

export function canManageOrganization(appRole: AppRole): boolean {
  return appRole === "super_admin" || appRole === "venue_admin";
}

export function canManageAcademy(appRole: AppRole): boolean {
  return (
    appRole === "super_admin" ||
    appRole === "venue_admin" ||
    appRole === "coach"
  );
}
