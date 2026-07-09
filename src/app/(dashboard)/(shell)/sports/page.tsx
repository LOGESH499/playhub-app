import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageSports,
  getSportCategories,
  listSports,
} from "@/features/sports/lib/queries";
import {
  SportCard,
  SportTable,
  SportsEmptyState,
  SportsFilters,
  SportsPagination,
} from "@/features/sports";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { sportListFiltersSchema } from "@/lib/validators/sports.schema";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sports",
};

export const dynamic = "force-dynamic";

interface SportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function FiltersSkeleton() {
  return <Skeleton className="h-20 w-full" />;
}

export default async function SportsPage({ searchParams }: SportsPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/sports");

  const raw = await searchParams;
  const parsed = sportListFiltersSchema.safeParse({
    search: typeof raw.search === "string" ? raw.search : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    categoryId: typeof raw.categoryId === "string" ? raw.categoryId : undefined,
    featured: raw.featured === "true" ? true : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
    view: typeof raw.view === "string" ? raw.view : undefined,
  });

  const filters = parsed.success
    ? parsed.data
    : sportListFiltersSchema.parse({});

  const [categories, result] = await Promise.all([
    getSportCategories(),
    listSports(filters),
  ]);

  const canManage = canManageSports(context.appRole);

  const hasFilters = Boolean(
    filters.search || filters.status || filters.categoryId || filters.featured
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sports"
        description="Manage sports catalog, booking rules, and venue assignments"
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/sports/new">
                <Plus className="h-4 w-4" />
                Add sport
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Suspense fallback={<FiltersSkeleton />}>
        <SportsFilters categories={categories} canManage={canManage} />
      </Suspense>

      {result.sports.length === 0 ? (
        <SportsEmptyState canManage={canManage} hasFilters={hasFilters} />
      ) : filters.view === "list" ? (
        <SportTable sports={result.sports} canManage={canManage} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.sports.map((sport) => (
            <SportCard key={sport.id} sport={sport} canManage={canManage} />
          ))}
        </div>
      )}

      <SportsPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
