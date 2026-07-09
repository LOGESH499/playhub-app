import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { AcademiesLiveShell } from "@/features/academies";
import {
  canManageAcademies,
  getProgramById,
} from "@/features/academies/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACADEMY_LABELS } from "@/lib/database/enums";

export const dynamic = "force-dynamic";

interface ProgramDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProgramDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgramById(id);
  return { title: program?.name ?? "Academy program" };
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { id } = await params;
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/academies");
  if (!context.activeTenant) redirect("/onboarding");

  const program = await getProgramById(id);
  if (!program) notFound();

  const canManage = canManageAcademies(context.appRole);

  return (
    <AcademiesLiveShell tenantId={context.activeTenant.tenantId}>
      <div className="space-y-6">
        <PageHeader
          title={program.name}
          description={program.description ?? undefined}
          actions={
            canManage ? (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/academies/${id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/academies/${id}/batches/new`}>
                    <Plus className="h-4 w-4" />
                    Add batch
                  </Link>
                </Button>
              </div>
            ) : undefined
          }
        />

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{ACADEMY_LABELS[program.academy_type]}</Badge>
          <Badge variant={program.is_published ? "success" : "secondary"}>
            {program.is_published ? "Published" : "Draft"}
          </Badge>
          <Badge variant="outline">{program.venue?.name}</Badge>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Batches</h2>
          {program.batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No batches yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {program.batches.map((batch) => (
                <Link
                  key={batch.id}
                  href={`/academies/${id}/batches/${batch.id}`}
                  className="surface-card-hover block p-4"
                >
                  <p className="font-medium">{batch.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Capacity {batch.capacity} · {batch.is_active ? "Active" : "Inactive"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AcademiesLiveShell>
  );
}
