import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import type { CourtListFilters } from "@/lib/validators/court.schema";
import type {
  CourtDetail,
  CourtFormVenue,
  CourtsListResult,
  CourtWithVenue,
} from "./types";

export async function listCourts(
  filters: CourtListFilters
): Promise<CourtsListResult> {
  const supabase = await createClient();
  const context = await getAuthContext();
  const tenantId = context?.activeTenant?.tenantId;

  if (!tenantId) {
    return {
      courts: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
    };
  }

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("resources")
    .select(
      `
      *,
      venue:venues ( id, name, city )
    `,
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .range(from, to);

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,surface_type.ilike.%${filters.search}%,resource_subtype.ilike.%${filters.search}%`
    );
  }

  if (filters.venueId) {
    query = query.eq("venue_id", filters.venueId);
  }

  if (filters.sportType) {
    query = query.eq("sport_type", filters.sportType);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.isIndoor !== undefined) {
    query = query.eq("is_indoor", filters.isIndoor);
  }

  const { data, count, error } = await query;

  if (error) {
    return {
      courts: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
    };
  }

  const courts: CourtWithVenue[] = (data ?? []).map((row) => {
    const { venue, ...court } = row as typeof row & {
      venue: CourtWithVenue["venue"];
    };
    return { ...court, venue };
  });

  const total = count ?? 0;

  return {
    courts,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 1,
  };
}

export async function getCourtById(id: string): Promise<CourtDetail | null> {
  const supabase = await createClient();

  const { data: court } = await supabase
    .from("resources")
    .select(
      `
      *,
      venue:venues ( id, name, city )
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!court) return null;

  const row = court as typeof court & { venue: CourtDetail["venue"] };

  const [
    { data: operatingHours },
    { data: blackouts },
    { data: pricingRules },
  ] = await Promise.all([
    supabase
      .from("operating_hours")
      .select("*")
      .eq("resource_id", id)
      .order("day_of_week"),
    supabase
      .from("blackout_periods")
      .select("*")
      .eq("resource_id", id)
      .order("start_time", { ascending: false }),
    supabase
      .from("pricing_rules")
      .select("*")
      .eq("resource_id", id)
      .order("priority", { ascending: true }),
  ]);

  return {
    ...row,
    venue: row.venue,
    operatingHours: operatingHours ?? [],
    blackouts: blackouts ?? [],
    pricingRules: pricingRules ?? [],
  };
}

export async function getVenuesForCourtForm(): Promise<CourtFormVenue[]> {
  const context = await getAuthContext();
  if (!context?.activeTenant) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("venues")
    .select("id, name")
    .eq("tenant_id", context.activeTenant.tenantId)
    .is("deleted_at", null)
    .order("name");

  return data ?? [];
}

export function canManageCourts(appRole: string): boolean {
  return canManageOrganization(appRole as never);
}
