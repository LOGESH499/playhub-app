import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/roles";
import type { AnalyticsFilters } from "@/lib/validators/analytics.schema";
import { defaultAnalyticsRange } from "@/lib/validators/analytics.schema";
import type { EnterpriseAnalytics, AnalyticsWidget } from "./types";

const EMPTY_ANALYTICS: EnterpriseAnalytics = {
  summary: {
    totalRevenue: 0,
    totalRefunds: 0,
    totalBookings: 0,
    activeCustomers: 0,
    avgVenueUtilization: 0,
  },
  venueUtilization: [],
  revenueByMonth: [],
  bookingTrends: [],
  peakHours: [],
  sportsPopularity: [],
  academyReports: {
    programs: 0,
    batches: 0,
    activeEnrollments: 0,
    sessionsInRange: 0,
    attendanceRate: 0,
    feesCollected: 0,
  },
  coachReports: [],
  customerGrowth: [],
  generatedAt: new Date().toISOString(),
};

export function canViewAnalytics(appRole: string): boolean {
  return canManageOrganization(appRole as never);
}

function parseAnalytics(raw: unknown): EnterpriseAnalytics {
  if (!raw || typeof raw !== "object") return EMPTY_ANALYTICS;
  const data = raw as Record<string, unknown>;
  return {
    summary: (data.summary as EnterpriseAnalytics["summary"]) ?? EMPTY_ANALYTICS.summary,
    venueUtilization: (data.venueUtilization as EnterpriseAnalytics["venueUtilization"]) ?? [],
    revenueByMonth: (data.revenueByMonth as EnterpriseAnalytics["revenueByMonth"]) ?? [],
    bookingTrends: (data.bookingTrends as EnterpriseAnalytics["bookingTrends"]) ?? [],
    peakHours: (data.peakHours as EnterpriseAnalytics["peakHours"]) ?? [],
    sportsPopularity: (data.sportsPopularity as EnterpriseAnalytics["sportsPopularity"]) ?? [],
    academyReports:
      (data.academyReports as EnterpriseAnalytics["academyReports"]) ??
      EMPTY_ANALYTICS.academyReports,
    coachReports: (data.coachReports as EnterpriseAnalytics["coachReports"]) ?? [],
    customerGrowth: (data.customerGrowth as EnterpriseAnalytics["customerGrowth"]) ?? [],
    generatedAt: String(data.generatedAt ?? new Date().toISOString()),
  };
}

export async function getEnterpriseAnalytics(
  filters?: AnalyticsFilters
): Promise<EnterpriseAnalytics | null> {
  const context = await getAuthContext();
  if (!context?.activeTenant || !canManageOrganization(context.appRole)) {
    return null;
  }

  const range = defaultAnalyticsRange();
  const startDate = filters?.startDate ?? range.startDate;
  const endDate = filters?.endDate ?? range.endDate;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_enterprise_analytics", {
    p_tenant_id: context.activeTenant.tenantId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error || !data) return EMPTY_ANALYTICS;

  await supabase.from("analytics_snapshots").insert({
    tenant_id: context.activeTenant.tenantId,
    snapshot: data as object,
    period_start: startDate,
    period_end: endDate,
  });

  return parseAnalytics(data);
}

export function buildAnalyticsWidgets(
  analytics: EnterpriseAnalytics
): AnalyticsWidget[] {
  const net =
    Number(analytics.summary.totalRevenue) -
    Number(analytics.summary.totalRefunds);

  return [
    {
      id: "revenue",
      label: "Net revenue",
      value: `₹${net.toLocaleString("en-IN")}`,
      hint: "Payments minus refunds",
    },
    {
      id: "bookings",
      label: "Bookings",
      value: String(analytics.summary.totalBookings),
      hint: "In selected period",
    },
    {
      id: "utilization",
      label: "Avg utilization",
      value: `${analytics.summary.avgVenueUtilization}%`,
      hint: "Across venues",
    },
    {
      id: "customers",
      label: "Active customers",
      value: String(analytics.summary.activeCustomers),
      hint: "Unique bookers",
    },
  ];
}

export async function getAnalyticsWidgets(): Promise<AnalyticsWidget[]> {
  const analytics = await getEnterpriseAnalytics();
  if (!analytics) return [];
  return buildAnalyticsWidgets(analytics);
}
