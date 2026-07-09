import Link from "next/link";
import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AcademiesEmptyStateProps {
  canManage: boolean;
  hasFilters: boolean;
}

export function AcademiesEmptyState({
  canManage,
  hasFilters,
}: AcademiesEmptyStateProps) {
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <GraduationCap className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">
          {hasFilters ? "No programs match your filters" : "No academy programs yet"}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {hasFilters
            ? "Try adjusting search or filters."
            : "Create your first academy program to manage batches, coaches, and enrollments."}
        </p>
      </div>
      {canManage && !hasFilters && (
        <Button asChild>
          <Link href="/academies/new">
            <Plus className="h-4 w-4" />
            Create program
          </Link>
        </Button>
      )}
    </div>
  );
}
