import type { BulkGenerateSlotsInput } from "@/lib/validators/slot.schema";
import { isPeakSlotTime, isWeekendDate } from "./pricing";
import { combineDateAndTime, parseDateKey, toDateKey } from "./calendar";

export interface GeneratedSlotWindow {
  startTime: string;
  endTime: string;
  slotType: "standard" | "peak" | "off_peak";
  pricePerSlot: number;
  isWeekend: boolean;
}

export interface BulkGenerationPlan {
  recurringGroupId: string;
  windows: GeneratedSlotWindow[];
}

function timeToMinutes(time: string): number {
  const normalized = time.length === 5 ? `${time}:00` : time;
  const [h, m] = normalized.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function shouldIncludeDay(
  cursor: Date,
  start: Date,
  input: BulkGenerateSlotsInput
): boolean {
  const dayOfWeek = cursor.getDay();

  if (input.recurrence === "daily") {
    return true;
  }

  if (input.recurrence === "monthly") {
    return cursor.getDate() === start.getDate();
  }

  if (input.daysOfWeek.length === 0) {
    return true;
  }

  return input.daysOfWeek.includes(dayOfWeek);
}

export function buildSlotGenerationPlan(
  input: BulkGenerateSlotsInput,
  defaultPrice = 500
): BulkGenerationPlan {
  const windows: GeneratedSlotWindow[] = [];
  const start = parseDateKey(input.startDate);
  const end = parseDateKey(input.endDate);
  const duration = input.slotDurationMinutes;
  const buffer = input.bufferMinutes;
  const peakPrice =
    input.peakPrice === "" || input.peakPrice === undefined
      ? defaultPrice
      : Number(input.peakPrice);
  const offPeakPrice =
    input.offPeakPrice === "" || input.offPeakPrice === undefined
      ? defaultPrice
      : Number(input.offPeakPrice);
  const dayStartMin = timeToMinutes(input.dailyStartTime);
  const dayEndMin = timeToMinutes(input.dailyEndTime);
  const recurringGroupId = crypto.randomUUID();
  const peakStart =
    input.peakStartTime && input.peakStartTime !== ""
      ? input.peakStartTime
      : "17:00";
  const peakEnd =
    input.peakEndTime && input.peakEndTime !== ""
      ? input.peakEndTime
      : "22:00";

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    if (!shouldIncludeDay(cursor, start, input)) {
      continue;
    }

    const dateKey = toDateKey(cursor);
    const weekend = isWeekendDate(cursor);
    let minute = dayStartMin;

    while (minute + duration <= dayEndMin) {
      const startTime = combineDateAndTime(dateKey, minutesToTime(minute));
      const endMinute = minute + duration;
      const endTime = combineDateAndTime(dateKey, minutesToTime(endMinute));
      const peak = isPeakSlotTime(startTime.toISOString(), peakStart, peakEnd);

      windows.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        slotType: peak ? "peak" : "off_peak",
        pricePerSlot: peak ? peakPrice : offPeakPrice,
        isWeekend: weekend,
      });

      minute = endMinute + buffer;
    }
  }

  return { recurringGroupId, windows };
}
