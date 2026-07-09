import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageSlots,
  canViewSlots,
  getResourcesForSlotForm,
  getVenuesForSlotForm,
  listSlots,
} from "@/features/slots/lib/queries";
import {
  SlotCalendarViews,
  SlotListView,
  SlotsEmptyState,
  SlotsFilters,
  SlotsLiveShell,
  SlotsPagination,
} from "@/features/slots";
import { slotListFiltersSchema } from "@/lib/validators/slot.schema";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Slots",
};

export const dynamic = "force-dynamic";

interface SlotsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function FiltersSkeleton() {
  return <Skeleton className="h-20 w-full" />;
}

export default async function SlotsPage({ searchParams }: SlotsPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/slots");

  if (!context.activeTenant) redirect("/onboarding");

  if (!canViewSlots(context.appRole)) redirect("/dashboard");

  const raw = await searchParams;
  const parsed = slotListFiltersSchema.safeParse({
    search: typeof raw.search === "string" ? raw.search : undefined,
    venueId: typeof raw.venueId === "string" ? raw.venueId : undefined,
    resourceId: typeof raw.resourceId === "string" ? raw.resourceId : undefined,
    slotType: typeof raw.slotType === "string" ? raw.slotType : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    startDate: typeof raw.startDate === "string" ? raw.startDate : undefined,
    endDate: typeof raw.endDate === "string" ? raw.endDate : undefined,
    view: typeof raw.view === "string" ? raw.view : undefined,
    date: typeof raw.date === "string" ? raw.date : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });

  const filters = parsed.success
    ? parsed.data
    : slotListFiltersSchema.parse({});

  const [venues, resources, result] = await Promise.all([
    getVenuesForSlotForm(),
    getResourcesForSlotForm(),
    listSlots(filters),
  ]);

  const canManage = canManageSlots(context.appRole);
  const anchorDate =
    filters.date ?? new Date().toISOString().slice(0, 10);

  const hasFilters = Boolean(
    filters.search ||
      filters.venueId ||
      filters.resourceId ||
      filters.slotType ||
      filters.status
  );

  return (
    <SlotsLiveShell
      tenantId={context.activeTenant.tenantId}
      venues={venues}
      resources={resources}
      canManage={canManage}
      showBulkPanel={filters.view !== "list"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Slot Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule bookable slots, blocks, and recurring availability across courts
          </p>
        </div>

        <Suspense fallback={<FiltersSkeleton />}>
          <SlotsFilters
            venues={venues}
            resources={resources}
            canManage={canManage}
          />
        </Suspense>

        {result.slots.length === 0 ? (
          <SlotsEmptyState canManage={canManage} hasFilters={hasFilters} />
        ) : filters.view === "list" ? (
          <SlotListView
            slots={result.slots}
            venues={venues}
            resources={resources}
            canManage={canManage}
          />
        ) : (
          <SlotCalendarViews
            slots={result.slots}
            view={filters.view}
            anchorDate={anchorDate}
            canManage={canManage}
          />
        )}

        {filters.view === "list" && (
          <SlotsPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
          />
        )}
      </div>
    </SlotsLiveShell>
  );
}
