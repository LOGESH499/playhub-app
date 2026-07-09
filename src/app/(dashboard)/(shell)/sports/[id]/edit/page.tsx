import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageSports,
  getSportById,
  getSportCategories,
  getVenuesForSportForm,
} from "@/features/sports/lib/queries";
import { SportForm } from "@/features/sports";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

interface EditSportPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}

export async function generateMetadata({
  params,
}: EditSportPageProps): Promise<Metadata> {
  const { id } = await params;
  const sport = await getSportById(id);
  return { title: sport ? `Edit ${sport.name}` : "Edit sport" };
}

export default async function EditSportPage({
  params,
  searchParams,
}: EditSportPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login");

  const { id } = await params;
  const { created } = await searchParams;

  const sport = await getSportById(id);
  if (!sport) notFound();

  const canManage = canManageSports(context.appRole);

  if (!canManage) redirect("/sports");

  const [categories, venues] = await Promise.all([
    getSportCategories(),
    getVenuesForSportForm(id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit {sport.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update sport settings, booking rules, and venue assignments
        </p>
      </div>

      {created === "1" && (
        <Alert variant="success">Sport created successfully.</Alert>
      )}

      <SportForm
        mode="edit"
        sport={sport}
        categories={categories}
        venues={venues}
      />
    </div>
  );
}
