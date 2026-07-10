"use client";

import { useEffect } from "react";
import { StatusState } from "@/components/layout/status-state";

export default function SportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusState
      tone="error"
      title="Failed to load sports"
      description={error.message || "Please try again."}
      action={{ label: "Retry", onClick: reset }}
    />
  );
}
