import { getAuthContext } from "@/lib/auth/session";
import { getNotificationSummary } from "@/features/dashboard/lib/queries";
import { DashboardShell } from "@/features/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();

  if (!context) {
    return null;
  }

  const { notifications, unreadCount } = await getNotificationSummary(
    context.userId
  );

  return (
    <DashboardShell
      context={context}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
