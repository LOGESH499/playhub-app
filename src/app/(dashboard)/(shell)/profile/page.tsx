import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { ProfileForm } from "@/features/auth";
import { RoleBadge } from "@/features/organization";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const context = await getAuthContext();
  if (!context) {
    redirect("/login?redirectTo=/profile");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your profile</h1>
        <div className="mt-2">
          <RoleBadge role={context.appRole} />
        </div>
      </div>
      <ProfileForm
        defaultValues={{
          fullName: context.profile.full_name,
          email: context.profile.email ?? context.email,
          phone: context.profile.phone ?? "",
        }}
      />
    </div>
  );
}
