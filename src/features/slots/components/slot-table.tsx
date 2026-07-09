"use client";

import Link from "next/link";
import type { SlotWithRelations } from "@/features/slots/lib/types";
import {
  SLOT_STATUS_LABELS,
  SLOT_TYPE_LABELS,
} from "@/lib/validators/slot.schema";
import { formatTimeRange } from "@/features/slots/lib/calendar";
import { SLOT_STATUS_VARIANTS } from "@/features/slots/lib/status";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SlotTableProps {
  slots: SlotWithRelations[];
  canManage?: boolean;
  selectedIds?: string[];
  onToggleSlot?: (id: string) => void;
  onToggleAll?: () => void;
}

export function SlotTable({
  slots,
  canManage,
  selectedIds,
  onToggleSlot,
  onToggleAll,
}: SlotTableProps) {
  const showSelection = Boolean(canManage && selectedIds && onToggleSlot && onToggleAll);
  const allSelected = showSelection && selectedIds!.length === slots.length && slots.length > 0;

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {showSelection && (
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleAll!()}
                  aria-label="Select all slots"
                  className="h-4 w-4 rounded border-input"
                />
              </th>
            )}
            <th className="p-4 font-medium">Time</th>
            <th className="p-4 font-medium">Venue</th>
            <th className="p-4 font-medium">Resource</th>
            <th className="p-4 font-medium">Type</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot.id} className="border-b last:border-0">
              {showSelection && (
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds!.includes(slot.id)}
                    onChange={() => onToggleSlot!(slot.id)}
                    aria-label={`Select slot ${slot.id}`}
                    className="h-4 w-4 rounded border-input"
                  />
                </td>
              )}
              <td className="p-4">
                {canManage ? (
                  <Link href={`/slots/${slot.id}/edit`} className="hover:underline">
                    {formatTimeRange(slot.start_time, slot.end_time)}
                  </Link>
                ) : (
                  formatTimeRange(slot.start_time, slot.end_time)
                )}
              </td>
              <td className="p-4">{slot.venue?.name ?? "—"}</td>
              <td className="p-4">{slot.resource?.name ?? "—"}</td>
              <td className="p-4">{SLOT_TYPE_LABELS[slot.slot_type]}</td>
              <td className="p-4">
                <Badge variant={SLOT_STATUS_VARIANTS[slot.status]}>
                  {SLOT_STATUS_LABELS[slot.status]}
                </Badge>
              </td>
              <td className="p-4">₹{slot.price_per_slot}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
