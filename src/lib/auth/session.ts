import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ACTIVE_TENANT_COOKIE } from "@/lib/auth/constants";
import { resolveAppRole, type AppRole } from "@/lib/auth/roles";
import type { Tables } from "@/types/database.types";
import type { Enums } from "@/types/database.types";

export type Profile = Tables<"profiles">;
export type Tenant = Tables<"tenants">;

export interface TenantMembership {
  id: string;
  tenantId: string;
  role: Enums<"tenant_role">;
  status: Enums<"member_status">;
  tenant: Pick<Tenant, "id" | "name" | "slug" | "logo_url" | "status">;
}

export interface AuthContext {
  userId: string;
  email: string;
  profile: Profile;
  appRole: AppRole;
  memberships: TenantMembership[];
  activeTenant: TenantMembership | null;
  isEmailVerified: boolean;
}

export async function getUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    return profile;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    full_name:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "User",
    phone: (user.user_metadata?.phone as string | undefined) ?? null,
    avatar_url: null,
    date_of_birth: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    is_platform_admin: false,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };
}

export async function getTenantMemberships(
  userId: string
): Promise<TenantMembership[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenant_members")
    .select(
      `
      id,
      tenant_id,
      role,
      status,
      tenants (
        id,
        name,
        slug,
        logo_url,
        status
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "active");

  if (error || !data) {
    return [];
  }

  return data
    .filter((row) => row.tenants)
    .map((row) => {
      const tenant = row.tenants as unknown as TenantMembership["tenant"];
      return {
        id: row.id,
        tenantId: row.tenant_id,
        role: row.role,
        status: row.status,
        tenant,
      };
    });
}

export async function getActiveTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const user = await getUser();
  if (!user) return null;

  const profile = await getProfile();
  if (!profile) return null;

  const memberships = await getTenantMemberships(user.id);
  const activeTenantId = await getActiveTenantId();

  const activeTenant =
    memberships.find((m) => m.tenantId === activeTenantId) ??
    memberships[0] ??
    null;

  const appRole = resolveAppRole(
    profile.is_platform_admin,
    activeTenant?.role
  );

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile,
    appRole,
    memberships,
    activeTenant,
    isEmailVerified: Boolean(user.email_confirmed_at),
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    throw new Error("Unauthorized");
  }
  return context;
}
