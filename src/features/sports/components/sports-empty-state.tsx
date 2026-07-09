import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SportsEmptyStateProps {
  canManage?: boolean;
  hasFilters?: boolean;
}

export function SportsEmptyState({
  canManage,
  hasFilters,
}: SportsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <Dumbbell className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">
            {hasFilters ? "No sports match your filters" : "No sports yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try adjusting search or filters to find sports."
              : "Add your first sport to start configuring venues and booking rules."}
          </p>
        </div>
        {canManage && !hasFilters && (
          <Button asChild>
            <Link href="/sports/new">Create sport</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
