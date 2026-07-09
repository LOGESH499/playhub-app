import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import { APP_ROLE_LABELS, resolveAppRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const context = await getAuthContext();
  if (!context) {
    redirect("/login?redirectTo=/organizations");
  }

  const activeId = context.activeTenant?.tenantId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="mt-1 text-muted-foreground">
            Venues and academies you belong to
          </p>
        </div>
        <Button asChild>
          <Link href="/onboarding">
            <Plus className="h-4 w-4" />
            New organization
          </Link>
        </Button>
      </div>

      {context.memberships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You are not part of any organization yet. Create one or accept an
              invite to get started.
            </p>
            <Button asChild>
              <Link href="/onboarding">Create organization</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {context.memberships.map((membership) => (
            <Card
              key={membership.id}
              className={
                membership.tenantId === activeId ? "ring-2 ring-primary" : ""
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  {membership.tenant.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Slug: {membership.tenant.slug}</p>
                <p>
                  Role:{" "}
                  {APP_ROLE_LABELS[resolveAppRole(false, membership.role)]}
                </p>
                {membership.tenantId === activeId && (
                  <p className="font-medium text-primary">Currently active</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
