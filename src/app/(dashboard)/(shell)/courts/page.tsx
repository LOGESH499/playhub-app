import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageCourts,
  getVenuesForCourtForm,
  listCourts,
} from "@/features/courts/lib/queries";
import {
  CourtCard,
  CourtTable,
  CourtsEmptyState,
  CourtsFilters,
  CourtsPagination,
} from "@/features/courts";
import { courtListFiltersSchema } from "@/lib/validators/court.schema";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Courts",
};

export const dynamic = "force-dynamic";

interface CourtsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function FiltersSkeleton() {
  return <Skeleton className="h-20 w-full" />;
}

export default async function CourtsPage({ searchParams }: CourtsPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/courts");

  if (!context.activeTenant) redirect("/onboarding");

  const raw = await searchParams;
  const parsed = courtListFiltersSchema.safeParse({
    search: typeof raw.search === "string" ? raw.search : undefined,
    venueId: typeof raw.venueId === "string" ? raw.venueId : undefined,
    sportType: typeof raw.sportType === "string" ? raw.sportType : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    isIndoor:
      raw.isIndoor === "true" ? true : raw.isIndoor === "false" ? false : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
    view: typeof raw.view === "string" ? raw.view : undefined,
  });

  const filters = parsed.success
    ? parsed.data
    : courtListFiltersSchema.parse({});

  const [venues, result] = await Promise.all([
    getVenuesForCourtForm(),
    listCourts(filters),
  ]);

  const canManage = canManageCourts(context.appRole);

  const hasFilters = Boolean(
    filters.search ||
      filters.venueId ||
      filters.sportType ||
      filters.status ||
      filters.isIndoor !== undefined
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Courts & Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage courts, lanes, turfs, and equipment across your venues
        </p>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <CourtsFilters venues={venues} canManage={canManage} />
      </Suspense>

      {result.courts.length === 0 ? (
        <CourtsEmptyState canManage={canManage} hasFilters={hasFilters} />
      ) : filters.view === "list" ? (
        <CourtTable courts={result.courts} canManage={canManage} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.courts.map((court) => (
            <CourtCard key={court.id} court={court} canManage={canManage} />
          ))}
        </div>
      )}

      <CourtsPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
