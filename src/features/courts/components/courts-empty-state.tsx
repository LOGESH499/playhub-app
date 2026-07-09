import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CourtsEmptyStateProps {
  canManage?: boolean;
  hasFilters?: boolean;
}

export function CourtsEmptyState({
  canManage,
  hasFilters,
}: CourtsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <LayoutGrid className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">
            {hasFilters ? "No courts match your filters" : "No courts yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try adjusting search or filters."
              : "Add courts, lanes, and pitches to your venues."}
          </p>
        </div>
        {canManage && !hasFilters && (
          <Button asChild>
            <Link href="/courts/new">
              <Plus className="h-4 w-4" />
              Create court
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
