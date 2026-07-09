import type { CourtImage, EquipmentItem } from "./types";

export function parseCourtImages(value: unknown): CourtImage[] {
  if (!Array.isArray(value)) return [];
  const parsed: CourtImage[] = [];
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

export function parseCourtEquipment(value: unknown): EquipmentItem[] {
  if (!Array.isArray(value)) return [];
  const parsed: EquipmentItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name : "";
    if (!name) continue;
    parsed.push({
      name,
      quantity: Number(row.quantity ?? 0),
      included: Boolean(row.included ?? true),
    });
  }
  return parsed;
}
