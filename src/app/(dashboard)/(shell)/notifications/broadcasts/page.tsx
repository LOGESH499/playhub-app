import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import {
  AdminNotificationsPanel,
  BroadcastForm,
} from "@/features/notifications";
import {
  canManageNotifications,
  listBroadcasts,
  listEmailQueue,
} from "@/features/notifications/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Broadcasts & email queue" };
export const dynamic = "force-dynamic";

export default async function NotificationBroadcastsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/notifications/broadcasts");

  if (!canManageNotifications(context.appRole)) {
    redirect("/notifications");
  }

  const [broadcasts, emailQueue] = await Promise.all([
    listBroadcasts(),
    listEmailQueue(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcasts & email queue"
        description="Send announcements, maintenance alerts, and process outbound emails"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/notifications">Back to center</Link>
          </Button>
        }
      />

      <BroadcastForm />
      <AdminNotificationsPanel
        broadcasts={broadcasts}
        emailQueue={emailQueue}
      />
    </div>
  );
}
