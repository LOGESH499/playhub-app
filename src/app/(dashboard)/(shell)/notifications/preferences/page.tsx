import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { NotificationPreferencesForm } from "@/features/notifications";
import { getNotificationPreferences } from "@/features/notifications/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Notification preferences" };
export const dynamic = "force-dynamic";

export default async function NotificationPreferencesPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/notifications/preferences");

  const preferences = await getNotificationPreferences();
  if (!preferences) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification preferences"
        description="Control email delivery for bookings, academies, and broadcasts"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/notifications">Back to center</Link>
          </Button>
        }
      />
      <NotificationPreferencesForm preferences={preferences} />
    </div>
  );
}
