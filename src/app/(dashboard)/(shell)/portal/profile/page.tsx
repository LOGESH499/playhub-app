import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { ProfileForm } from "@/features/auth";
import { PortalLiveShell } from "@/features/portal";
import { PageHeader } from "@/components/layout/page-header";
import { RoleBadge } from "@/features/organization";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function PortalProfilePage() {
  const context = await getAuthContext();
  if (!context) redirect("/login?redirectTo=/portal/profile");

  return (
    <PortalLiveShell userId={context.userId}>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Profile" description="Manage your personal information" />
        <RoleBadge role={context.appRole} />
        <ProfileForm
          defaultValues={{
            fullName: context.profile.full_name,
            email: context.profile.email ?? context.email,
            phone: context.profile.phone ?? "",
          }}
        />
      </div>
    </PortalLiveShell>
  );
}
