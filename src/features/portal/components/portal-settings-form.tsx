"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updatePortalSettingsAction } from "@/features/portal/actions/portal.actions";
import type { PortalPreferences } from "@/lib/validators/portal.schema";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface PortalSettingsFormProps {
  preferences: PortalPreferences;
}

export function PortalSettingsForm({ preferences }: PortalSettingsFormProps) {
  const [prefs, setPrefs] = useState(preferences);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updatePortalSettingsAction(prefs);
      if (result.error) setError(result.error);
      else setSuccess(result.success ?? "Saved");
    });
  }

  return (
    <div className="surface-card max-w-xl space-y-4 p-6">
      <h3 className="font-semibold">Notification preferences</h3>
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Email notifications</span>
        <input
          type="checkbox"
          checked={prefs.emailNotifications}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))
          }
        />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Booking reminders</span>
        <input
          type="checkbox"
          checked={prefs.bookingReminders}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, bookingReminders: e.target.checked }))
          }
        />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Academy reminders</span>
        <input
          type="checkbox"
          checked={prefs.academyReminders}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, academyReminders: e.target.checked }))
          }
        />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Announcements</span>
        <input
          type="checkbox"
          checked={prefs.announcements}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, announcements: e.target.checked }))
          }
        />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Maintenance alerts</span>
        <input
          type="checkbox"
          checked={prefs.maintenanceAlerts}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, maintenanceAlerts: e.target.checked }))
          }
        />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Marketing emails</span>
        <input
          type="checkbox"
          checked={prefs.marketingEmails}
          onChange={(e) =>
            setPrefs((p) => ({ ...p, marketingEmails: e.target.checked }))
          }
        />
      </label>

      <p className="text-xs text-muted-foreground">
        Theme (light / dark / system) is controlled from the top navigation bar.
      </p>

      <Button onClick={save} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save settings
      </Button>
    </div>
  );
}
