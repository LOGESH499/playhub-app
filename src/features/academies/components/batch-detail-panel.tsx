"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  generateFeesAction,
  generateSessionsAction,
  recordFeePaymentAction,
  updateProgressAction,
} from "@/features/academies/actions/academy.actions";
import { formatScheduleSummary, parseBatchSchedule } from "@/features/academies/lib/parse";
import { ENROLLMENT_STATUS_VARIANTS } from "@/features/academies/lib/status";
import type {
  BatchWithRelations,
  EnrollmentWithStudent,
  FeeRecordRow,
  SessionWithBatch,
} from "@/features/academies/lib/types";
import {
  ENROLLMENT_STATUS_LABELS,
  FEE_STATUS_LABELS,
} from "@/lib/validators/academy.schema";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoachAllocationPanel } from "./coach-allocation-panel";
import { EnrollStudentPanel } from "./enroll-student-panel";

interface BatchDetailPanelProps {
  batch: BatchWithRelations;
  enrollments: EnrollmentWithStudent[];
  sessions: SessionWithBatch[];
  fees: FeeRecordRow[];
  coaches: Array<{ id: string; full_name: string; email: string }>;
  members: Array<{ id: string; full_name: string; email: string }>;
  programId: string;
  canManage: boolean;
  canCoach: boolean;
}

export function BatchDetailPanel({
  batch,
  enrollments,
  sessions,
  fees,
  coaches,
  members,
  programId,
  canManage,
  canCoach,
}: BatchDetailPanelProps) {
  const schedule = parseBatchSchedule(batch.schedule);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generateSessions() {
    startTransition(async () => {
      const result = await generateSessionsAction({ batchId: batch.id });
      if (result.error) setError(result.error);
      else setMessage(result.success ?? "Sessions generated");
    });
  }

  function generateFees() {
    const label = new Date().toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
    startTransition(async () => {
      const result = await generateFeesAction({
        batchId: batch.id,
        periodLabel: label,
      });
      if (result.error) setError(result.error);
      else setMessage(result.success ?? "Fees generated");
    });
  }

  return (
    <div className="space-y-6">
      <div className="surface-card space-y-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{batch.name}</h2>
            <p className="text-sm text-muted-foreground">
              {formatScheduleSummary(schedule)} · Capacity {batch.enrollment_count}/
              {batch.capacity}
            </p>
          </div>
          {batch.fee_amount != null && (
            <Badge variant="outline">
              ₹{Number(batch.fee_amount).toLocaleString()} / {batch.fee_period}
            </Badge>
          )}
        </div>
        {(canManage || canCoach) && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={generateSessions} disabled={isPending}>
              Generate sessions
            </Button>
            {canManage && batch.fee_amount != null && (
              <Button variant="outline" size="sm" onClick={generateFees} disabled={isPending}>
                Generate fees
              </Button>
            )}
          </div>
        )}
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="destructive">{error}</Alert>}
      </div>

      <CoachAllocationPanel
        batchId={batch.id}
        coaches={batch.coaches ?? []}
        availableCoaches={coaches}
        canManage={canManage}
      />

      <EnrollStudentPanel batchId={batch.id} canManage={canManage} members={members} />

      <div className="surface-card space-y-3 p-5">
        <h3 className="font-semibold">Students & progress</h3>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enrollments yet.</p>
        ) : (
          <ul className="space-y-3">
            {enrollments.map((e) => (
              <li key={e.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{e.student?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{e.student?.email}</p>
                  </div>
                  <Badge variant={ENROLLMENT_STATUS_VARIANTS[e.status]}>
                    {ENROLLMENT_STATUS_LABELS[e.status]}
                  </Badge>
                </div>
                {e.progress && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Progress: {e.progress.completion_percent}% · Attendance:{" "}
                    {e.progress.attendance_rate ?? "—"}%
                  </p>
                )}
                {(canManage || canCoach) && (
                  <ProgressQuickForm enrollmentId={e.id} progress={e.progress} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="surface-card space-y-3 p-5">
        <h3 className="font-semibold">Training sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions scheduled.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{s.session_date}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                  </p>
                </div>
                {(canManage || canCoach) && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/academies/${programId}/batches/${batch.id}/sessions/${s.id}`}
                    >
                      Attendance
                    </Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {canManage && (
        <div className="surface-card space-y-3 p-5">
          <h3 className="font-semibold">Fee records (offline)</h3>
          {fees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fee records yet.</p>
          ) : (
            <ul className="space-y-2">
              {fees.map((fee) => (
                <li
                  key={fee.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{fee.student?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fee.period_label} · ₹{fee.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={fee.status === "paid" ? "success" : "warning"}>
                      {FEE_STATUS_LABELS[fee.status as keyof typeof FEE_STATUS_LABELS] ?? fee.status}
                    </Badge>
                    {fee.status !== "paid" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => {
                          startTransition(async () => {
                            await recordFeePaymentAction({
                              feeId: fee.id,
                              paymentMethod: "offline",
                            });
                          });
                        }}
                      >
                        Mark paid
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressQuickForm({
  enrollmentId,
  progress,
}: {
  enrollmentId: string;
  progress: EnrollmentWithStudent["progress"];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await updateProgressAction({
            enrollmentId,
            completionPercent: Number(fd.get("completionPercent")),
            performanceNotes: String(fd.get("notes") ?? ""),
          });
        });
      }}
    >
      <input
        name="completionPercent"
        type="number"
        min={0}
        max={100}
        defaultValue={progress?.completion_percent ?? 0}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        placeholder="%"
      />
      <input
        name="notes"
        defaultValue={progress?.performance_notes ?? ""}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm sm:col-span-2"
        placeholder="Performance notes"
      />
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        Save
      </Button>
    </form>
  );
}
