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

interface SlotResourceTimelineProps {
  slots: SlotWithRelations[];
  anchorDate: string;
  canManage?: boolean;
  onSlotDragEnd?: (slotId: string, startTime: string, endTime: string) => void;
}

export function SlotResourceTimeline({
  slots,
  anchorDate,
  canManage,
  onSlotDragEnd,
}: SlotResourceTimelineProps) {
  const day = anchorDate ? parseDateKey(anchorDate) : new Date();
  const dayKey = toDateKey(day);
  const daySlots = slots.filter(
    (s) => toDateKey(new Date(s.start_time)) === dayKey
  );

  const resources = Array.from(
    new Map(
      daySlots.map((s) => [
        s.resource_id,
        { id: s.resource_id, name: s.resource?.name ?? "Resource" },
      ])
    ).values()
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

  if (resources.length === 0) {
    return (
      <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No slots on this day. Select another date or generate slots.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div
        className="grid border-b"
        style={{
          gridTemplateColumns: `48px repeat(${resources.length}, minmax(140px, 1fr))`,
        }}
      >
        <div />
        {resources.map((r) => (
          <div key={r.id} className="border-l p-2 text-center text-xs font-medium">
            {r.name}
          </div>
        ))}
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `48px repeat(${resources.length}, minmax(140px, 1fr))`,
        }}
      >
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
        {resources.map((resource) => {
          const resourceSlots = daySlots.filter(
            (s) => s.resource_id === resource.id
          );
          return (
            <div
              key={resource.id}
              className="relative border-l bg-muted/10"
              style={{ height: TIMELINE_HEIGHT_PX }}
              onDragOver={(e) => canManage && e.preventDefault()}
              onDrop={(e) => handleDrop(e)}
            >
              {resourceSlots.map((slot) => {
                const top = timeToTopPercent(slot.start_time);
                const height = durationToHeightPercent(
                  slot.start_time,
                  slot.end_time
                );
                const content = (
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
                      "absolute left-0.5 right-0.5 overflow-hidden rounded border px-1 py-0.5 text-[10px]",
                      SLOT_TYPE_COLORS[slot.slot_type],
                      canManage && "cursor-grab active:cursor-grabbing"
                    )}
                    style={{ top: `${top}%`, height: `${height}%` }}
                    title={formatTimeRange(slot.start_time, slot.end_time)}
                  >
                    {formatTimeRange(slot.start_time, slot.end_time)}
                    <div>₹{slot.price_per_slot}</div>
                  </div>
                );

                return canManage ? (
                  <Link key={slot.id} href={`/slots/${slot.id}/edit`}>
                    {content}
                  </Link>
                ) : (
                  <div key={slot.id}>{content}</div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
