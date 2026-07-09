"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { enrollStudentAction } from "@/features/academies/actions/academy.actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface EnrollStudentPanelProps {
  batchId: string;
  canManage: boolean;
  members: Array<{ id: string; full_name: string; email: string }>;
}

export function EnrollStudentPanel({
  batchId,
  canManage,
  members,
}: EnrollStudentPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [studentId, setStudentId] = useState("");

  function enrollSelf() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await enrollStudentAction({ batchId });
      if (result.error) setError(result.error);
      else setSuccess(result.success ?? "Enrolled");
    });
  }

  function enrollStudent() {
    if (!studentId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await enrollStudentAction({ batchId, studentId });
      if (result.error) setError(result.error);
      else setSuccess(result.success ?? "Enrolled");
    });
  }

  return (
    <div className="surface-card space-y-4 p-5">
      <h3 className="font-semibold">Enrollment</h3>
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {!canManage && (
        <Button onClick={enrollSelf} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enroll myself
        </Button>
      )}

      {canManage && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 space-y-1">
            <label className="text-sm font-medium">Enroll student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.email})
                </option>
              ))}
            </select>
          </div>
          <Button onClick={enrollStudent} disabled={isPending || !studentId}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enroll
          </Button>
        </div>
      )}
    </div>
  );
}
