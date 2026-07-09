"use client";

import { Alert } from "@/components/ui/alert";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <p className="font-medium">Failed to load portal</p>
        <p className="text-sm">{error.message}</p>
      </Alert>
      <button
        type="button"
        onClick={reset}
        className="text-sm font-medium text-primary hover:underline"
      >
        Try again
      </button>
    </div>
  );
}
