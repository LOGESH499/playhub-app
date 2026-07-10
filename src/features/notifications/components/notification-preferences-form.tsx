"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateNotificationPreferencesAction } from "@/features/notifications/actions/notification-center.actions";
import type { NotificationPreferences } from "@/lib/validators/notification.schema";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences;
}

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState(preferences);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fields: { key: keyof NotificationPreferences; label: string }[] = [
    { key: "emailNotifications", label: "Email notifications" },
    { key: "bookingReminders", label: "Booking reminders" },
    { key: "academyReminders", label: "Academy session reminders" },
    { key: "announcements", label: "Announcements & broadcasts" },
    { key: "maintenanceAlerts", label: "Maintenance alerts" },
    { key: "marketingEmails", label: "Marketing emails" },
  ];

  return (
    <div className="surface-card max-w-xl space-y-4 p-6">
      <h3 className="font-semibold">Notification preferences</h3>
      <p className="text-sm text-muted-foreground">
        In-app notifications are always delivered. Email follows these toggles.
      </p>
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {fields.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <span>{label}</span>
          <input
            type="checkbox"
            checked={prefs[key]}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, [key]: e.target.checked }))
            }
          />
        </label>
      ))}

      <Button
        disabled={isPending}
        onClick={() => {
          setError(null);
          setSuccess(null);
          startTransition(async () => {
            const result = await updateNotificationPreferencesAction(prefs);
            if (result.error) setError(result.error);
            else setSuccess(result.success ?? "Saved");
          });
        }}
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save preferences
      </Button>
    </div>
  );
}
