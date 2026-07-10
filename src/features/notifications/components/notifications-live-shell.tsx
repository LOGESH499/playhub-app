"use client";

import type { ReactNode } from "react";
import { useNotificationsRealtime } from "@/features/notifications/hooks/use-notifications-realtime";

interface NotificationsLiveShellProps {
  userId: string;
  children: ReactNode;
}

export function NotificationsLiveShell({
  userId,
  children,
}: NotificationsLiveShellProps) {
  useNotificationsRealtime(userId);
  return <>{children}</>;
}
