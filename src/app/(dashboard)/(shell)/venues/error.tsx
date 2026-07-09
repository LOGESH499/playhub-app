"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function VenuesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        Something went wrong loading venues. Please try again.
      </Alert>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
