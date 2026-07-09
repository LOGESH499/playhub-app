"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import type { SlotFormResource, SlotFormVenue } from "@/features/slots/lib/types";
import { SLOT_STATUS_LABELS, SLOT_TYPE_LABELS } from "@/lib/validators/slot.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SlotsFiltersProps {
  venues: SlotFormVenue[];
  resources: SlotFormResource[];
  canManage?: boolean;
}

export function SlotsFilters({
  venues,
  resources,
  canManage,
}: SlotsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") ?? ""
  );

  const view = searchParams.get("view") ?? "week";
  const venueId = searchParams.get("venueId") ?? "";
  const resourceId = searchParams.get("resourceId") ?? "";
  const status = searchParams.get("status") ?? "";
  const slotType = searchParams.get("slotType") ?? "";
  const date = searchParams.get("date") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
      if (!("page" in updates)) params.delete("page");
      startTransition(() => router.push(`/slots?${params.toString()}`));
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ search: searchValue });
          }}
          className="relative min-w-[200px] flex-1 max-w-md"
        >
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search slots..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {(["month", "week", "day", "timeline", "list"] as const).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={view === v ? "default" : "outline"}
              onClick={() => updateParams({ view: v })}
            >
              {v === "timeline" ? "Timeline" : v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
          {canManage && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/slots/templates">Templates</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/slots/new">
                  <Plus className="h-4 w-4" />
                  Add slot
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={cn("flex flex-wrap gap-2", isPending && "opacity-60")}>
        <Input
          type="date"
          value={date}
          onChange={(e) => updateParams({ date: e.target.value })}
          className="h-9 w-auto"
          aria-label="Anchor date"
        />
        <select
          value={venueId}
          onChange={(e) =>
            updateParams({ venueId: e.target.value, resourceId: null })
          }
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          value={resourceId}
          onChange={(e) => updateParams({ resourceId: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All resources</option>
          {resources
            .filter((r) => !venueId || r.venue_id === venueId)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </select>
        <select
          value={slotType}
          onChange={(e) => updateParams({ slotType: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All types</option>
          {Object.entries(SLOT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(SLOT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
