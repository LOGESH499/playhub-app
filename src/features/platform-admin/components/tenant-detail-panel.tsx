"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateSubscriptionAction,
  updateTenantStatusAction,
} from "@/features/platform-admin/actions/platform-admin.actions";
import type { TenantWithSubscription } from "@/features/platform-admin/lib/types";
import { TIER_LABELS } from "@/lib/validators/platform.schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TenantDetailPanelProps {
  tenant: TenantWithSubscription;
}

export function TenantDetailPanel({ tenant }: TenantDetailPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="surface-card space-y-3 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{tenant.name}</h2>
          <Badge variant={tenant.status === "active" ? "success" : "secondary"}>
            {tenant.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
        <p className="text-sm">
          Members: {tenant.memberCount ?? 0} · Created{" "}
          {new Date(tenant.createdAt).toLocaleDateString()}
        </p>
        {tenant.contactEmail && (
          <p className="text-sm text-muted-foreground">{tenant.contactEmail}</p>
        )}
      </div>

      {tenant.subscription && (
        <div className="surface-card space-y-3 p-6">
          <h3 className="font-semibold">Subscription (free mode)</h3>
          <p className="text-sm">
            Plan:{" "}
            {TIER_LABELS[tenant.subscription.tier as keyof typeof TIER_LABELS] ??
              tenant.subscription.tier}{" "}
            · Status: {tenant.subscription.status}
          </p>
          <p className="text-sm text-muted-foreground">
            Limits: {tenant.subscription.seatsLimit} seats,{" "}
            {tenant.subscription.venuesLimit} venues
          </p>
          <p className="text-xs text-muted-foreground">
            Pro and Enterprise tiers are configured but billing is not enabled —
            all tenants default to free.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updateTenantStatusAction({
                tenantId: tenant.id,
                status: tenant.status === "active" ? "suspended" : "active",
              });
              router.refresh();
            })
          }
        >
          {tenant.status === "active" ? "Suspend tenant" : "Activate tenant"}
        </Button>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updateSubscriptionAction({
                tenantId: tenant.id,
                seatsLimit: (tenant.subscription?.seatsLimit ?? 10) + 5,
              });
              router.refresh();
            })
          }
        >
          Increase seat limit (+5)
        </Button>
      </div>
    </div>
  );
}
