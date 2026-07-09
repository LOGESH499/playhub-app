"use client";

import { useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4">
      <Alert variant="destructive">
        Failed to load sports. {error.message || "Please try again."}
      </Alert>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
