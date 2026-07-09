import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { canManageVenues, getVenueById } from "@/features/venues/lib/queries";
import { VenueForm } from "@/features/venues";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

interface EditVenuePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}

export async function generateMetadata({
  params,
}: EditVenuePageProps): Promise<Metadata> {
  const { id } = await params;
  const venue = await getVenueById(id);
  return { title: venue ? `Edit ${venue.name}` : "Edit venue" };
}

export default async function EditVenuePage({
  params,
  searchParams,
}: EditVenuePageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login");

  const { id } = await params;
  const { created } = await searchParams;

  const venue = await getVenueById(id);
  if (!venue) notFound();

  if (!canManageVenues(context.appRole)) {
    redirect("/venues");
  }

  if (
    context.activeTenant &&
    venue.tenant_id !== context.activeTenant.tenantId
  ) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit {venue.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update venue details, gallery, hours, holidays, and pricing
        </p>
      </div>

      {created === "1" && (
        <Alert variant="success">Venue created successfully.</Alert>
      )}

      <VenueForm mode="edit" venue={venue} />
    </div>
  );
}
