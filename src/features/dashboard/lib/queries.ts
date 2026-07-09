import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/session";
import {
  canManageOrganization,
  canAccessPlatformAdmin,
} from "@/lib/auth/roles";
import { formatCurrency } from "./format";
import type {
  ActivityItem,
  CalendarEvent,
  DashboardData,
  DashboardNotification,
  DashboardStat,
} from "./types";

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfToday(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function endOfMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function startOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function getVenueAdminStats(
  tenantId: string
): Promise<DashboardStat[]> {
  const supabase = await createClient();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();

  const [
    { count: todayBookings },
    { count: monthBookings },
    { count: venueCount },
    { data: revenueRows },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd)
      .is("deleted_at", null),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("start_time", monthStart)
      .lte("start_time", monthEnd)
      .is("deleted_at", null),
    supabase
      .from("venues")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("bookings")
      .select("amount")
      .eq("tenant_id", tenantId)
      .eq("payment_status", "paid")
      .gte("start_time", monthStart)
      .lte("start_time", monthEnd)
      .is("deleted_at", null),
  ]);

  const revenue =
    revenueRows?.reduce((sum, row) => sum + Number(row.amount ?? 0), 0) ?? 0;

  return [
    {
      id: "today-bookings",
      label: "Today's bookings",
      value: String(todayBookings ?? 0),
      description: "Slots booked for today",
    },
    {
      id: "month-bookings",
      label: "This month",
      value: String(monthBookings ?? 0),
      description: "Total bookings",
    },
    {
      id: "venues",
      label: "Venues",
      value: String(venueCount ?? 0),
      description: "Active locations",
    },
    {
      id: "revenue",
      label: "Revenue (MTD)",
      value: formatCurrency(revenue),
      description: "Paid bookings this month",
    },
  ];
}

async function getCustomerStats(
  userId: string,
  membershipCount: number
): Promise<DashboardStat[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [
    { count: upcoming },
    { count: completed },
    { count: unread },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("start_time", now)
      .in("status", ["pending", "confirmed"])
      .is("deleted_at", null),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .is("deleted_at", null),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
  ]);

  return [
    {
      id: "upcoming",
      label: "Upcoming",
      value: String(upcoming ?? 0),
      description: "Confirmed bookings",
    },
    {
      id: "completed",
      label: "Completed",
      value: String(completed ?? 0),
      description: "Past sessions",
    },
    {
      id: "notifications",
      label: "Unread",
      value: String(unread ?? 0),
      description: "Notifications",
    },
    {
      id: "organizations",
      label: "Organizations",
      value: String(membershipCount),
      description: "Memberships",
    },
  ];
}

async function getPlatformStats(): Promise<DashboardStat[]> {
  const supabase = await createClient();

  const [{ count: tenants }, { count: profiles }, { count: venues }] =
    await Promise.all([
      supabase
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("venues")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
    ]);

  return [
    {
      id: "tenants",
      label: "Organizations",
      value: String(tenants ?? 0),
      description: "Active tenants",
    },
    {
      id: "users",
      label: "Users",
      value: String(profiles ?? 0),
      description: "Registered profiles",
    },
    {
      id: "venues",
      label: "Venues",
      value: String(venues ?? 0),
      description: "Across platform",
    },
    {
      id: "status",
      label: "System",
      value: "Healthy",
      trend: "up",
      description: "All services operational",
    },
  ];
}

async function getRecentActivity(
  context: AuthContext
): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const tenantId = context.activeTenant?.tenantId;

  if (
    tenantId &&
    (canManageOrganization(context.appRole) ||
      context.appRole === "coach")
  ) {
    const { data: logs } = await supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(8);

    if (logs?.length) {
      return logs.map((log) => ({
        id: log.id,
        title: log.action.replaceAll("_", " "),
        description: log.entity_type,
        timestamp: log.created_at,
        type: "audit" as const,
      }));
    }
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, sport_type, status, start_time, created_at")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    bookings?.map((booking) => ({
      id: booking.id,
      title: `${booking.sport_type} booking`,
      description: `Status: ${booking.status}`,
      timestamp: booking.created_at,
      type: "booking" as const,
    })) ?? []
  );
}

async function getCalendarEvents(
  context: AuthContext
): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(now.getDate() - now.getDay());
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeStart.getDate() + 13);
  rangeEnd.setHours(23, 59, 59, 999);

  let query = supabase
    .from("bookings")
    .select("id, sport_type, status, start_time, end_time")
    .gte("start_time", rangeStart.toISOString())
    .lte("start_time", rangeEnd.toISOString())
    .in("status", ["pending", "confirmed"])
    .is("deleted_at", null)
    .order("start_time", { ascending: true })
    .limit(20);

  if (
    context.activeTenant &&
    canManageOrganization(context.appRole)
  ) {
    query = query.eq("tenant_id", context.activeTenant.tenantId);
  } else {
    query = query.eq("user_id", context.userId);
  }

  const { data } = await query;

  return (
    data?.map((booking) => ({
      id: booking.id,
      title: booking.sport_type,
      start: booking.start_time,
      end: booking.end_time,
      status: booking.status,
      sportType: booking.sport_type,
    })) ?? []
  );
}

async function getNotifications(
  userId: string
): Promise<DashboardNotification[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, type, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    data?.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      readAt: n.read_at,
      createdAt: n.created_at,
    })) ?? []
  );
}

export async function getNotificationSummary(userId: string) {
  const notifications = await getNotifications(userId);
  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.readAt).length,
  };
}

export async function getDashboardData(
  context: AuthContext
): Promise<DashboardData> {
  let stats: DashboardStat[];

  if (canAccessPlatformAdmin(context.appRole) && !context.activeTenant) {
    stats = await getPlatformStats();
  } else if (
    context.activeTenant &&
    canManageOrganization(context.appRole)
  ) {
    stats = await getVenueAdminStats(context.activeTenant.tenantId);
  } else {
    stats = await getCustomerStats(
      context.userId,
      context.memberships.length
    );
  }

  const [activity, calendarEvents, notifications] = await Promise.all([
    getRecentActivity(context),
    getCalendarEvents(context),
    getNotifications(context.userId),
  ]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return {
    stats,
    activity,
    calendarEvents,
    notifications,
    unreadCount,
  };
}
