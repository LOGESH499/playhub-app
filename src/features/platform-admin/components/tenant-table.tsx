"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateTenantStatusAction } from "@/features/platform-admin/actions/platform-admin.actions";
import type { TenantWithSubscription } from "@/features/platform-admin/lib/types";
import { TIER_LABELS } from "@/lib/validators/platform.schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TenantTableProps {
  tenants: TenantWithSubscription[];
  showActions?: boolean;
}

export function TenantTable({ tenants, showActions }: TenantTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (tenants.length === 0) {
    return <p className="text-sm text-muted-foreground">No tenants found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Created</TableHead>
            {showActions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link href={`/platform/tenants/${t.id}`} className="font-medium hover:underline">
                  {t.name}
                </Link>
                <p className="text-xs text-muted-foreground">{t.slug}</p>
              </TableCell>
              <TableCell>
                <Badge variant={t.status === "active" ? "success" : "secondary"}>
                  {t.status}
                </Badge>
              </TableCell>
              <TableCell>
                {t.subscription
                  ? TIER_LABELS[t.subscription.tier as keyof typeof TIER_LABELS] ?? t.subscription.tier
                  : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(t.createdAt).toLocaleDateString()}
              </TableCell>
              {showActions && (
                <TableCell>
                  {t.status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await updateTenantStatusAction({
                            tenantId: t.id,
                            status: "suspended",
                          });
                          router.refresh();
                        })
                      }
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await updateTenantStatusAction({
                            tenantId: t.id,
                            status: "active",
                          });
                          router.refresh();
                        })
                      }
                    >
                      Activate
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
