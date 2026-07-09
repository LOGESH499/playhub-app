import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface VenuesEmptyStateProps {
  canManage?: boolean;
  hasFilters?: boolean;
}

export function VenuesEmptyState({
  canManage,
  hasFilters,
}: VenuesEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">
            {hasFilters ? "No venues match your filters" : "No venues yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try adjusting search or filters."
              : "Add your first venue to start managing locations and courts."}
          </p>
        </div>
        {canManage && !hasFilters && (
          <Button asChild>
            <Link href="/venues/new">
              <Plus className="h-4 w-4" />
              Create venue
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
