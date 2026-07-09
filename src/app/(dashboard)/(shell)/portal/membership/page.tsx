import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { PortalLiveShell } from "@/features/portal";
import {
  listAvailableMembershipPackages,
  listMyMemberships,
} from "@/features/portal/lib/queries";
import { PortalMembershipPanel } from "@/features/portal";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Membership" };
export const dynamic = "force-dynamic";

export default async function PortalMembershipPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/membership");

  const [memberships, packages] = await Promise.all([
    listMyMemberships(),
    listAvailableMembershipPackages(),
  ]);

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="space-y-6">
        <PageHeader
          title="Membership"
          description="Active packages, credits, and expiry dates"
        />
        <PortalMembershipPanel memberships={memberships} packages={packages} />
        {!context.activeTenant && (
          <p className="text-sm text-muted-foreground">
            <Link href="/onboarding" className="text-primary hover:underline">
              Join an organization
            </Link>{" "}
            to see available membership packages.
          </p>
        )}
      </div>
    </PortalLiveShell>
  );
}
