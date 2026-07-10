"use client";

import { StatusState } from "@/components/layout/status-state";

export default function CourtsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusState
      tone="error"
      title="Something went wrong loading courts"
      description="Please try again."
      action={{ label: "Retry", onClick: reset }}
    />
  );
}
