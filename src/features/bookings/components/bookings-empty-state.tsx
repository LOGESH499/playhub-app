import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BookingsEmptyStateProps {
  hasFilters?: boolean;
}

export function BookingsEmptyState({ hasFilters }: BookingsEmptyStateProps) {
  return (
    <Card className="surface-card">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarPlus className="mb-4 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No bookings yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {hasFilters
            ? "No bookings match your filters. Try adjusting search or date range."
            : "Book an available slot to see your reservations here."}
        </p>
        {!hasFilters && (
          <Button asChild className="mt-6">
            <Link href="/bookings/new">Book a slot</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
