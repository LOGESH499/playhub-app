"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  processEmailQueueAction,
  runReminderJobsAction,
} from "@/features/notifications/actions/notification-center.actions";
import type {
  NotificationBroadcast,
  NotificationEmailRecord,
} from "@/features/notifications/lib/types";
import { NotificationTypeBadge } from "@/features/notifications/components/notification-type-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminNotificationsPanelProps {
  broadcasts: NotificationBroadcast[];
  emailQueue: NotificationEmailRecord[];
}

export function AdminNotificationsPanel({
  broadcasts,
  emailQueue,
}: AdminNotificationsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await runReminderJobsAction();
              router.refresh();
            })
          }
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Run reminder jobs
        </Button>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await processEmailQueueAction();
              router.refresh();
            })
          }
        >
          Process email queue
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Broadcast history</h3>
        {broadcasts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No broadcasts yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {broadcasts.map((b) => (
              <li key={b.id} className="space-y-1 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <NotificationTypeBadge type={b.kind} />
                  <Badge variant="outline">{b.targetAudience}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {b.recipientsCount} recipients
                  </span>
                </div>
                <p className="font-medium">{b.title}</p>
                {b.body && (
                  <p className="text-sm text-muted-foreground">{b.body}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(b.createdAt).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Email queue</h3>
        {emailQueue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No emails queued.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailQueue.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">{e.recipientEmail}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {e.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.status}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
