import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  NotificationCenterList,
  NotificationsLiveShell,
} from "@/features/notifications";
import { listNotifications } from "@/features/notifications/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { notificationListFiltersSchema } from "@/lib/validators/notification.schema";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function PortalNotificationsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/notifications");

  const result = await listNotifications(
    notificationListFiltersSchema.parse({ pageSize: 50 })
  );

  return (
    <NotificationsLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description="Booking updates, reminders, and academy alerts"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/notifications">Open notification center</Link>
            </Button>
          }
        />
        <NotificationCenterList
          notifications={result.notifications}
          unreadCount={result.unreadCount}
        />
      </div>
    </NotificationsLiveShell>
  );
}

