import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { AcademyProgramForm } from "@/features/academies";
import {
  canManageAcademies,
  getVenuesForAcademyForm,
} from "@/features/academies/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "New academy program" };
export const dynamic = "force-dynamic";

export default async function NewAcademyProgramPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/academies/new");
  if (!context.activeTenant) redirect("/onboarding");
  if (!canManageAcademies(context.appRole)) redirect("/academies");

  const venues = await getVenuesForAcademyForm();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create academy program"
        description="Set up a new coaching program at one of your venues"
      />
      <AcademyProgramForm venues={venues} mode="create" />
    </div>
  );
}
