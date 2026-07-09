import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { PortalLiveShell } from "@/features/portal";
import { listMyInvoices } from "@/features/portal/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { BOOKING_STATUS_LABELS } from "@/lib/validators/booking.schema";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

export default async function PortalInvoicesPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/invoices");

  const invoices = await listMyInvoices();

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          description="Download and print booking invoices"
        />

        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {invoices.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">
                    {b.confirmation_code ?? b.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {b.venue?.name} · {new Date(b.start_time).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    ₹{Number(b.amount).toLocaleString()}
                  </span>
                  <Badge variant="outline">
                    {BOOKING_STATUS_LABELS[b.status]}
                  </Badge>
                  <Link
                    href={`/portal/bookings/${b.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View invoice
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PortalLiveShell>
  );
}
