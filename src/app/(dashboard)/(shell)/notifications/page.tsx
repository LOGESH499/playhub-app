import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings, Megaphone } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import {
  NotificationCenterList,
  NotificationFiltersBar,
  NotificationsLiveShell,
} from "@/features/notifications";
import {
  canManageNotifications,
  listNotifications,
} from "@/features/notifications/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { notificationListFiltersSchema } from "@/lib/validators/notification.schema";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Notification Center" };
export const dynamic = "force-dynamic";

interface NotificationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function FiltersSkeleton() {
  return <Skeleton className="h-10 w-full max-w-xl" />;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/notifications");

  const raw = await searchParams;
  const filters = notificationListFiltersSchema.parse({
    type: typeof raw.type === "string" ? raw.type : undefined,
    unreadOnly: typeof raw.unreadOnly === "string" ? raw.unreadOnly : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  });

  const result = await listNotifications(filters);
  const canManage = canManageNotifications(context.appRole);

  return (
    <NotificationsLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="Notification Center"
          description="Realtime alerts, booking & academy reminders, announcements, and history"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/notifications/preferences">
                  <Settings className="h-4 w-4" />
                  Preferences
                </Link>
              </Button>
              {canManage && (
                <Button asChild size="sm">
                  <Link href="/notifications/broadcasts">
                    <Megaphone className="h-4 w-4" />
                    Broadcasts
                  </Link>
                </Button>
              )}
            </div>
          }
        />

        <Suspense fallback={<FiltersSkeleton />}>
          <NotificationFiltersBar />
        </Suspense>

        <NotificationCenterList
          notifications={result.notifications}
          unreadCount={result.unreadCount}
        />

        {result.totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Page {result.page} of {result.totalPages}
          </p>
        )}
      </div>
    </NotificationsLiveShell>
  );
}
