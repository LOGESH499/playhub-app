"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions/notification-center.actions";
import type { NotificationRecord } from "@/features/notifications/lib/types";
import { NotificationTypeBadge } from "@/features/notifications/components/notification-type-badge";
import { Button } from "@/components/ui/button";

interface NotificationCenterListProps {
  notifications: NotificationRecord[];
  unreadCount: number;
}

export function NotificationCenterList({
  notifications,
  unreadCount,
}: NotificationCenterListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const unreadOnly = searchParams.get("unreadOnly") === "true";

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {unreadOnly ? "No unread notifications." : "No notifications yet."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await markAllNotificationsReadAction();
                router.refresh();
              })
            }
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Mark all read
          </Button>
        )}
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`p-4 ${!n.readAt ? "bg-primary/5" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <NotificationTypeBadge type={n.type} />
                  {!n.readAt && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="font-medium">{n.title}</p>
                {n.body && (
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              {!n.readAt && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await markNotificationReadAction(n.id);
                      router.refresh();
                    })
                  }
                >
                  Mark read
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
