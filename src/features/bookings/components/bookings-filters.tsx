"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BookingsFiltersProps {
  venues: { id: string; name: string }[];
  resources: { id: string; name: string; venue_id: string }[];
  canManage?: boolean;
}

export function BookingsFilters({
  venues,
  resources,
}: BookingsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const venueId = searchParams.get("venueId") ?? "";
  const resourceId = searchParams.get("resourceId") ?? "";
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const filteredResources = resources.filter(
    (r) => !venueId || r.venue_id === venueId
  );

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    router.push(`/bookings?${params.toString()}`);
  }

  return (
    <div className="surface-card space-y-3 p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Input
          placeholder="Search code or notes..."
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParams({ search: (e.target as HTMLInputElement).value });
            }
          }}
        />
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value || undefined })}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={venueId}
          onChange={(e) =>
            updateParams({
              venueId: e.target.value || undefined,
              resourceId: undefined,
            })
          }
        >
          <option value="">All venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={resourceId}
          onChange={(e) =>
            updateParams({ resourceId: e.target.value || undefined })
          }
        >
          <option value="">All resources</option>
          {filteredResources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/bookings")}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
