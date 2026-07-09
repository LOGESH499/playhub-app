import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { BatchForm } from "@/features/academies";
import { canManageAcademies, getProgramById } from "@/features/academies/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "New batch" };
export const dynamic = "force-dynamic";

interface NewBatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewBatchPage({ params }: NewBatchPageProps) {
  const { id } = await params;
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!canManageAcademies(context.appRole)) redirect("/academies");

  const program = await getProgramById(id);
  if (!program) redirect("/academies");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create batch"
        description={`Add a training batch to ${program.name}`}
      />
      <BatchForm programId={id} mode="create" />
    </div>
  );
}
