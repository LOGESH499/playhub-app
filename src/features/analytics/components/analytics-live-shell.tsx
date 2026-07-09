"use client";

import type { ReactNode } from "react";
import { useAnalyticsRealtime } from "@/features/analytics/hooks/use-analytics-realtime";

interface AnalyticsLiveShellProps {
  tenantId?: string;
  children: ReactNode;
}

export function AnalyticsLiveShell({ tenantId, children }: AnalyticsLiveShellProps) {
  useAnalyticsRealtime(tenantId);
  return <>{children}</>;
}
