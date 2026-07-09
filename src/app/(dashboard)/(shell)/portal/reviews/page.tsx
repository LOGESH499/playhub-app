import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { PortalLiveShell, PortalReviewsPanel } from "@/features/portal";
import {
  getReviewableVenues,
  listMyReviews,
} from "@/features/portal/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function PortalReviewsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/reviews");

  const [reviews, reviewableVenues] = await Promise.all([
    listMyReviews(),
    getReviewableVenues(),
  ]);

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="Reviews & ratings"
          description="Rate venues after your completed bookings"
        />
        <PortalReviewsPanel
          reviews={reviews}
          reviewableVenues={reviewableVenues}
        />
      </div>
    </PortalLiveShell>
  );
}
