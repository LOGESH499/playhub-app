import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import { canAccessPlatformAdmin } from "@/lib/auth/roles";
import { OnboardingForm } from "@/features/organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const context = await getAuthContext();
  if (!context) {
    redirect("/login?redirectTo=/onboarding");
  }

  if (canAccessPlatformAdmin(context.appRole)) {
    redirect("/platform");
  }

  if (context.memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Building2 className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="mt-2">Set up your organization</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a venue or academy organization, or continue as a player to
            book courts and join programs.
          </p>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
  );
}
