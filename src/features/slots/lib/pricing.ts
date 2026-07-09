import type { SupabaseClient } from "@supabase/supabase-js";

export interface PricingContext {
  tenantId: string;
  venueId: string;
  resourceId: string;
  sportType: string;
  startTime: string;
  peakPrice: number;
  offPeakPrice: number;
  isPeakWindow: boolean;
  isWeekend: boolean;
}

function timeToMinutes(time: string): number {
  const normalized = time.length === 5 ? `${time}:00` : time;
  const [h, m] = normalized.split(":").map(Number);
  return h * 60 + m;
}

export function isWeekendDate(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isPeakSlotTime(
  startTime: string,
  peakStart?: string | null,
  peakEnd?: string | null
): boolean {
  if (!peakStart || !peakEnd) return false;
  const d = new Date(startTime);
  const minutes = d.getHours() * 60 + d.getMinutes();
  return minutes >= timeToMinutes(peakStart) && minutes < timeToMinutes(peakEnd);
}

/**
 * Resolves slot price from venue/resource pricing_rules (Modules 6/7),
 * then falls back to peak/off-peak defaults from generation input.
 */
export async function resolveSlotPrice(
  supabase: SupabaseClient,
  ctx: PricingContext
): Promise<{ price: number; slotType: "standard" | "peak" | "off_peak" }> {
  const start = new Date(ctx.startTime);
  const dayOfWeek = start.getDay();
  const slotTime = `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}:00`;

  const { data: rules } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("is_active", true)
    .or(`venue_id.eq.${ctx.venueId},resource_id.eq.${ctx.resourceId}`)
    .order("priority", { ascending: false });

  for (const rule of rules ?? []) {
    if (rule.resource_id && rule.resource_id !== ctx.resourceId) continue;
    if (rule.venue_id && rule.venue_id !== ctx.venueId) continue;
    if (rule.sport_type && rule.sport_type !== ctx.sportType) continue;

    const days = (rule.day_of_week as number[]) ?? [];
    if (days.length > 0 && !days.includes(dayOfWeek)) continue;

    if (rule.start_time && rule.end_time) {
      if (
        slotTime < rule.start_time ||
        slotTime >= rule.end_time
      ) {
        continue;
      }
    }

    const nameLower = rule.name.toLowerCase();
    const slotType =
      nameLower.includes("peak") || ctx.isPeakWindow
        ? "peak"
        : nameLower.includes("off")
          ? "off_peak"
          : ctx.isPeakWindow
            ? "peak"
            : "off_peak";

    return {
      price: Number(rule.price_per_slot),
      slotType,
    };
  }

  const weekendMultiplier = ctx.isWeekend ? 1.1 : 1;
  if (ctx.isPeakWindow) {
    return {
      price: Math.round(ctx.peakPrice * weekendMultiplier * 100) / 100,
      slotType: "peak",
    };
  }

  return {
    price: Math.round(ctx.offPeakPrice * weekendMultiplier * 100) / 100,
    slotType: "off_peak",
  };
}
