"use client";

import type { ReactNode } from "react";
import { useSlotsRealtime } from "@/features/slots/hooks/use-slots-realtime";
import type { SlotFormResource, SlotFormVenue } from "@/features/slots/lib/types";
import { SlotBulkPanel } from "@/features/slots/components/slot-bulk-panel";

interface SlotsLiveShellProps {
  tenantId: string;
  venues: SlotFormVenue[];
  resources: SlotFormResource[];
  canManage?: boolean;
  showBulkPanel?: boolean;
  children: ReactNode;
}

export function SlotsLiveShell({
  tenantId,
  venues,
  resources,
  canManage,
  showBulkPanel = true,
  children,
}: SlotsLiveShellProps) {
  useSlotsRealtime(tenantId);

  return (
    <div className="space-y-6">
      {canManage && showBulkPanel && (
        <SlotBulkPanel venues={venues} resources={resources} />
      )}
      {children}
    </div>
  );
}
