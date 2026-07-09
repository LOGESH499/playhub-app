"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import type { EnterpriseAnalytics } from "@/features/analytics/lib/types";
import { exportAnalytics } from "@/features/analytics/lib/export";
import type { ExportFormat, ExportSection } from "@/lib/validators/analytics.schema";
import { Button } from "@/components/ui/button";

const SECTIONS: { id: ExportSection; label: string }[] = [
  { id: "full", label: "Full report" },
  { id: "summary", label: "Summary" },
  { id: "venueUtilization", label: "Venue utilization" },
  { id: "revenue", label: "Revenue" },
  { id: "bookingTrends", label: "Booking trends" },
  { id: "peakHours", label: "Peak hours" },
  { id: "sportsPopularity", label: "Sports popularity" },
  { id: "academy", label: "Academy" },
  { id: "coaches", label: "Coaches" },
  { id: "customerGrowth", label: "Customer growth" },
];

interface AnalyticsExportBarProps {
  analytics: EnterpriseAnalytics;
}

export function AnalyticsExportBar({ analytics }: AnalyticsExportBarProps) {
  const [section, setSection] = useState<ExportSection>("full");
  const [busy, setBusy] = useState(false);

  async function handleExport(format: ExportFormat) {
    setBusy(true);
    try {
      await exportAnalytics(analytics, format, section);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <select
        value={section}
        onChange={(e) => setSection(e.target.value as ExportSection)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        {SECTIONS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => handleExport("csv")}
      >
        <FileText className="h-4 w-4" />
        CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => handleExport("xlsx")}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </Button>
      <Button size="sm" disabled={busy} onClick={() => handleExport("pdf")}>
        <Download className="h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}
