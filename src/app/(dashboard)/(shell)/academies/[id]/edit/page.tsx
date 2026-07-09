import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { AcademyProgramForm } from "@/features/academies";
import {
  canManageAcademies,
  getProgramById,
  getVenuesForAcademyForm,
} from "@/features/academies/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

interface EditProgramPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProgramPage({ params }: EditProgramPageProps) {
  const { id } = await params;
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!canManageAcademies(context.appRole)) redirect("/academies");

  const [program, venues] = await Promise.all([
    getProgramById(id),
    getVenuesForAcademyForm(),
  ]);
  if (!program) redirect("/academies");

  return (
    <div className="space-y-6">
      <PageHeader title="Edit program" description={program.name} />
      <AcademyProgramForm program={program} venues={venues} mode="edit" />
    </div>
  );
}
