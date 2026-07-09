import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canAccessPlatformAdmin, canManageOrganization } from "@/lib/auth/roles";
import type { SportListFilters } from "@/lib/validators/sports.schema";
import type { SportFormVenue, SportWithCategory, SportsListResult } from "./types";
import type { Sport, SportCategory } from "./types";

function getSportsTenantScope(
  isPlatformAdmin: boolean,
  activeTenantId: string | null | undefined
): string | null {
  if (activeTenantId) return activeTenantId;
  if (isPlatformAdmin) return null;
  return null;
}

export async function getSportCategories(): Promise<SportCategory[]> {
  const supabase = await createClient();
  const context = await getAuthContext();
  const tenantId = context?.activeTenant?.tenantId ?? null;

  let query = supabase
    .from("sport_categories")
    .select("*")
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  } else {
    query = query.is("tenant_id", null);
  }

  const { data } = await query;
  return data ?? [];
}

export async function listSports(
  filters: SportListFilters
): Promise<SportsListResult> {
  const supabase = await createClient();
  const context = await getAuthContext();

  const isPlatformAdmin = context
    ? canAccessPlatformAdmin(context.appRole)
    : false;
  const tenantId = getSportsTenantScope(
    isPlatformAdmin,
    context?.activeTenant?.tenantId
  );

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("sports")
    .select(
      `
      *,
      category:sport_categories ( id, name, slug )
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })
    .range(from, to);

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  } else if (!isPlatformAdmin) {
    query = query.is("tenant_id", null);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,resource_label.ilike.%${filters.search}%`
    );
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.featured) {
    query = query.eq("is_featured", true);
  }

  const { data, count, error } = await query;

  if (error) {
    return {
      sports: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
    };
  }

  const sports: SportWithCategory[] = (data ?? []).map((row) => {
    const { category, ...sport } = row as typeof row & {
      category: SportWithCategory["category"];
    };
    return { ...sport, category };
  });

  const total = count ?? 0;

  return {
    sports,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 1,
  };
}

export async function getSportById(id: string): Promise<SportWithCategory | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("sports")
    .select(
      `
      *,
      category:sport_categories ( id, name, slug )
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!data) return null;

  const row = data as typeof data & { category: SportWithCategory["category"] };
  return {
    ...row,
    category: row.category,
  };
}

export async function getVenuesForSportForm(
  sportId?: string
): Promise<SportFormVenue[]> {
  const context = await getAuthContext();
  if (!context?.activeTenant) return [];

  const supabase = await createClient();
  const tenantId = context.activeTenant.tenantId;

  const [{ data: venues }, { data: assignments }] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("name"),
    sportId
      ? supabase
          .from("venue_sports")
          .select("venue_id")
          .eq("sport_id", sportId)
          .eq("tenant_id", tenantId)
      : Promise.resolve({ data: [] as { venue_id: string }[] }),
  ]);

  const assignedIds = new Set(assignments?.map((a) => a.venue_id) ?? []);

  return (
    venues?.map((v) => ({
      id: v.id,
      name: v.name,
      assigned: assignedIds.has(v.id),
    })) ?? []
  );
}

export function canManageSports(appRole: string): boolean {
  return canManageOrganization(appRole as never) || canAccessPlatformAdmin(appRole as never);
}

export type { Sport };
