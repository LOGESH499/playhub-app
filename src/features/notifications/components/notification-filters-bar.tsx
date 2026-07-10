"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  NOTIFICATION_KINDS,
  NOTIFICATION_KIND_LABELS,
} from "@/lib/validators/notification.schema";
import { Button } from "@/components/ui/button";

export function NotificationFiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") ?? "";
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  function update(params: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    router.push(`/notifications?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={currentType}
        onChange={(e) => update({ type: e.target.value || null })}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">All types</option>
        {NOTIFICATION_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {NOTIFICATION_KIND_LABELS[kind]}
          </option>
        ))}
      </select>
      <Button
        variant={unreadOnly ? "default" : "outline"}
        size="sm"
        onClick={() =>
          update({ unreadOnly: unreadOnly ? null : "true" })
        }
      >
        Unread only
      </Button>
      {(currentType || unreadOnly) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/notifications")}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
