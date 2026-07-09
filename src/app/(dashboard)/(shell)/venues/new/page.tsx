import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { canManageVenues } from "@/features/venues/lib/queries";
import { VenueForm } from "@/features/venues";

export const metadata: Metadata = {
  title: "New venue",
};

export const dynamic = "force-dynamic";

export default async function NewVenuePage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/venues/new");

  if (!context.activeTenant) redirect("/onboarding");

  if (!canManageVenues(context.appRole)) {
    redirect("/venues");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create venue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new location with address, hours, and pricing
        </p>
      </div>

      <VenueForm mode="create" />
    </div>
  );
}
