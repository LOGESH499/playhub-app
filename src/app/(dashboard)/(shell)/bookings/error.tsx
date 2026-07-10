"use client";

import { StatusState } from "@/components/layout/status-state";

export default function BookingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusState
      tone="error"
      title="Something went wrong loading bookings"
      description="Please try again."
      action={{ label: "Try again", onClick: reset }}
    />
  );
}
