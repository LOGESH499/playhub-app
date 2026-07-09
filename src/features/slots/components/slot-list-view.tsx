"use client";

import { useState } from "react";
import type { SlotFormResource, SlotFormVenue, SlotWithRelations } from "@/features/slots/lib/types";
import { SlotBulkPanel } from "@/features/slots/components/slot-bulk-panel";
import { SlotTable } from "@/features/slots/components/slot-table";

interface SlotListViewProps {
  slots: SlotWithRelations[];
  venues: SlotFormVenue[];
  resources: SlotFormResource[];
  canManage?: boolean;
}

export function SlotListView({
  slots,
  venues,
  resources,
  canManage,
}: SlotListViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleSlot(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selectedIds.length === slots.length) setSelectedIds([]);
    else setSelectedIds(slots.map((s) => s.id));
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <SlotBulkPanel
          venues={venues}
          resources={resources}
          selectedSlotIds={selectedIds}
        />
      )}
      <SlotTable
        slots={slots}
        canManage={canManage}
        selectedIds={canManage ? selectedIds : undefined}
        onToggleSlot={canManage ? toggleSlot : undefined}
        onToggleAll={canManage ? toggleAll : undefined}
      />
    </div>
  );
}
