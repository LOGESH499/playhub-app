import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  AcademyReportsCharts,
  AcademyStatsCards,
} from "@/features/academies";
import {
  canManageAcademies,
  getAcademyStats,
  listPrograms,
} from "@/features/academies/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { programListFiltersSchema } from "@/lib/validators/academy.schema";

export const metadata: Metadata = { title: "Academy reports" };
export const dynamic = "force-dynamic";

export default async function AcademyReportsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/academies/reports");
  if (!canManageAcademies(context.appRole)) redirect("/academies");

  const [stats] = await Promise.all([
    getAcademyStats(),
    listPrograms(programListFiltersSchema.parse({ pageSize: 100 })),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academy reports"
        description="Enrollment, attendance, and fee analytics"
      />
      <AcademyStatsCards stats={stats} />
      <AcademyReportsCharts stats={stats} />
    </div>
  );
}
