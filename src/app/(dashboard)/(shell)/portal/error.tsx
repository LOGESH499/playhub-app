"use client";

import { StatusState } from "@/components/layout/status-state";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusState
      tone="error"
      title="Failed to load portal"
      description={error.message}
      action={{ label: "Try again", onClick: reset }}
    />
  );
}
