"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  assignCoachAction,
  removeCoachAction,
} from "@/features/academies/actions/academy.actions";
import type { BatchCoachRow } from "@/features/academies/lib/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CoachAllocationPanelProps {
  batchId: string;
  coaches: BatchCoachRow[];
  availableCoaches: Array<{ id: string; full_name: string; email: string }>;
  canManage: boolean;
}

export function CoachAllocationPanel({
  batchId,
  coaches,
  availableCoaches,
  canManage,
}: CoachAllocationPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [coachId, setCoachId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  function assign() {
    if (!coachId) return;
    setError(null);
    startTransition(async () => {
      const result = await assignCoachAction({ batchId, coachId, isPrimary });
      if (result.error) setError(result.error);
      else {
        setCoachId("");
        setIsPrimary(false);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await removeCoachAction(batchId, id);
    });
  }

  return (
    <div className="surface-card space-y-4 p-5">
      <h3 className="font-semibold">Coach allocation</h3>
      {error && <Alert variant="destructive">{error}</Alert>}

      <ul className="space-y-2">
        {coaches.length === 0 && (
          <p className="text-sm text-muted-foreground">No coaches assigned yet.</p>
        )}
        {coaches.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2"
          >
            <div>
              <p className="font-medium">{row.coach?.full_name ?? "Coach"}</p>
              <p className="text-xs text-muted-foreground">{row.coach?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {row.is_primary && <Badge variant="default">Primary</Badge>}
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => remove(row.coach_id)}
                >
                  Remove
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage && (
        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <div className="min-w-[200px] flex-1 space-y-1">
            <label className="text-sm font-medium">Assign coach</label>
            <select
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select coach</option>
              {availableCoaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Primary
          </label>
          <Button onClick={assign} disabled={isPending || !coachId}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Assign
          </Button>
        </div>
      )}
    </div>
  );
}
