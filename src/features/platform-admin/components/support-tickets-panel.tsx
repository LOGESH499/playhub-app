"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSupportTicketAction } from "@/features/platform-admin/actions/platform-admin.actions";
import type { SupportTicket } from "@/features/platform-admin/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SupportTicketsPanelProps {
  tickets: SupportTicket[];
}

export function SupportTicketsPanel({ tickets }: SupportTicketsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (tickets.length === 0) {
    return <p className="text-sm text-muted-foreground">No support tickets.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{ticket.priority}</Badge>
            <Badge variant={ticket.status === "open" ? "warning" : "secondary"}>
              {ticket.status}
            </Badge>
          </div>
          <p className="font-medium">{ticket.subject}</p>
          {ticket.body && (
            <p className="text-sm text-muted-foreground">{ticket.body}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {ticket.userName ?? "Unknown"} · {ticket.tenantName ?? "No org"} ·{" "}
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
          {ticket.status !== "resolved" && ticket.status !== "closed" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await updateSupportTicketAction({
                      ticketId: ticket.id,
                      status: "in_progress",
                    });
                    router.refresh();
                  })
                }
              >
                In progress
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await updateSupportTicketAction({
                      ticketId: ticket.id,
                      status: "resolved",
                      resolutionNotes: "Resolved by platform admin",
                    });
                    router.refresh();
                  })
                }
              >
                Resolve
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
