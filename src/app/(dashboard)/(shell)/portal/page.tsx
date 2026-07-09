import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  PortalLiveShell,
  PortalQuickActions,
  PortalStatsCards,
} from "@/features/portal";
import { getPortalDashboard } from "@/features/portal/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_LABELS } from "@/lib/validators/booking.schema";

export const metadata: Metadata = { title: "My Portal" };
export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal");

  const data = await getPortalDashboard();
  if (!data) redirect("/login");

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title={`Welcome, ${context.profile.full_name.split(" ")[0]}`}
          description="Your bookings, memberships, academies, and account in one place"
        />

        <PortalQuickActions hasUpcoming={data.upcomingBookings.length > 0} />
        <PortalStatsCards data={data} />

        {data.upcomingBookings.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming bookings</h2>
              <Link href="/portal/bookings" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {data.upcomingBookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{b.venue?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(b.start_time).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="default">{BOOKING_STATUS_LABELS[b.status]}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PortalLiveShell>
  );
}
