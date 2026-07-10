"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertFeatureFlagAction } from "@/features/platform-admin/actions/platform-admin.actions";
import type { FeatureFlag } from "@/features/platform-admin/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeatureFlagsPanelProps {
  flags: FeatureFlag[];
}

export function FeatureFlagsPanel({ flags }: FeatureFlagsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {flags.map((flag) => (
        <li key={flag.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-mono text-sm font-medium">{flag.key}</p>
            {flag.description && (
              <p className="text-sm text-muted-foreground">{flag.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Rollout {flag.rolloutPercent}%
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={flag.enabled ? "success" : "secondary"}>
              {flag.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await upsertFeatureFlagAction({
                    key: flag.key,
                    enabled: !flag.enabled,
                    description: flag.description ?? "",
                    rolloutPercent: flag.rolloutPercent,
                  });
                  router.refresh();
                })
              }
            >
              Toggle
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
