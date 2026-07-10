import { listTenants } from "@/features/platform-admin/lib/queries";
import { TenantTable } from "@/features/platform-admin";
import { tenantListFiltersSchema } from "@/lib/validators/platform.schema";

export const dynamic = "force-dynamic";

export default async function PlatformTenantsPage() {
  const result = await listTenants(tenantListFiltersSchema.parse({}));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tenant management</h1>
        <p className="mt-1 text-muted-foreground">
          {result.total} organizations on the platform
        </p>
      </div>
      <TenantTable tenants={result.tenants} showActions />
    </div>
  );
}
