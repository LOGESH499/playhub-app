import { listHealthSnapshots } from "@/features/platform-admin/lib/queries";
import { MonitoringPanel } from "@/features/platform-admin";

export const dynamic = "force-dynamic";

export default async function PlatformMonitoringPage() {
  const snapshots = await listHealthSnapshots();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform monitoring</h1>
        <p className="mt-1 text-muted-foreground">
          System health snapshots — pending emails, tickets, and active bookings
        </p>
      </div>
      <MonitoringPanel snapshots={snapshots} />
    </div>
  );
}
