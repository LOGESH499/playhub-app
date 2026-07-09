"use client";

import Link from "next/link";
import type { SlotWithRelations } from "@/features/slots/lib/types";
import {
  getMonthGridDates,
  parseDateKey,
  toDateKey,
} from "@/features/slots/lib/calendar";
import { SLOT_TYPE_COLORS } from "@/features/slots/lib/status";
import { cn } from "@/lib/utils";

interface SlotMonthCalendarProps {
  slots: SlotWithRelations[];
  anchorDate: string;
  canManage?: boolean;
}

export function SlotMonthCalendar({
  slots,
  anchorDate,
  canManage,
}: SlotMonthCalendarProps) {
  const anchor = anchorDate ? parseDateKey(anchorDate) : new Date();
  const grid = getMonthGridDates(anchor);
  const slotsByDay = new Map<string, SlotWithRelations[]>();

  for (const slot of slots) {
    const key = toDateKey(new Date(slot.start_time));
    const list = slotsByDay.get(key) ?? [];
    list.push(slot);
    slotsByDay.set(key, list);
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="grid min-w-[640px] grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="p-2">
            {d}
          </div>
        ))}
      </div>
      {grid.map((week, wi) => (
        <div key={wi} className="grid min-w-[640px] grid-cols-7 border-b last:border-b-0">
          {week.map((day, di) => {
            if (!day) {
              return <div key={di} className="min-h-24 bg-muted/20" />;
            }
            const key = toDateKey(day);
            const daySlots = slotsByDay.get(key) ?? [];
            const isToday = key === toDateKey(new Date());

            return (
              <div
                key={di}
                className={cn(
                  "min-h-24 border-r p-1 last:border-r-0",
                  isToday && "bg-primary/5"
                )}
              >
                <div className="mb-1 text-xs font-medium">{day.getDate()}</div>
                <div className="space-y-0.5">
                  {daySlots.slice(0, 3).map((slot) => (
                    <Link
                      key={slot.id}
                      href={canManage ? `/slots/${slot.id}/edit` : "#"}
                      className={cn(
                        "block truncate rounded border px-1 py-0.5 text-[10px]",
                        SLOT_TYPE_COLORS[slot.slot_type]
                      )}
                    >
                      {slot.resource?.name ?? "Slot"}
                    </Link>
                  ))}
                  {daySlots.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{daySlots.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
