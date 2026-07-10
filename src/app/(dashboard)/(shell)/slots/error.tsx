"use client";

import { useEffect } from "react";
import { StatusState } from "@/components/layout/status-state";

export default function SlotsError({
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
      title="Could not load slots"
      description={error.message || "Something went wrong while loading the schedule."}
      action={{ label: "Try again", onClick: reset }}
    />
  );
}
