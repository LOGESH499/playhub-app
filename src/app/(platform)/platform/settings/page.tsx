import { listPlatformSettings } from "@/features/platform-admin/lib/queries";
import { GlobalSettingsPanel } from "@/features/platform-admin";

export const dynamic = "force-dynamic";

export default async function PlatformSettingsPage() {
  const settings = await listPlatformSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Global settings</h1>
        <p className="mt-1 text-muted-foreground">
          Platform-wide configuration and maintenance controls
        </p>
      </div>
      <GlobalSettingsPanel settings={settings} />
    </div>
  );
}
