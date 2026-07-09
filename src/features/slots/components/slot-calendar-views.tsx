"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { SlotWithRelations } from "@/features/slots/lib/types";
import { moveSlotAction } from "@/features/slots/actions/slot.actions";
import { SlotDayTimeline } from "@/features/slots/components/slot-day-timeline";
import { SlotMonthCalendar } from "@/features/slots/components/slot-month-calendar";
import { SlotResourceTimeline } from "@/features/slots/components/slot-resource-timeline";
import { SlotWeekTimeline } from "@/features/slots/components/slot-week-timeline";

interface SlotCalendarViewsProps {
  slots: SlotWithRelations[];
  view: "month" | "week" | "day" | "timeline";
  anchorDate: string;
  canManage?: boolean;
}

export function SlotCalendarViews({
  slots,
  view,
  anchorDate,
  canManage,
}: SlotCalendarViewsProps) {
  const [isPending, startTransition] = useTransition();

  function handleDragEnd(slotId: string, startTime: string, endTime: string) {
    startTransition(async () => {
      await moveSlotAction(slotId, startTime, endTime);
    });
  }

  if (view === "month") {
    return (
      <SlotMonthCalendar
        slots={slots}
        anchorDate={anchorDate}
        canManage={canManage}
      />
    );
  }

  if (view === "timeline") {
    return (
      <div className={isPending ? "opacity-60" : undefined}>
        <SlotResourceTimeline
          slots={slots}
          anchorDate={anchorDate}
          canManage={canManage}
          onSlotDragEnd={canManage ? handleDragEnd : undefined}
        />
      </div>
    );
  }

  if (view === "day") {
    return (
      <div className={isPending ? "opacity-60" : undefined}>
        <SlotDayTimeline
          slots={slots}
          anchorDate={anchorDate}
          canManage={canManage}
          onSlotDragEnd={canManage ? handleDragEnd : undefined}
        />
      </div>
    );
  }

  return (
    <div className={isPending ? "opacity-60" : undefined}>
      <SlotWeekTimeline
        slots={slots}
        anchorDate={anchorDate}
        canManage={canManage}
        onSlotDragEnd={canManage ? handleDragEnd : undefined}
      />
      {canManage && (
        <p className="mt-2 text-xs text-muted-foreground">
          Drag slots to reschedule.{" "}
          <Link href="/slots/new" className="underline">
            Create one-time slot
          </Link>
        </p>
      )}
    </div>
  );
}
