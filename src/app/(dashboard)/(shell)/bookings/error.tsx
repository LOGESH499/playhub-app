"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function BookingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="surface-card">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Something went wrong loading bookings.
        </p>
        <Button onClick={reset}>Try again</Button>
      </CardContent>
    </Card>
  );
}
