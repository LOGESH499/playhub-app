import type { UserPackageWithDetails } from "@/features/portal/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PortalMembershipPanelProps {
  memberships: UserPackageWithDetails[];
  packages: Array<{
    id: string;
    name: string;
    description: string | null;
    credits: number | null;
    valid_days: number;
    price: number;
  }>;
}

export function PortalMembershipPanel({
  memberships,
  packages,
}: PortalMembershipPanelProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-semibold">Your memberships</h3>
        {memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active membership packages. Contact your venue to purchase a plan.
          </p>
        ) : (
          <ul className="space-y-3">
            {memberships.map((m) => (
              <li key={m.id} className="surface-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{m.package?.name ?? "Package"}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.package?.description}
                    </p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Credits left</p>
                    <p className="font-medium">{m.credits_remaining ?? "Unlimited"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p className="font-medium">
                      {new Date(m.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purchased</p>
                    <p className="font-medium">
                      {new Date(m.purchased_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {packages.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold">Available packages</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {packages.map((pkg) => (
              <li key={pkg.id} className="surface-card p-4">
                <p className="font-medium">{pkg.name}</p>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                <p className="mt-2 text-lg font-semibold">
                  ₹{Number(pkg.price).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pkg.credits ?? "Unlimited"} credits · {pkg.valid_days} days
                </p>
                <Button className="mt-3" variant="outline" size="sm" disabled>
                  Contact venue to purchase
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
