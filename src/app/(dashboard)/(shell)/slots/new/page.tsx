import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageSlots,
  getResourcesForSlotForm,
  getVenuesForSlotForm,
} from "@/features/slots/lib/queries";
import { SlotForm } from "@/features/slots";

export const metadata: Metadata = {
  title: "New slot",
};

export const dynamic = "force-dynamic";

export default async function NewSlotPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/slots/new");

  if (!context.activeTenant) redirect("/onboarding");

  if (!canManageSlots(context.appRole)) redirect("/slots");

  const [venues, resources] = await Promise.all([
    getVenuesForSlotForm(),
    getResourcesForSlotForm(),
  ]);

  if (venues.length === 0) redirect("/venues/new");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create slot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a one-time or recurring bookable window
        </p>
      </div>

      <SlotForm mode="create" venues={venues} resources={resources} />
    </div>
  );
}
