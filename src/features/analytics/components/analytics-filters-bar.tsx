"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { AnalyticsFilters } from "@/lib/validators/analytics.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnalyticsFiltersBarProps {
  filters: AnalyticsFilters;
}

export function AnalyticsFiltersBar({ filters }: AnalyticsFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const params = new URLSearchParams(searchParams.toString());
        const start = String(fd.get("startDate"));
        const end = String(fd.get("endDate"));
        if (start) params.set("startDate", start);
        else params.delete("startDate");
        if (end) params.set("endDate", end);
        else params.delete("endDate");
        router.push(`/reports?${params.toString()}`);
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="startDate">From</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={filters.startDate}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="endDate">To</Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={filters.endDate}
        />
      </div>
      <Button type="submit" size="sm">
        Apply
      </Button>
    </form>
  );
}
