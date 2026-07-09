import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, BarChart3 } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import {
  BookingStatsCards,
  BookingTable,
  BookingsEmptyState,
  BookingsFilters,
  BookingsLiveShell,
  BookingsPagination,
} from "@/features/bookings";
import {
  canManageBookings,
  getBookingStats,
  getResourcesForBookingForm,
  getVenuesForBookingForm,
  listBookings,
} from "@/features/bookings/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { bookingListFiltersSchema } from "@/lib/validators/booking.schema";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Bookings",
};

export const dynamic = "force-dynamic";

interface BookingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function FiltersSkeleton() {
  return <Skeleton className="h-20 w-full" />;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/bookings");

  const raw = await searchParams;
  const parsed = bookingListFiltersSchema.safeParse({
    search: typeof raw.search === "string" ? raw.search : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    venueId: typeof raw.venueId === "string" ? raw.venueId : undefined,
    resourceId: typeof raw.resourceId === "string" ? raw.resourceId : undefined,
    startDate: typeof raw.startDate === "string" ? raw.startDate : undefined,
    endDate: typeof raw.endDate === "string" ? raw.endDate : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });

  const filters = parsed.success
    ? parsed.data
    : bookingListFiltersSchema.parse({});

  const canManage = canManageBookings(context.appRole);

  const [venues, resources, result, stats] = await Promise.all([
    getVenuesForBookingForm(),
    getResourcesForBookingForm(),
    listBookings(filters),
    canManage ? getBookingStats() : Promise.resolve(null),
  ]);

  const hasFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.venueId ||
      filters.resourceId ||
      filters.startDate ||
      filters.endDate
  );

  return (
    <BookingsLiveShell
      tenantId={context.activeTenant?.tenantId}
      userId={context.userId}
    >
      <div className="space-y-6">
        <PageHeader
          title={canManage ? "Booking management" : "My bookings"}
          description={
            canManage
              ? "Manage reservations, check-ins, and venue occupancy in real time"
              : "View and manage your court and slot reservations"
          }
          actions={
            <div className="flex flex-wrap gap-2">
              {canManage && (
                <Button asChild variant="outline">
                  <Link href="/bookings/reports">
                    <BarChart3 className="h-4 w-4" />
                    Reports
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link href="/bookings/new">
                  <Plus className="h-4 w-4" />
                  Book slot
                </Link>
              </Button>
            </div>
          }
        />

        {canManage && stats && <BookingStatsCards stats={stats} />}

        <Suspense fallback={<FiltersSkeleton />}>
          <BookingsFilters
            venues={venues}
            resources={resources}
            canManage={canManage}
          />
        </Suspense>

        {result.bookings.length === 0 ? (
          <BookingsEmptyState hasFilters={hasFilters} />
        ) : (
          <BookingTable bookings={result.bookings} canManage={canManage} />
        )}

        <BookingsPagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
        />
      </div>
    </BookingsLiveShell>
  );
}
