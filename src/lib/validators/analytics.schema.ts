import { z } from "zod";

export const analyticsFiltersSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const exportFormatSchema = z.enum(["csv", "xlsx", "pdf"]);

export const exportSectionSchema = z.enum([
  "summary",
  "venueUtilization",
  "revenue",
  "bookingTrends",
  "peakHours",
  "sportsPopularity",
  "academy",
  "coaches",
  "customerGrowth",
  "full",
]);

export type AnalyticsFilters = z.infer<typeof analyticsFiltersSchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
export type ExportSection = z.infer<typeof exportSectionSchema>;

export function defaultAnalyticsRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}
