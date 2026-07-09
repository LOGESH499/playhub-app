"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="text-lg font-semibold">Could not load slots</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "Something went wrong while loading the schedule."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
