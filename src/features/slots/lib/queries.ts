import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import type { SlotListFilters } from "@/lib/validators/slot.schema";
import type {
  SlotFormResource,
  SlotFormVenue,
  SlotsListResult,
  SlotTemplate,
  SlotWithRelations,
} from "./types";
import {
  endOfMonth,
  endOfWeek,
  parseDateKey,
  startOfMonth,
  startOfWeek,
} from "./calendar";

function getCalendarRange(filters: SlotListFilters): { from: string; to: string } {
  const anchor = filters.date ? parseDateKey(filters.date) : new Date();

  if (filters.view === "day" || filters.view === "timeline") {
    const from = new Date(anchor);
    from.setHours(0, 0, 0, 0);
    const to = new Date(anchor);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  if (filters.view === "month") {
    return {
      from: startOfMonth(anchor).toISOString(),
      to: endOfMonth(anchor).toISOString(),
    };
  }

  if (filters.view === "week") {
    return {
      from: startOfWeek(anchor).toISOString(),
      to: endOfWeek(anchor).toISOString(),
    };
  }

  const from = filters.startDate
    ? parseDateKey(filters.startDate).toISOString()
    : startOfWeek(anchor).toISOString();
  const to = filters.endDate
    ? (() => {
        const d = parseDateKey(filters.endDate);
        d.setHours(23, 59, 59, 999);
        return d.toISOString();
      })()
    : endOfWeek(anchor).toISOString();

  return { from, to };
}

export async function listSlots(
  filters: SlotListFilters
): Promise<SlotsListResult> {
  const supabase = await createClient();
  const context = await getAuthContext();
  const tenantId = context?.activeTenant?.tenantId;

  if (!tenantId) {
    return {
      slots: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
    };
  }

  const range = getCalendarRange(filters);
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("slots")
    .select(
      `
      *,
      resource:resources ( id, name, sport_type ),
      venue:venues ( id, name )
    `,
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("start_time", range.from)
    .lte("start_time", range.to)
    .order("start_time", { ascending: true });

  if (filters.view === "list") {
    query = query.range(from, to);
  } else {
    query = query.limit(500);
  }

  if (filters.venueId) query = query.eq("venue_id", filters.venueId);
  if (filters.resourceId) query = query.eq("resource_id", filters.resourceId);
  if (filters.slotType) query = query.eq("slot_type", filters.slotType);
  if (filters.status) query = query.eq("status", filters.status);

  if (filters.search) {
    query = query.or(
      `block_reason.ilike.%${filters.search}%,metadata->>label.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    return {
      slots: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
    };
  }

  const slots: SlotWithRelations[] = (data ?? []).map((row) => {
    const { resource, venue, ...slot } = row as typeof row & {
      resource: SlotWithRelations["resource"];
      venue: SlotWithRelations["venue"];
    };
    return { ...slot, resource, venue };
  });

  const total = count ?? slots.length;

  return {
    slots,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages:
      filters.view === "list"
        ? Math.ceil(total / filters.pageSize) || 1
        : 1,
  };
}

export async function getSlotById(id: string): Promise<SlotWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("slots")
    .select(
      `
      *,
      resource:resources ( id, name, sport_type ),
      venue:venues ( id, name )
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!data) return null;
  const row = data as typeof data & {
    resource: SlotWithRelations["resource"];
    venue: SlotWithRelations["venue"];
  };
  return { ...row, resource: row.resource, venue: row.venue };
}

export async function listSlotTemplates(): Promise<SlotTemplate[]> {
  const context = await getAuthContext();
  if (!context?.activeTenant) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("slot_templates")
    .select("*")
    .eq("tenant_id", context.activeTenant.tenantId)
    .is("deleted_at", null)
    .order("name");

  return data ?? [];
}

export async function getSlotTemplateById(
  id: string
): Promise<SlotTemplate | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("slot_templates")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  return data;
}

export async function getVenuesForSlotForm(): Promise<SlotFormVenue[]> {
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

export async function getResourcesForSlotForm(
  venueId?: string
): Promise<SlotFormResource[]> {
  const context = await getAuthContext();
  if (!context?.activeTenant) return [];

  const supabase = await createClient();
  let query = supabase
    .from("resources")
    .select("id, name, venue_id, capacity")
    .eq("tenant_id", context.activeTenant.tenantId)
    .is("deleted_at", null)
    .eq("status", "active")
    .order("name");

  if (venueId) query = query.eq("venue_id", venueId);

  const { data } = await query;
  return data ?? [];
}

export function canViewSlots(_appRole: string): boolean {
  return true;
}

export function canManageSlots(appRole: string): boolean {
  return canManageOrganization(appRole as never);
}
