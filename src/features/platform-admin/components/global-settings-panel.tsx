"use client";

import { useState, useTransition } from "react";
import { upsertPlatformSettingAction } from "@/features/platform-admin/actions/platform-admin.actions";
import type { PlatformSetting } from "@/features/platform-admin/lib/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface GlobalSettingsPanelProps {
  settings: PlatformSetting[];
}

export function GlobalSettingsPanel({ settings }: GlobalSettingsPanelProps) {
  const global = settings.find((s) => s.key === "global");
  const [maintenance, setMaintenance] = useState(
    Boolean(global?.value.maintenance_mode)
  );
  const [signup, setSignup] = useState(
    global?.value.signup_enabled !== false
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="surface-card space-y-4 p-6">
      <h3 className="font-semibold">Global platform settings</h3>
      {message && <Alert variant="success">{message}</Alert>}

      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Maintenance mode</span>
        <input
          type="checkbox"
          checked={maintenance}
          onChange={(e) => setMaintenance(e.target.checked)}
        />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Signup enabled</span>
        <input
          type="checkbox"
          checked={signup}
          onChange={(e) => setSignup(e.target.checked)}
        />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Free tier default (all orgs on free plan)</span>
        <input type="checkbox" checked disabled readOnly />
      </label>

      <Button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await upsertPlatformSettingAction({
              key: "global",
              value: {
                maintenance_mode: maintenance,
                signup_enabled: signup,
                free_tier_default: true,
              },
              description: "Global platform toggles",
            });
            setMessage(result.success ?? result.error ?? null);
          })
        }
      >
        Save settings
      </Button>
    </div>
  );
}
