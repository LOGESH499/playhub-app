"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { sendBroadcastAction } from "@/features/notifications/actions/notification-center.actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BroadcastForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="surface-card space-y-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await sendBroadcastAction({
            kind: String(fd.get("kind")) as "announcement" | "maintenance" | "broadcast",
            title: String(fd.get("title")),
            body: String(fd.get("body") ?? ""),
            targetAudience: String(fd.get("targetAudience")) as "all" | "members" | "staff",
          });
          if (result.error) setError(result.error);
          else {
            setSuccess(result.success ?? "Sent");
            e.currentTarget.reset();
          }
        });
      }}
    >
      <h3 className="font-semibold">Admin broadcast</h3>
      <p className="text-sm text-muted-foreground">
        Send announcements, maintenance alerts, or general broadcasts to your
        organization.
      </p>
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="kind">Type</Label>
          <select
            id="kind"
            name="kind"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="announcement"
          >
            <option value="announcement">Announcement</option>
            <option value="maintenance">Maintenance alert</option>
            <option value="broadcast">General broadcast</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="targetAudience">Audience</Label>
          <select
            id="targetAudience"
            name="targetAudience"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue="all"
          >
            <option value="all">Everyone</option>
            <option value="members">Members only</option>
            <option value="staff">Staff & coaches</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={120} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="body">Message</Label>
        <textarea
          id="body"
          name="body"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={2000}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Send broadcast
      </Button>
    </form>
  );
}
