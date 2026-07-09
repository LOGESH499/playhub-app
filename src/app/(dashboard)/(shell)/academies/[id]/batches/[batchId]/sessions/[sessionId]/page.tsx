import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/roles";
import { AcademiesLiveShell, AttendanceSheet } from "@/features/academies";
import { getSessionWithAttendance } from "@/features/academies/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

interface SessionAttendancePageProps {
  params: Promise<{ id: string; batchId: string; sessionId: string }>;
}

export default async function SessionAttendancePage({
  params,
}: SessionAttendancePageProps) {
  const { sessionId } = await params;
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!canManageAcademy(context.appRole)) redirect("/academies");

  const data = await getSessionWithAttendance(sessionId);
  if (!data) notFound();

  const students = data.enrollments.map((e) => ({
    id: e.student_id,
    full_name: e.student?.full_name ?? "Student",
  }));

  return (
    <AcademiesLiveShell tenantId={context.activeTenant?.tenantId}>
      <div className="space-y-6">
        <PageHeader
          title="Session attendance"
          description={`${data.session.session_date} · ${String(data.session.start_time).slice(0, 5)}`}
        />
        <AttendanceSheet
          sessionId={sessionId}
          students={students}
          existing={data.attendance}
        />
      </div>
    </AcademiesLiveShell>
  );
}
