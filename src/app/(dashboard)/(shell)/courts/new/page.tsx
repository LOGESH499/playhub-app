import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageCourts,
  getVenuesForCourtForm,
} from "@/features/courts/lib/queries";
import { CourtForm } from "@/features/courts";

export const metadata: Metadata = {
  title: "New court",
};

export const dynamic = "force-dynamic";

export default async function NewCourtPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/courts/new");

  if (!context.activeTenant) redirect("/onboarding");

  if (!canManageCourts(context.appRole)) redirect("/courts");

  const venues = await getVenuesForCourtForm();
  if (venues.length === 0) redirect("/venues/new");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create court</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a court, lane, turf, or track to a venue
        </p>
      </div>

      <CourtForm mode="create" venues={venues} />
    </div>
  );
}
