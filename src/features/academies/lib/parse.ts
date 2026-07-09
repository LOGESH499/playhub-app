import type { BatchSchedule } from "@/lib/validators/academy.schema";

export function parseBatchSchedule(value: unknown): BatchSchedule {
  if (!value || typeof value !== "object") {
    return { days: ["mon"], start: "09:00", end: "10:00" };
  }
  const obj = value as Record<string, unknown>;
  const days = Array.isArray(obj.days)
    ? (obj.days as string[]).filter((d) =>
        ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(d)
      )
    : ["mon"];
  return {
    days: days.length > 0 ? (days as BatchSchedule["days"]) : ["mon"],
    start: typeof obj.start === "string" ? obj.start : "09:00",
    end: typeof obj.end === "string" ? obj.end : "10:00",
  };
}

export function formatScheduleSummary(schedule: BatchSchedule): string {
  const dayLabels = schedule.days.map((d) => d.slice(0, 3).toUpperCase());
  return `${dayLabels.join(", ")} · ${schedule.start}–${schedule.end}`;
}

export function parseProgramImages(value: unknown): Array<{
  url: string;
  path: string;
  caption?: string;
  sortOrder: number;
  isCover: boolean;
}> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object" && "url" in item)
    .map((item, index) => {
      const row = item as Record<string, unknown>;
      return {
        url: String(row.url),
        path: String(row.path ?? ""),
        caption: row.caption ? String(row.caption) : undefined,
        sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : index,
        isCover: Boolean(row.isCover),
      };
    });
}

export function slugifyAcademyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
