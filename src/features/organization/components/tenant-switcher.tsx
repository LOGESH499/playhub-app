"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { switchTenantAction } from "@/features/organization/actions/organization.actions";
import type { TenantMembership } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

interface TenantSwitcherProps {
  memberships: TenantMembership[];
  activeTenantId: string | null;
  className?: string;
}

export function TenantSwitcher({
  memberships,
  activeTenantId,
  className,
}: TenantSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (memberships.length === 0) {
    return null;
  }

  if (memberships.length === 1) {
    const membership = memberships[0];
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground",
          className
        )}
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="truncate font-medium text-foreground">
          {membership.tenant.name}
        </span>
      </div>
    );
  }

  function handleChange(tenantId: string) {
    if (tenantId === activeTenantId) return;

    startTransition(async () => {
      await switchTenantAction({ tenantId });
      router.refresh();
    });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <select
        value={activeTenantId ?? memberships[0]?.tenantId ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="max-w-[200px] truncate rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Switch organization"
      >
        {memberships.map((membership) => (
          <option key={membership.tenantId} value={membership.tenantId}>
            {membership.tenant.name}
          </option>
        ))}
      </select>
    </div>
  );
}
