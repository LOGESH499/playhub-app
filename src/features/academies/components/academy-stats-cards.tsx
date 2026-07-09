import type { AcademyStats } from "@/features/academies/lib/types";

interface AcademyStatsCardsProps {
  stats: AcademyStats;
}

export function AcademyStatsCards({ stats }: AcademyStatsCardsProps) {
  const items = [
    { label: "Programs", value: stats.programs },
    { label: "Batches", value: stats.batches },
    { label: "Active enrollments", value: stats.activeEnrollments },
    { label: "Sessions this month", value: stats.sessionsThisMonth },
    { label: "Fees collected", value: `₹${stats.feesCollected.toLocaleString()}` },
    { label: "Fees pending", value: `₹${stats.feesPending.toLocaleString()}` },
    { label: "Avg attendance", value: `${stats.avgAttendanceRate}%` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="surface-card p-4">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
