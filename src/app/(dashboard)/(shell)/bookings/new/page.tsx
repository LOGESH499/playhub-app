import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  BookingSlotPicker,
  BookingsLiveShell,
} from "@/features/bookings";
import {
  getResourcesForBookingForm,
  getVenuesForBookingForm,
  listBookableSlots,
} from "@/features/bookings/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Book a slot",
};

export const dynamic = "force-dynamic";

function addDaysToDateString(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

interface NewBookingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewBookingPage({
  searchParams,
}: NewBookingPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/bookings/new");
  if (!context.activeTenant) redirect("/onboarding");

  const raw = await searchParams;
  const venueId = typeof raw.venueId === "string" ? raw.venueId : undefined;
  const resourceId =
    typeof raw.resourceId === "string" ? raw.resourceId : undefined;
  const startDate =
    typeof raw.startDate === "string"
      ? raw.startDate
      : new Date().toISOString().slice(0, 10);
  const endDate =
    typeof raw.endDate === "string"
      ? raw.endDate
      : addDaysToDateString(startDate, 14);

  const [venues, resources, slots] = await Promise.all([
    getVenuesForBookingForm(),
    getResourcesForBookingForm(venueId),
    listBookableSlots({ venueId, resourceId, startDate, endDate }),
  ]);

  return (
    <BookingsLiveShell
      tenantId={context.activeTenant.tenantId}
      userId={context.userId}
    >
      <div className="space-y-6">
        <PageHeader
          title="Book a slot"
          description="Select an available slot — holds last 10 minutes before checkout"
        />

        <form
          method="get"
          action="/bookings/new"
          className="surface-card grid gap-3 p-4 sm:grid-cols-4"
        >
          <select
            name="venueId"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue={venueId ?? ""}
          >
            <option value="">All venues</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <select
            name="resourceId"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue={resourceId ?? ""}
          >
            <option value="">All resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="startDate"
            defaultValue={startDate}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            type="date"
            name="endDate"
            defaultValue={endDate}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Apply
          </button>
        </form>

        <BookingSlotPicker slots={slots} />
      </div>
    </BookingsLiveShell>
  );
}
