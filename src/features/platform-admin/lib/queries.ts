import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canAccessPlatformAdmin } from "@/lib/auth/roles";
import type {
  TenantListFilters,
  UserListFilters,
} from "@/lib/validators/platform.schema";
import type {
  AuditLogRow,
  FeatureFlag,
  HealthSnapshot,
  PlatformAnalytics,
  PlatformSetting,
  SupportTicket,
  TenantWithSubscription,
  TenantsListResult,
  UsersListResult,
} from "./types";

async function requirePlatformAdmin() {
  const context = await getAuthContext();
  if (!context || !canAccessPlatformAdmin(context.appRole)) {
    return null;
  }
  return context;
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics | null> {
  const context = await requirePlatformAdmin();
  if (!context) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_platform_analytics");
  if (error || !data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  return {
    tenants: Number(raw.tenants ?? 0),
    activeTenants: Number(raw.activeTenants ?? 0),
    suspendedTenants: Number(raw.suspendedTenants ?? 0),
    users: Number(raw.users ?? 0),
    platformAdmins: Number(raw.platformAdmins ?? 0),
    bookings: Number(raw.bookings ?? 0),
    bookingsThisMonth: Number(raw.bookingsThisMonth ?? 0),
    venues: Number(raw.venues ?? 0),
    subscriptionsByTier: (raw.subscriptionsByTier as PlatformAnalytics["subscriptionsByTier"]) ?? [],
    openSupportTickets: Number(raw.openSupportTickets ?? 0),
    generatedAt: String(raw.generatedAt ?? new Date().toISOString()),
  };
}

export async function listTenants(
  filters: TenantListFilters
): Promise<TenantsListResult> {
  const empty: TenantsListResult = {
    tenants: [],
    total: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: 0,
  };

  const context = await requirePlatformAdmin();
  if (!context) return empty;

  const supabase = await createClient();
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("tenants")
    .select(
      `
      id, name, slug, status, contact_email, created_at,
      subscription:tenant_subscriptions ( tier, status, seats_limit, venues_limit )
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query.range(from, to);
  if (error) return empty;

  const total = count ?? 0;
  return {
    tenants: (data ?? []).map((row) => {
      const sub = row.subscription as
        | { tier: string; status: string; seats_limit: number; venues_limit: number }
        | { tier: string; status: string; seats_limit: number; venues_limit: number }[]
        | null;
      const subscription = Array.isArray(sub) ? sub[0] ?? null : sub;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        contactEmail: row.contact_email,
        createdAt: row.created_at,
        subscription: subscription
          ? {
              tier: subscription.tier,
              status: subscription.status,
              seatsLimit: subscription.seats_limit,
              venuesLimit: subscription.venues_limit,
            }
          : null,
      };
    }),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 0,
  };
}

export async function getTenantById(
  id: string
): Promise<TenantWithSubscription | null> {
  const context = await requirePlatformAdmin();
  if (!context) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select(
      `
      id, name, slug, status, contact_email, created_at,
      subscription:tenant_subscriptions ( tier, status, seats_limit, venues_limit )
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;

  const sub = data.subscription as
    | { tier: string; status: string; seats_limit: number; venues_limit: number }
    | { tier: string; status: string; seats_limit: number; venues_limit: number }[]
    | null;
  const subscription = Array.isArray(sub) ? sub[0] ?? null : sub;

  const { count } = await supabase
    .from("tenant_members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", id)
    .eq("status", "active");

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    status: data.status,
    contactEmail: data.contact_email,
    createdAt: data.created_at,
    memberCount: count ?? 0,
    subscription: subscription
      ? {
          tier: subscription.tier,
          status: subscription.status,
          seatsLimit: subscription.seats_limit,
          venuesLimit: subscription.venues_limit,
        }
      : null,
  };
}

export async function listPlatformUsers(
  filters: UserListFilters
): Promise<UsersListResult> {
  const empty: UsersListResult = {
    users: [],
    total: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: 0,
  };

  const context = await requirePlatformAdmin();
  if (!context) return empty;

  const supabase = await createClient();
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, is_platform_admin, created_at", {
      count: "exact",
    })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.adminsOnly === "true") {
    query = query.eq("is_platform_admin", true);
  }
  if (filters.search) {
    query = query.or(
      `email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query.range(from, to);
  if (error) return empty;

  const total = count ?? 0;
  return {
    users: (data ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      isPlatformAdmin: u.is_platform_admin,
      createdAt: u.created_at,
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 0,
  };
}

export async function listAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const context = await requirePlatformAdmin();
  if (!context) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select(
      `
      id, tenant_id, actor_id, action, entity_type, entity_id, created_at,
      actor:profiles!audit_logs_actor_id_fkey ( full_name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const actor = row.actor as { full_name: string } | { full_name: string }[] | null;
    const actorName = Array.isArray(actor) ? actor[0]?.full_name : actor?.full_name;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      actorId: row.actor_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      createdAt: row.created_at,
      actorName,
    };
  });
}

export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  const context = await requirePlatformAdmin();
  if (!context) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("feature_flags")
    .select("key, enabled, description, rollout_percent, updated_at")
    .order("key");

  return (
    data?.map((f) => ({
      key: f.key,
      enabled: f.enabled,
      description: f.description,
      rolloutPercent: f.rollout_percent,
      updatedAt: f.updated_at,
    })) ?? []
  );
}

export async function listPlatformSettings(): Promise<PlatformSetting[]> {
  const context = await requirePlatformAdmin();
  if (!context) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value, description, updated_at")
    .order("key");

  return (
    data?.map((s) => ({
      key: s.key,
      value: (s.value as Record<string, unknown>) ?? {},
      description: s.description,
      updatedAt: s.updated_at,
    })) ?? []
  );
}

export async function listSupportTickets(): Promise<SupportTicket[]> {
  const context = await requirePlatformAdmin();
  if (!context) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select(
      `
      id, subject, body, status, priority, tenant_id, user_id,
      resolution_notes, created_at,
      user:profiles!support_tickets_user_id_fkey ( full_name ),
      tenant:tenants ( name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => {
    const user = row.user as { full_name: string } | { full_name: string }[] | null;
    const tenant = row.tenant as { name: string } | { name: string }[] | null;
    return {
      id: row.id,
      subject: row.subject,
      body: row.body,
      status: row.status,
      priority: row.priority,
      tenantId: row.tenant_id,
      userId: row.user_id,
      resolutionNotes: row.resolution_notes,
      createdAt: row.created_at,
      userName: Array.isArray(user) ? user[0]?.full_name : user?.full_name,
      tenantName: Array.isArray(tenant) ? tenant[0]?.name : tenant?.name,
    };
  });
}

export async function listHealthSnapshots(): Promise<HealthSnapshot[]> {
  const context = await requirePlatformAdmin();
  if (!context) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_health_snapshots")
    .select("id, metrics, created_at")
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    data?.map((s) => ({
      id: s.id,
      metrics: (s.metrics as Record<string, unknown>) ?? {},
      createdAt: s.created_at,
    })) ?? []
  );
}

export async function listSubscriptions(): Promise<TenantWithSubscription[]> {
  const result = await listTenants({
    page: 1,
    pageSize: 100,
  });
  return result.tenants;
}
