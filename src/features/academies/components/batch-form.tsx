"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createBatchAction,
  updateBatchAction,
} from "@/features/academies/actions/academy.actions";
import { parseBatchSchedule } from "@/features/academies/lib/parse";
import type { BatchWithRelations } from "@/features/academies/lib/types";
import { SCHEDULE_DAY_LABELS } from "@/lib/validators/academy.schema";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface BatchFormProps {
  programId: string;
  batch?: BatchWithRelations;
  mode: "create" | "edit";
}

export function BatchForm({ programId, batch, mode }: BatchFormProps) {
  const router = useRouter();
  const schedule = parseBatchSchedule(batch?.schedule);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedDays, setSelectedDays] = useState<string[]>(schedule.days);

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const payload = {
      programId,
      name: String(fd.get("name")),
      ageGroupMin: fd.get("ageGroupMin") ? Number(fd.get("ageGroupMin")) : undefined,
      ageGroupMax: fd.get("ageGroupMax") ? Number(fd.get("ageGroupMax")) : undefined,
      skillLevel: (["beginner", "intermediate", "advanced"] as const).find(
        (v) => v === String(fd.get("skillLevel"))
      ),
      capacity: Number(fd.get("capacity")),
      feeAmount: fd.get("feeAmount") ? Number(fd.get("feeAmount")) : undefined,
      feePeriod: (["monthly", "quarterly", "annual"] as const).find(
        (v) => v === String(fd.get("feePeriod"))
      ),
      schedule: {
        days: selectedDays as (typeof DAYS)[number][],
        start: String(fd.get("startTime")),
        end: String(fd.get("endTime")),
      },
      startDate: String(fd.get("startDate")),
      endDate: String(fd.get("endDate") ?? ""),
      isActive: fd.get("isActive") === "on",
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createBatchAction(payload);
        if (result?.error) setError(result.error);
      } else if (batch) {
        const result = await updateBatchAction({ ...payload, id: batch.id });
        if (result.error) setError(result.error);
        if (result.success) router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="surface-card max-w-2xl space-y-4 p-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-2">
        <label className="text-sm font-medium">Batch name</label>
        <Input name="name" defaultValue={batch?.name ?? ""} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Min age</label>
          <Input name="ageGroupMin" type="number" defaultValue={batch?.age_group_min ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Max age</label>
          <Input name="ageGroupMax" type="number" defaultValue={batch?.age_group_max ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Skill level</label>
          <select
            name="skillLevel"
            defaultValue={batch?.skill_level ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Any</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Capacity</label>
          <Input name="capacity" type="number" defaultValue={batch?.capacity ?? 20} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fee amount (₹)</label>
          <Input name="feeAmount" type="number" step="0.01" defaultValue={batch?.fee_amount ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fee period</label>
          <select
            name="feePeriod"
            defaultValue={batch?.fee_period ?? "monthly"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Training days</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`rounded-md border px-3 py-1 text-sm ${
                selectedDays.includes(day)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input"
              }`}
            >
              {SCHEDULE_DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start time</label>
          <Input name="startTime" type="time" defaultValue={schedule.start} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End time</label>
          <Input name="endTime" type="time" defaultValue={schedule.end} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start date</label>
          <Input name="startDate" type="date" defaultValue={batch?.start_date ?? ""} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End date</label>
          <Input name="endDate" type="date" defaultValue={batch?.end_date ?? ""} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={batch?.is_active ?? true} />
        Active batch
      </label>

      <Button type="submit" disabled={isPending || selectedDays.length === 0}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "create" ? "Create batch" : "Save batch"}
      </Button>
    </form>
  );
}
