"use client";

import Link from "next/link";
import type { SlotWithRelations } from "@/features/slots/lib/types";
import {
  durationToHeightPercent,
  formatTimeRange,
  parseDateKey,
  timeToTopPercent,
  TIMELINE_END_HOUR,
  TIMELINE_HEIGHT_PX,
  TIMELINE_START_HOUR,
  toDateKey,
} from "@/features/slots/lib/calendar";
import { SLOT_TYPE_COLORS } from "@/features/slots/lib/status";
import { cn } from "@/lib/utils";

interface SlotDayTimelineProps {
  slots: SlotWithRelations[];
  anchorDate: string;
  canManage?: boolean;
  onSlotDragEnd?: (slotId: string, startTime: string, endTime: string) => void;
}

export function SlotDayTimeline({
  slots,
  anchorDate,
  canManage,
  onSlotDragEnd,
}: SlotDayTimelineProps) {
  const day = anchorDate ? parseDateKey(anchorDate) : new Date();
  const dayKey = toDateKey(day);
  const daySlots = slots.filter(
    (s) => toDateKey(new Date(s.start_time)) === dayKey
  );
  const hours = Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_, i) => TIMELINE_START_HOUR + i
  );

  function handleDrop(e: React.DragEvent) {
    if (!canManage || !onSlotDragEnd) return;
    e.preventDefault();
    const slotId = e.dataTransfer.getData("slotId");
    const duration = Number(e.dataTransfer.getData("durationMinutes"));
    if (!slotId || !duration) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const yRatio = (e.clientY - rect.top) / rect.height;
    const totalMinutes = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
    const startMinutes =
      TIMELINE_START_HOUR * 60 + Math.round(yRatio * totalMinutes);
    const start = new Date(day);
    start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    const end = new Date(start.getTime() + duration * 60000);
    onSlotDragEnd(slotId, start.toISOString(), end.toISOString());
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="border-b p-2 text-center text-sm font-medium">
        Daily timeline — {day.toLocaleDateString()}
      </div>
      <div className="grid grid-cols-[48px_1fr]">
        <div className="relative" style={{ height: TIMELINE_HEIGHT_PX }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-1 text-[10px] text-muted-foreground"
              style={{
                top: `${((h - TIMELINE_START_HOUR) / (TIMELINE_END_HOUR - TIMELINE_START_HOUR)) * 100}%`,
              }}
            >
              {h}:00
            </div>
          ))}
        </div>
        <div
          className="relative border-l bg-muted/10"
          style={{ height: TIMELINE_HEIGHT_PX }}
          onDragOver={(e) => canManage && e.preventDefault()}
          onDrop={handleDrop}
        >
          {daySlots.map((slot) => {
            const top = timeToTopPercent(slot.start_time);
            const height = durationToHeightPercent(slot.start_time, slot.end_time);
            const block = (
              <div
                draggable={canManage}
                onDragStart={(e) => {
                  e.dataTransfer.setData("slotId", slot.id);
                  e.dataTransfer.setData(
                    "durationMinutes",
                    String(slot.duration_minutes)
                  );
                }}
                className={cn(
                  "absolute left-1 right-1 overflow-hidden rounded border px-2 py-1 text-xs",
                  SLOT_TYPE_COLORS[slot.slot_type],
                  canManage && "cursor-grab active:cursor-grabbing"
                )}
                style={{ top: `${top}%`, height: `${height}%` }}
              >
                <div className="font-medium">{slot.resource?.name}</div>
                <div className="text-muted-foreground">
                  {formatTimeRange(slot.start_time, slot.end_time)} · ₹
                  {slot.price_per_slot}
                </div>
              </div>
            );
            return canManage ? (
              <Link key={slot.id} href={`/slots/${slot.id}/edit`}>
                {block}
              </Link>
            ) : (
              <div key={slot.id}>{block}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
