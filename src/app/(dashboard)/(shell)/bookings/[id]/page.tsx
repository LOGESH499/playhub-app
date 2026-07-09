import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  BookingDetailPanel,
  BookingsLiveShell,
} from "@/features/bookings";
import {
  canManageBookings,
  getBookingById,
} from "@/features/bookings/lib/queries";
import {
  getBookingRefundRequests,
  getBookingTransactions,
} from "@/features/payments/lib/queries";

export const dynamic = "force-dynamic";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: BookingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const booking = await getBookingById(id);
  return {
    title: booking?.confirmation_code
      ? `Booking ${booking.confirmation_code}`
      : "Booking details",
  };
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: BookingDetailPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login");

  const { id } = await params;
  const raw = await searchParams;
  const booking = await getBookingById(id);

  if (!booking) notFound();

  const [transactions, refunds] = await Promise.all([
    getBookingTransactions(id),
    getBookingRefundRequests(id),
  ]);

  const canManage = canManageBookings(context.appRole);
  const confirmed = raw.confirmed === "1";

  return (
    <BookingsLiveShell
      tenantId={context.activeTenant?.tenantId}
      userId={context.userId}
    >
      <BookingDetailPanel
        booking={booking}
        canManage={canManage}
        confirmed={confirmed}
        transactions={transactions}
        refunds={refunds}
      />
    </BookingsLiveShell>
  );
}
