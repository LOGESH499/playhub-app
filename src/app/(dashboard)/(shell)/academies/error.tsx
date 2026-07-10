"use client";

import { StatusState } from "@/components/layout/status-state";

export default function AcademiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusState
      tone="error"
      title="Failed to load academies"
      description={error.message}
      action={{ label: "Try again", onClick: reset }}
    />
  );
}
