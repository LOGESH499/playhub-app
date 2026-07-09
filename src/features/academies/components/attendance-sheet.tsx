"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { upsertAttendanceAction } from "@/features/academies/actions/academy.actions";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/validators/academy.schema";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AttendanceSheetProps {
  sessionId: string;
  students: Array<{ id: string; full_name: string }>;
  existing: Array<{ student_id: string; status: string }>;
}

const STATUSES = ["present", "absent", "late", "excused"] as const;

export function AttendanceSheet({
  sessionId,
  students,
  existing,
}: AttendanceSheetProps) {
  const initial = Object.fromEntries(
    students.map((s) => [
      s.id,
      existing.find((a) => a.student_id === s.id)?.status ?? "present",
    ])
  );
  const [statuses, setStatuses] = useState<Record<string, string>>(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSuccess(null);
    const records = students.map((s) => ({
      studentId: s.id,
      status: statuses[s.id] as (typeof STATUSES)[number],
    }));

    startTransition(async () => {
      const result = await upsertAttendanceAction({ sessionId, records });
      if (result.error) setError(result.error);
      else setSuccess(result.success ?? "Saved");
    });
  }

  return (
    <div className="surface-card space-y-4 p-5">
      <h3 className="font-semibold">Mark attendance</h3>
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <ul className="space-y-2">
        {students.map((student) => (
          <li
            key={student.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
          >
            <span className="font-medium">{student.full_name}</span>
            <select
              value={statuses[student.id]}
              onChange={(e) =>
                setStatuses((prev) => ({ ...prev, [student.id]: e.target.value }))
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ATTENDANCE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      <Button onClick={save} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save attendance
      </Button>
    </div>
  );
}
