import { Skeleton } from "@/components/ui/skeleton";

export default function SlotsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
