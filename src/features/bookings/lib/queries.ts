import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import type { BookingListFilters } from "@/lib/validators/booking.schema";
import type {
  BookableSlot,
  BookingStats,
  BookingsListResult,
  BookingWithRelations,
} from "./types";

export async function listBookings(
  filters: BookingListFilters
): Promise<BookingsListResult> {
  const supabase = await createClient();
  const context = await getAuthContext();

  if (!context) {
    return emptyResult(filters);
  }

  const isStaff =
    context.activeTenant &&
    canManageOrganization(context.appRole);

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("bookings")
    .select(
      `
      *,
      venue:venues ( id, name ),
      resource:resources ( id, name, sport_type ),
      user:profiles!bookings_user_id_fkey ( id, full_name ),
      slot:slots ( id, start_time, end_time, price_per_slot )
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("start_time", { ascending: false });

  if (isStaff && context.activeTenant) {
    query = query.eq("tenant_id", context.activeTenant.tenantId);
  } else {
    query = query.eq("user_id", context.userId);
  }

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.venueId) query = query.eq("venue_id", filters.venueId);
  if (filters.resourceId) query = query.eq("resource_id", filters.resourceId);
  if (filters.startDate) query = query.gte("start_time", filters.startDate);
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    query = query.lte("start_time", end.toISOString());
  }
  if (filters.search) {
    query = query.or(
      `confirmation_code.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    return emptyResult(filters);
  }

  const total = count ?? 0;
  return {
    bookings: (data ?? []) as BookingWithRelations[],
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 0,
  };
}

function emptyResult(filters: BookingListFilters): BookingsListResult {
  return {
    bookings: [],
    total: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: 0,
  };
}

export async function getBookingById(
  id: string
): Promise<BookingWithRelations | null> {
  const supabase = await createClient();
  const context = await getAuthContext();
  if (!context) return null;

  const { data } = await supabase
    .from("bookings")
    .select(
      `
      *,
      venue:venues ( id, name ),
      resource:resources ( id, name, sport_type ),
      user:profiles!bookings_user_id_fkey ( id, full_name ),
      slot:slots ( id, start_time, end_time, price_per_slot )
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;

  const isStaff =
    context.activeTenant &&
    canManageOrganization(context.appRole) &&
    data.tenant_id === context.activeTenant.tenantId;

  if (!isStaff && data.user_id !== context.userId) {
    return null;
  }

  return data as BookingWithRelations;
}

export async function listBookableSlots(filters: {
  venueId?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<BookableSlot[]> {
  const supabase = await createClient();
  const context = await getAuthContext();
  const tenantId = context?.activeTenant?.tenantId;
  if (!tenantId) return [];

  const start = filters.startDate ?? new Date().toISOString();
  const end =
    filters.endDate ??
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("slots")
    .select(
      `
      id,
      venue_id,
      resource_id,
      start_time,
      end_time,
      price_per_slot,
      duration_minutes,
      status,
      resource:resources ( id, name, sport_type ),
      venue:venues ( id, name )
    `
    )
    .eq("tenant_id", tenantId)
    .eq("status", "available")
    .is("deleted_at", null)
    .gte("start_time", start)
    .lte("start_time", end)
    .order("start_time", { ascending: true })
    .limit(200);

  if (filters.venueId) query = query.eq("venue_id", filters.venueId);
  if (filters.resourceId) query = query.eq("resource_id", filters.resourceId);

  const { data } = await query;
  return (data ?? []).map((row) => {
    const { resource, venue, ...slot } = row as typeof row & {
      resource: BookableSlot["resource"];
      venue: BookableSlot["venue"];
    };
    return { ...slot, resource, venue };
  });
}

export async function getBookingStats(): Promise<BookingStats> {
  const supabase = await createClient();
  const context = await getAuthContext();
  if (!context?.activeTenant || !canManageOrganization(context.appRole)) {
    return {
      total: 0,
      confirmed: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      revenue: 0,
    };
  }

  const tenantId = context.activeTenant.tenantId;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("bookings")
    .select("status, amount, payment_status")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("created_at", monthStart.toISOString());

  const rows = data ?? [];
  return {
    total: rows.length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    pending: rows.filter((r) => r.status === "pending").length,
    completed: rows.filter((r) => r.status === "completed").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
    revenue: rows
      .filter((r) => r.payment_status === "paid")
      .reduce((sum, r) => sum + Number(r.amount ?? 0), 0),
  };
}

export async function getVenuesForBookingForm() {
  const context = await getAuthContext();
  if (!context?.activeTenant) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("venues")
    .select("id, name")
    .eq("tenant_id", context.activeTenant.tenantId)
    .is("deleted_at", null)
    .eq("status", "active")
    .order("name");
  return data ?? [];
}

export async function getResourcesForBookingForm(venueId?: string) {
  const context = await getAuthContext();
  if (!context?.activeTenant) return [];
  const supabase = await createClient();
  let query = supabase
    .from("resources")
    .select("id, name, venue_id")
    .eq("tenant_id", context.activeTenant.tenantId)
    .is("deleted_at", null)
    .eq("status", "active")
    .order("name");
  if (venueId) query = query.eq("venue_id", venueId);
  const { data } = await query;
  return data ?? [];
}

export function canManageBookings(appRole: string): boolean {
  return canManageOrganization(appRole as never);
}

export function canViewBookings(): boolean {
  return true;
}
