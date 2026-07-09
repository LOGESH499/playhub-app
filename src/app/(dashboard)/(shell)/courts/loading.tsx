import { Skeleton } from "@/components/ui/skeleton";

export default function CourtsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}
