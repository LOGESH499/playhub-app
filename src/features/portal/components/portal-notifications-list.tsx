"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/dashboard/actions/notification.actions";
import type { DashboardNotification } from "@/features/dashboard/lib/types";
import { Button } from "@/components/ui/button";

interface PortalNotificationsListProps {
  notifications: DashboardNotification[];
}

export function PortalNotificationsList({
  notifications,
}: PortalNotificationsListProps) {
  const [isPending, startTransition] = useTransition();

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  }

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No notifications yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={markAllRead}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Mark all read
        </Button>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`p-4 ${!n.readAt ? "bg-primary/5" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{n.title}</p>
                {n.body && (
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.readAt && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => markRead(n.id)}
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
