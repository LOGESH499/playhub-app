import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageCourts,
  getCourtById,
  getVenuesForCourtForm,
} from "@/features/courts/lib/queries";
import { CourtForm } from "@/features/courts";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

interface EditCourtPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}

export async function generateMetadata({
  params,
}: EditCourtPageProps): Promise<Metadata> {
  const { id } = await params;
  const court = await getCourtById(id);
  return { title: court ? `Edit ${court.name}` : "Edit court" };
}

export default async function EditCourtPage({
  params,
  searchParams,
}: EditCourtPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login");

  const { id } = await params;
  const { created } = await searchParams;

  const court = await getCourtById(id);
  if (!court) notFound();

  if (!canManageCourts(context.appRole)) redirect("/courts");

  if (
    context.activeTenant &&
    court.tenant_id !== context.activeTenant.tenantId
  ) {
    notFound();
  }

  const venues = await getVenuesForCourtForm();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit {court.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update availability, pricing, equipment, and photos
        </p>
      </div>

      {created === "1" && (
        <Alert variant="success">Court created successfully.</Alert>
      )}

      <CourtForm mode="edit" court={court} venues={venues} />
    </div>
  );
}
