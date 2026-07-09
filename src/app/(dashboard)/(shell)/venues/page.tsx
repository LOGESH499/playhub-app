import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageVenues,
  getVenueCities,
  listVenues,
} from "@/features/venues/lib/queries";
import {
  VenueCard,
  VenueTable,
  VenuesEmptyState,
  VenuesFilters,
  VenuesPagination,
} from "@/features/venues";
import { venueListFiltersSchema } from "@/lib/validators/venue.schema";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Venues",
};

export const dynamic = "force-dynamic";

interface VenuesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function FiltersSkeleton() {
  return <Skeleton className="h-20 w-full" />;
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/venues");

  if (!context.activeTenant) {
    redirect("/onboarding");
  }

  const raw = await searchParams;
  const parsed = venueListFiltersSchema.safeParse({
    search: typeof raw.search === "string" ? raw.search : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    city: typeof raw.city === "string" ? raw.city : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
    view: typeof raw.view === "string" ? raw.view : undefined,
  });

  const filters = parsed.success
    ? parsed.data
    : venueListFiltersSchema.parse({});

  const [cities, result] = await Promise.all([
    getVenueCities(),
    listVenues(filters),
  ]);

  const canManage = canManageVenues(context.appRole);

  const hasFilters = Boolean(filters.search || filters.status || filters.city);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Venues</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage locations, hours, pricing, and media for your organization
        </p>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <VenuesFilters cities={cities} canManage={canManage} />
      </Suspense>

      {result.venues.length === 0 ? (
        <VenuesEmptyState canManage={canManage} hasFilters={hasFilters} />
      ) : filters.view === "list" ? (
        <VenueTable venues={result.venues} canManage={canManage} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} canManage={canManage} />
          ))}
        </div>
      )}

      <VenuesPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
