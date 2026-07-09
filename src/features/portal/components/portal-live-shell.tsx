"use client";

import type { ReactNode } from "react";
import { usePortalRealtime } from "@/features/portal/hooks/use-portal-realtime";

interface PortalLiveShellProps {
  userId: string;
  children: ReactNode;
}

export function PortalLiveShell({ userId, children }: PortalLiveShellProps) {
  usePortalRealtime(userId);
  return <>{children}</>;
}
