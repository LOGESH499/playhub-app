import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  BookingDetailPanel,
  BookingsLiveShell,
} from "@/features/bookings";
import { getBookingById } from "@/features/bookings/lib/queries";
import {
  getBookingRefundRequests,
  getBookingTransactions,
} from "@/features/payments/lib/queries";

export const dynamic = "force-dynamic";

interface PortalBookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PortalBookingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const booking = await getBookingById(id);
  return {
    title: booking?.confirmation_code
      ? `Booking ${booking.confirmation_code}`
      : "Booking details",
  };
}

export default async function PortalBookingDetailPage({
  params,
}: PortalBookingDetailPageProps) {
  const { id } = await params;
  const context = await getAuthContext();
  if (!context) redirect(`/login?redirectTo=/portal/bookings/${id}`);

  const booking = await getBookingById(id);
  if (!booking) notFound();

  const [transactions, refunds] = await Promise.all([
    getBookingTransactions(id),
    getBookingRefundRequests(id),
  ]);

  return (
    <BookingsLiveShell userId={context.userId}>
      <BookingDetailPanel
        booking={booking}
        canManage={false}
        backHref="/portal/bookings"
        listHref="/portal/bookings"
        transactions={transactions}
        refunds={refunds}
      />
    </BookingsLiveShell>
  );
}
