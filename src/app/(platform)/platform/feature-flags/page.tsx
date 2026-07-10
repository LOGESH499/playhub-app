import { listFeatureFlags } from "@/features/platform-admin/lib/queries";
import { FeatureFlagsPanel } from "@/features/platform-admin";

export const dynamic = "force-dynamic";

export default async function PlatformFeatureFlagsPage() {
  const flags = await listFeatureFlags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feature flags</h1>
        <p className="mt-1 text-muted-foreground">
          Toggle modules and rollout controls across the platform
        </p>
      </div>
      <FeatureFlagsPanel flags={flags} />
    </div>
  );
}
