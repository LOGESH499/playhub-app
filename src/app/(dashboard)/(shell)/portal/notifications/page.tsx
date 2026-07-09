import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  PortalLiveShell,
  PortalNotificationsList,
} from "@/features/portal";
import { listAllNotifications } from "@/features/portal/lib/queries";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function PortalNotificationsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/notifications");

  const notifications = await listAllNotifications();

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description="Booking updates, reminders, and academy alerts"
        />
        <PortalNotificationsList notifications={notifications} />
      </div>
    </PortalLiveShell>
  );
}
