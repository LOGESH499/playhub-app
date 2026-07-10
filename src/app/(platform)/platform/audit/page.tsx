import { listAuditLogs } from "@/features/platform-admin/lib/queries";
import { AuditLogTable } from "@/features/platform-admin";

export const dynamic = "force-dynamic";

export default async function PlatformAuditPage() {
  const logs = await listAuditLogs(150);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit logs</h1>
        <p className="mt-1 text-muted-foreground">
          Platform-wide activity trail
        </p>
      </div>
      <AuditLogTable logs={logs} />
    </div>
  );
}
