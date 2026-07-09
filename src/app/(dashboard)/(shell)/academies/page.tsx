import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  AcademiesEmptyState,
  AcademiesFilters,
  AcademiesLiveShell,
  AcademiesPagination,
  AcademyProgramCard,
  AcademyProgramTable,
  AcademyStatsCards,
  CoachBatchesPanel,
  MyEnrollmentsPanel,
} from "@/features/academies";
import {
  canAccessAcademy,
  canManageAcademies,
  getAcademyStats,
  listCoachBatches,
  listMyEnrollments,
  listPrograms,
} from "@/features/academies/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { programListFiltersSchema } from "@/lib/validators/academy.schema";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Academies" };
export const dynamic = "force-dynamic";

interface AcademiesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function FiltersSkeleton() {
  return <Skeleton className="h-20 w-full" />;
}

export default async function AcademiesPage({ searchParams }: AcademiesPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/academies");
  if (!context.activeTenant) redirect("/onboarding");
  if (!canAccessAcademy(context.appRole)) redirect("/dashboard");

  const raw = await searchParams;
  const parsed = programListFiltersSchema.safeParse({
    search: typeof raw.search === "string" ? raw.search : undefined,
    academyType: typeof raw.academyType === "string" ? raw.academyType : undefined,
    published: typeof raw.published === "string" ? raw.published : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
    view: typeof raw.view === "string" ? raw.view : undefined,
  });
  const filters = parsed.success
    ? parsed.data
    : programListFiltersSchema.parse({});

  const canManage = canManageAcademies(context.appRole);
  const isCoach = context.appRole === "coach";

  const [result, stats, myEnrollments, coachBatches] = await Promise.all([
    listPrograms(filters),
    canManage ? getAcademyStats() : Promise.resolve(null),
    !canManage ? listMyEnrollments() : Promise.resolve([]),
    isCoach ? listCoachBatches() : Promise.resolve([]),
  ]);

  const hasFilters = Boolean(
    filters.search || filters.academyType || filters.published
  );

  return (
    <AcademiesLiveShell tenantId={context.activeTenant.tenantId}>
      <div className="space-y-6">
        <PageHeader
          title={canManage ? "Academy management" : "My academies"}
          description={
            canManage
              ? "Programs, batches, coaches, enrollments, attendance, and fees"
              : "View your enrollments and training schedules"
          }
          actions={
            canManage ? (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/academies/reports">
                    <BarChart3 className="h-4 w-4" />
                    Reports
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/academies/new">
                    <Plus className="h-4 w-4" />
                    New program
                  </Link>
                </Button>
              </div>
            ) : undefined
          }
        />

        {stats && <AcademyStatsCards stats={stats} />}

        {!canManage && (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">My enrollments</h2>
              <MyEnrollmentsPanel enrollments={myEnrollments} />
            </section>
            {isCoach && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">My coaching batches</h2>
                <CoachBatchesPanel batches={coachBatches} />
              </section>
            )}
          </>
        )}

        {canManage && (
          <>
            <Suspense fallback={<FiltersSkeleton />}>
              <AcademiesFilters canManage={canManage} />
            </Suspense>

            {result.programs.length === 0 ? (
              <AcademiesEmptyState canManage={canManage} hasFilters={hasFilters} />
            ) : filters.view === "list" ? (
              <AcademyProgramTable programs={result.programs} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {result.programs.map((program) => (
                  <AcademyProgramCard
                    key={program.id}
                    program={program}
                    canManage={canManage}
                  />
                ))}
              </div>
            )}

            <AcademiesPagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
            />
          </>
        )}
      </div>
    </AcademiesLiveShell>
  );
}
