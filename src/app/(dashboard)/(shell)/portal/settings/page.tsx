import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { PortalLiveShell, PortalSettingsForm } from "@/features/portal";
import { getPortalSettings } from "@/features/portal/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function PortalSettingsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/settings");

  const settings = await getPortalSettings();
  if (!settings) redirect("/login");

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Notification preferences and account options"
        />
        <PortalSettingsForm preferences={settings.preferences} />
      </div>
    </PortalLiveShell>
  );
}
