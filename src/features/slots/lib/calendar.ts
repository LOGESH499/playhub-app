export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDates(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getMonthGridDates(anchor: Date): (Date | null)[][] {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export function combineDateAndTime(dateKey: string, time: string): Date {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const base = parseDateKey(dateKey);
  base.setHours(hours, minutes, 0, 0);
  return base;
}

export function formatTimeRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${pad2(s.getHours())}:${pad2(s.getMinutes())}–${pad2(e.getHours())}:${pad2(e.getMinutes())}`;
}

export function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export const TIMELINE_START_HOUR = 5;
export const TIMELINE_END_HOUR = 23;
export const TIMELINE_HEIGHT_PX = 720;

export function timeToTopPercent(iso: string): number {
  const d = new Date(iso);
  const startMinutes = TIMELINE_START_HOUR * 60;
  const totalMinutes = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
  const slotMinutes =
    (d.getHours() * 60 + d.getMinutes()) - startMinutes;
  return Math.max(0, Math.min(100, (slotMinutes / totalMinutes) * 100));
}

export function durationToHeightPercent(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const totalMinutes = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
  const duration = (end.getTime() - start.getTime()) / 60000;
  return Math.max(2, Math.min(100, (duration / totalMinutes) * 100));
}
