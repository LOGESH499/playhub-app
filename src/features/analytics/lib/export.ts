import type { EnterpriseAnalytics } from "./types";
import type { ExportFormat, ExportSection } from "@/lib/validators/analytics.schema";

type ExportRow = Record<string, string | number>;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function rowsToCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? "");
          return val.includes(",") ? `"${val.replace(/"/g, '""')}"` : val;
        })
        .join(",")
    ),
  ];
  return "\uFEFF" + lines.join("\n");
}

function sectionRows(
  analytics: EnterpriseAnalytics,
  section: ExportSection
): ExportRow[] {
  switch (section) {
    case "summary":
      return [
        {
          metric: "Net revenue",
          value:
            Number(analytics.summary.totalRevenue) -
            Number(analytics.summary.totalRefunds),
        },
        { metric: "Total bookings", value: analytics.summary.totalBookings },
        {
          metric: "Active customers",
          value: analytics.summary.activeCustomers,
        },
        {
          metric: "Avg venue utilization %",
          value: analytics.summary.avgVenueUtilization,
        },
      ];
    case "venueUtilization":
      return analytics.venueUtilization.map((v) => ({
        venue: v.venue_name,
        total_slots: v.total_slots,
        booked_slots: v.booked_slots,
        utilization_pct: v.utilization_pct,
      }));
    case "revenue":
      return analytics.revenueByMonth.map((r) => ({
        month: r.month,
        revenue: r.revenue,
        refunds: r.refunds,
        net: Number(r.revenue) - Number(r.refunds),
      }));
    case "bookingTrends":
      return analytics.bookingTrends.map((b) => ({
        date: b.date,
        bookings: b.bookings,
        revenue: b.revenue,
      }));
    case "peakHours":
      return analytics.peakHours.map((p) => ({
        hour: `${p.hour}:00`,
        bookings: p.bookings,
      }));
    case "sportsPopularity":
      return analytics.sportsPopularity.map((s) => ({
        sport: s.sport,
        bookings: s.bookings,
        revenue: s.revenue,
      }));
    case "academy":
      return [
        { metric: "Programs", value: analytics.academyReports.programs },
        { metric: "Batches", value: analytics.academyReports.batches },
        {
          metric: "Active enrollments",
          value: analytics.academyReports.activeEnrollments,
        },
        {
          metric: "Sessions in range",
          value: analytics.academyReports.sessionsInRange,
        },
        {
          metric: "Attendance rate %",
          value: analytics.academyReports.attendanceRate,
        },
        {
          metric: "Fees collected",
          value: analytics.academyReports.feesCollected,
        },
      ];
    case "coaches":
      return analytics.coachReports.map((c) => ({
        coach: c.coach_name,
        sessions: c.sessions,
        attendance_marked: c.attendance_marked,
        present_count: c.present_count,
        attendance_rate: c.attendance_rate,
      }));
    case "customerGrowth":
      return analytics.customerGrowth.map((c) => ({
        month: c.month,
        new_customers: c.new_customers,
      }));
    case "full":
      return [
        ...sectionRows(analytics, "summary"),
        ...sectionRows(analytics, "venueUtilization"),
        ...sectionRows(analytics, "revenue"),
        ...sectionRows(analytics, "bookingTrends"),
        ...sectionRows(analytics, "peakHours"),
        ...sectionRows(analytics, "sportsPopularity"),
        ...sectionRows(analytics, "academy"),
        ...sectionRows(analytics, "coaches"),
        ...sectionRows(analytics, "customerGrowth"),
      ];
    default:
      return [];
  }
}

export async function exportAnalytics(
  analytics: EnterpriseAnalytics,
  format: ExportFormat,
  section: ExportSection
) {
  const rows = sectionRows(analytics, section);
  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = `playhub-analytics-${section}-${stamp}`;

  if (format === "csv") {
    const csv = rowsToCsv(rows);
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${baseName}.csv`
    );
    return;
  }

  if (format === "xlsx") {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, section.slice(0, 31));
    const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
    downloadBlob(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${baseName}.xlsx`
    );
    return;
  }

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`PLAYHUB Analytics — ${section}`, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date(analytics.generatedAt).toLocaleString()}`, 14, 22);

  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: rows.map((row) => headers.map((h) => String(row[h] ?? ""))),
      styles: { fontSize: 8 },
    });
  }

  doc.save(`${baseName}.pdf`);
}
