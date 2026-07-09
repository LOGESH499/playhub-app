import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageSlots,
  getResourcesForSlotForm,
  getSlotById,
  getVenuesForSlotForm,
} from "@/features/slots/lib/queries";
import { SlotForm } from "@/features/slots";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Edit slot",
};

export const dynamic = "force-dynamic";

interface EditSlotPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditSlotPage({
  params,
  searchParams,
}: EditSlotPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/slots");

  if (!context.activeTenant) redirect("/onboarding");

  if (!canManageSlots(context.appRole)) redirect("/slots");

  const { id } = await params;
  const raw = await searchParams;
  const created = raw.created === "1";

  const [slot, venues, resources] = await Promise.all([
    getSlotById(id),
    getVenuesForSlotForm(),
    getResourcesForSlotForm(),
  ]);

  if (!slot) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit slot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {slot.venue?.name} · {slot.resource?.name}
        </p>
      </div>

      {created && (
        <Alert variant="success">Slot created successfully.</Alert>
      )}

      <SlotForm
        mode="edit"
        slot={slot}
        venues={venues}
        resources={resources}
      />
    </div>
  );
}
