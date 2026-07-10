import { listSubscriptions } from "@/features/platform-admin/lib/queries";
import { TenantTable } from "@/features/platform-admin";

export const dynamic = "force-dynamic";

export default async function PlatformSubscriptionsPage() {
  const tenants = await listSubscriptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription management</h1>
        <p className="mt-1 text-muted-foreground">
          Free mode — all organizations start on the free tier. Upgrade tiers are
          configured without billing integration.
        </p>
      </div>
      <TenantTable tenants={tenants} />
    </div>
  );
}
