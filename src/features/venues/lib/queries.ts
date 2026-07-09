import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import type { VenueListFilters } from "@/lib/validators/venue.schema";
import type { Venue, VenueDetail, VenuesListResult } from "./types";

export { parseVenueAmenities, parseVenueImages } from "./parse";

export async function listVenues(
  filters: VenueListFilters
): Promise<VenuesListResult> {
  const supabase = await createClient();
  const context = await getAuthContext();
  const tenantId = context?.activeTenant?.tenantId;

  if (!tenantId) {
    return {
      venues: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
    };
  }

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("venues")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .range(from, to);

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,city.ilike.%${filters.search}%,address_line1.ilike.%${filters.search}%`
    );
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    return {
      venues: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
    };
  }

  const total = count ?? 0;

  return {
    venues: (data ?? []) as Venue[],
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 1,
  };
}

export async function getVenueCities(): Promise<string[]> {
  const supabase = await createClient();
  const context = await getAuthContext();
  const tenantId = context?.activeTenant?.tenantId;
  if (!tenantId) return [];

  const { data } = await supabase
    .from("venues")
    .select("city")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("city");

  const cities = new Set<string>();
  for (const row of data ?? []) {
    if (row.city) cities.add(row.city);
  }
  return Array.from(cities);
}

export async function getVenueById(id: string): Promise<VenueDetail | null> {
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!venue) return null;

  const [
    { data: operatingHours },
    { data: holidays },
    { data: blackouts },
    { data: pricingRules },
  ] = await Promise.all([
    supabase
      .from("operating_hours")
      .select("*")
      .eq("venue_id", id)
      .is("resource_id", null)
      .order("day_of_week"),
    supabase
      .from("venue_holidays")
      .select("*")
      .eq("venue_id", id)
      .order("holiday_date"),
    supabase
      .from("blackout_periods")
      .select("*")
      .eq("venue_id", id)
      .is("resource_id", null)
      .order("start_time", { ascending: false }),
    supabase
      .from("pricing_rules")
      .select("*")
      .eq("venue_id", id)
      .is("resource_id", null)
      .order("priority", { ascending: true }),
  ]);

  return {
    ...(venue as Venue),
    operatingHours: operatingHours ?? [],
    holidays: holidays ?? [],
    blackouts: blackouts ?? [],
    pricingRules: pricingRules ?? [],
  };
}

export function canManageVenues(appRole: string): boolean {
  return canManageOrganization(appRole as never);
}
