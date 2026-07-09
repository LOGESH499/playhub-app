import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { BookingTable } from "@/features/bookings";
import { PortalLiveShell } from "@/features/portal";
import {
  listBookingHistory,
  listUpcomingBookings,
} from "@/features/portal/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My bookings" };
export const dynamic = "force-dynamic";

interface PortalBookingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PortalBookingsPage({
  searchParams,
}: PortalBookingsPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/bookings");

  const raw = await searchParams;
  const tab = raw.tab === "history" ? "history" : "upcoming";

  const [upcoming, history] = await Promise.all([
    listUpcomingBookings(),
    listBookingHistory(),
  ]);

  const bookings = tab === "history" ? history : upcoming;

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="My bookings"
          description="Upcoming sessions and booking history"
          actions={
            <Button asChild size="sm">
              <Link href="/bookings/new">Book a slot</Link>
            </Button>
          }
        />

        <div className="flex gap-2">
          <Link
            href="/portal/bookings?tab=upcoming"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === "upcoming"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Upcoming ({upcoming.length})
          </Link>
          <Link
            href="/portal/bookings?tab=history"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === "history"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            History ({history.length})
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {tab === "upcoming" ? "upcoming" : "past"} bookings.
          </p>
        ) : (
          <BookingTable bookings={bookings} detailBasePath="/portal/bookings" />
        )}
      </div>
    </PortalLiveShell>
  );
}
