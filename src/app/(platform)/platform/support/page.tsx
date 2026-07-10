import { listSupportTickets } from "@/features/platform-admin/lib/queries";
import { SupportTicketsPanel } from "@/features/platform-admin";

export const dynamic = "force-dynamic";

export default async function PlatformSupportPage() {
  const tickets = await listSupportTickets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support tools</h1>
        <p className="mt-1 text-muted-foreground">
          Manage customer support tickets across all organizations
        </p>
      </div>
      <SupportTicketsPanel tickets={tickets} />
    </div>
  );
}
