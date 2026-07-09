"use client";

import type { ReactNode } from "react";
import { useBookingsRealtime } from "@/features/bookings/hooks/use-bookings-realtime";

interface BookingsLiveShellProps {
  tenantId?: string;
  userId?: string;
  children: ReactNode;
}

export function BookingsLiveShell({
  tenantId,
  userId,
  children,
}: BookingsLiveShellProps) {
  useBookingsRealtime(tenantId, userId);
  return <>{children}</>;
}
