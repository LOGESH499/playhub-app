import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  canManageSports,
  getSportCategories,
  getVenuesForSportForm,
} from "@/features/sports/lib/queries";
import { SportForm } from "@/features/sports";

export const metadata: Metadata = {
  title: "Create sport",
};

export const dynamic = "force-dynamic";

export default async function NewSportPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/sports/new");

  if (!canManageSports(context.appRole)) {
    redirect("/sports");
  }

  const [categories, venues] = await Promise.all([
    getSportCategories(),
    getVenuesForSportForm(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create sport</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new sport to your catalog with booking rules and pricing defaults
        </p>
      </div>
      <SportForm mode="create" categories={categories} venues={venues} />
    </div>
  );
}
