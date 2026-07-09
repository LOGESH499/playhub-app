import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SlotsEmptyStateProps {
  canManage?: boolean;
  hasFilters?: boolean;
}

export function SlotsEmptyState({
  canManage,
  hasFilters,
}: SlotsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <CalendarClock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">
            {hasFilters ? "No slots match your filters" : "No slots scheduled"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try a different date range or resource."
              : "Generate slots from a template or create one-time slots."}
          </p>
        </div>
        {canManage && !hasFilters && (
          <Button asChild>
            <Link href="/slots/new">
              <Plus className="h-4 w-4" />
              Create slot
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
