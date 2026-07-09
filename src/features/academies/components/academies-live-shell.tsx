"use client";

import type { ReactNode } from "react";
import { useAttendanceRealtime } from "@/features/academies/hooks/use-attendance-realtime";

interface AcademiesLiveShellProps {
  tenantId?: string;
  children: ReactNode;
}

export function AcademiesLiveShell({
  tenantId,
  children,
}: AcademiesLiveShellProps) {
  useAttendanceRealtime(tenantId);
  return <>{children}</>;
}
