import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  BookingReportsCharts,
  BookingStatsCards,
  BookingTable,
} from "@/features/bookings";
import {
  canManageBookings,
  getBookingStats,
  listBookings,
} from "@/features/bookings/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { bookingListFiltersSchema } from "@/lib/validators/booking.schema";

export const metadata: Metadata = {
  title: "Booking reports",
};

export const dynamic = "force-dynamic";

export default async function BookingReportsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/bookings/reports");

  if (!canManageBookings(context.appRole)) {
    redirect("/bookings");
  }

  const filters = bookingListFiltersSchema.parse({ pageSize: 100 });
  const [stats, result] = await Promise.all([
    getBookingStats(),
    listBookings(filters),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking analytics"
        description="Monthly booking performance and status breakdown"
        actions={
          <Button asChild variant="outline">
            <Link href="/bookings">Back to bookings</Link>
          </Button>
        }
      />

      <BookingStatsCards stats={stats} />
      <BookingReportsCharts bookings={result.bookings} />
      <BookingTable bookings={result.bookings.slice(0, 20)} canManage />
    </div>
  );
}
