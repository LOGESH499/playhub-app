"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordHealthSnapshotAction } from "@/features/platform-admin/actions/platform-admin.actions";
import type { HealthSnapshot } from "@/features/platform-admin/lib/types";
import { Button } from "@/components/ui/button";

interface MonitoringPanelProps {
  snapshots: HealthSnapshot[];
}

export function MonitoringPanel({ snapshots }: MonitoringPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const latest = snapshots[0];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await recordHealthSnapshotAction();
              router.refresh();
            })
          }
        >
          Record health snapshot
        </Button>
      </div>

      {latest ? (
        <div className="surface-card grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(latest.metrics).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs text-muted-foreground">
                {key.replaceAll("_", " ")}
              </p>
              <p className="text-lg font-semibold">{String(value)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No snapshots yet. Record one to start monitoring.
        </p>
      )}

      {snapshots.length > 1 && (
        <div className="space-y-2">
          <h3 className="font-semibold">History</h3>
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            {snapshots.slice(1, 10).map((s) => (
              <li key={s.id} className="flex justify-between p-3">
                <span>{new Date(s.createdAt).toLocaleString()}</span>
                <span className="text-muted-foreground">
                  pending emails: {String(s.metrics.pending_emails ?? "—")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
