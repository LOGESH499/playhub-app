import type { VenueImage } from "./types";

export function parseVenueImages(value: unknown): VenueImage[] {
  if (!Array.isArray(value)) return [];
  const parsed: VenueImage[] = [];
  for (let index = 0; index < value.length; index++) {
    const item = value[index];
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const url = typeof row.url === "string" ? row.url : "";
    const path = typeof row.path === "string" ? row.path : "";
    if (!url || !path) continue;
    parsed.push({
      url,
      path,
      caption: typeof row.caption === "string" ? row.caption : undefined,
      sortOrder: Number(row.sortOrder ?? row.sort_order ?? index),
      isCover: Boolean(row.isCover ?? row.is_cover ?? index === 0),
    });
  }
  return parsed.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parseVenueAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
