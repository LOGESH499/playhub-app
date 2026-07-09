import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { MyEnrollmentsPanel } from "@/features/academies";
import { PortalLiveShell } from "@/features/portal";
import { listMyEnrollments } from "@/features/academies/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "My academies" };
export const dynamic = "force-dynamic";

export default async function PortalAcademiesPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/academies");

  const enrollments = await listMyEnrollments();

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="Academy enrollments"
          description="Your active training batches and programs"
        />
        <MyEnrollmentsPanel enrollments={enrollments} />
      </div>
    </PortalLiveShell>
  );
}
