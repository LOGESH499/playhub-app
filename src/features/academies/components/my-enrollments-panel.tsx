import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ENROLLMENT_STATUS_LABELS } from "@/lib/validators/academy.schema";
import { ENROLLMENT_STATUS_VARIANTS } from "@/features/academies/lib/status";
import type { EnrollmentWithStudent } from "@/features/academies/lib/types";

interface MyEnrollmentsPanelProps {
  enrollments: EnrollmentWithStudent[];
}

export function MyEnrollmentsPanel({ enrollments }: MyEnrollmentsPanelProps) {
  if (enrollments.length === 0) {
    return (
      <div className="surface-card p-6 text-sm text-muted-foreground">
        You are not enrolled in any academy batches yet.
      </div>
    );
  }

  return (
    <div className="surface-card divide-y divide-border">
      {enrollments.map((e) => (
        <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">{e.batch?.name ?? "Batch"}</p>
            <p className="text-sm text-muted-foreground">
              Enrolled {new Date(e.enrolled_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={ENROLLMENT_STATUS_VARIANTS[e.status]}>
            {ENROLLMENT_STATUS_LABELS[e.status]}
          </Badge>
        </div>
      ))}
    </div>
  );
}

interface CoachBatchesPanelProps {
  batches: Array<{
    id: string;
    name: string;
    program?: { id: string; name: string } | null;
  }>;
}

export function CoachBatchesPanel({ batches }: CoachBatchesPanelProps) {
  if (batches.length === 0) {
    return (
      <div className="surface-card p-6 text-sm text-muted-foreground">
        No batches assigned to you yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {batches.map((batch) => (
        <Link
          key={batch.id}
          href={`/academies/${batch.program?.id}/batches/${batch.id}`}
          className="surface-card-hover block p-4"
        >
          <p className="font-medium">{batch.name}</p>
          <p className="text-sm text-muted-foreground">{batch.program?.name}</p>
        </Link>
      ))}
    </div>
  );
}
