export type AnalyticsSummary = {
  totalRevenue: number;
  totalRefunds: number;
  totalBookings: number;
  activeCustomers: number;
  avgVenueUtilization: number;
};

export type VenueUtilizationRow = {
  venue_id: string;
  venue_name: string;
  total_slots: number;
  booked_slots: number;
  utilization_pct: number;
};

export type RevenueMonthRow = {
  month: string;
  revenue: number;
  refunds: number;
};

export type BookingTrendRow = {
  date: string;
  bookings: number;
  revenue: number;
};

export type PeakHourRow = {
  hour: number;
  bookings: number;
};

export type SportPopularityRow = {
  sport: string;
  bookings: number;
  revenue: number;
};

export type AcademyReportSummary = {
  programs: number;
  batches: number;
  activeEnrollments: number;
  sessionsInRange: number;
  attendanceRate: number;
  feesCollected: number;
};

export type CoachReportRow = {
  coach_id: string;
  coach_name: string;
  sessions: number;
  attendance_marked: number;
  present_count: number;
  attendance_rate: number;
};

export type CustomerGrowthRow = {
  month: string;
  new_customers: number;
};

export type EnterpriseAnalytics = {
  summary: AnalyticsSummary;
  venueUtilization: VenueUtilizationRow[];
  revenueByMonth: RevenueMonthRow[];
  bookingTrends: BookingTrendRow[];
  peakHours: PeakHourRow[];
  sportsPopularity: SportPopularityRow[];
  academyReports: AcademyReportSummary;
  coachReports: CoachReportRow[];
  customerGrowth: CustomerGrowthRow[];
  generatedAt: string;
};

export type AnalyticsWidget = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};
