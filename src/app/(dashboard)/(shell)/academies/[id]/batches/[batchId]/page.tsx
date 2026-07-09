import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { canManageAcademy, canManageOrganization } from "@/lib/auth/roles";
import { AcademiesLiveShell, BatchDetailPanel } from "@/features/academies";
import {
  getBatchById,
  getCoachesForTenant,
  getTenantMembersForEnrollment,
  listBatchEnrollments,
  listBatchFees,
  listBatchSessions,
} from "@/features/academies/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

interface BatchDetailPageProps {
  params: Promise<{ id: string; batchId: string }>;
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { id: programId, batchId } = await params;
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!canManageAcademy(context.appRole)) redirect("/academies");

  const batch = await getBatchById(batchId);
  if (!batch) notFound();

  const [enrollments, sessions, fees, coaches, members] = await Promise.all([
    listBatchEnrollments(batchId),
    listBatchSessions(batchId),
    listBatchFees(batchId),
    getCoachesForTenant(),
    getTenantMembersForEnrollment(),
  ]);

  const canManage = canManageOrganization(context.appRole);
  const canCoach = context.appRole === "coach" || canManage;

  return (
    <AcademiesLiveShell tenantId={context.activeTenant?.tenantId}>
      <div className="space-y-6">
        <PageHeader
          title={batch.name}
          description={batch.program?.name ?? "Training batch"}
        />
        <BatchDetailPanel
          batch={batch}
          enrollments={enrollments}
          sessions={sessions}
          fees={fees}
          coaches={coaches}
          members={members}
          programId={programId}
          canManage={canManage}
          canCoach={canCoach}
        />
      </div>
    </AcademiesLiveShell>
  );
}
