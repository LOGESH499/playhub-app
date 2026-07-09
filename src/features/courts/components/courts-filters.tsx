"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Grid3X3, List, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { CourtFormVenue } from "@/features/courts/lib/types";
import { COURT_SPORT_OPTIONS } from "@/features/courts/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CourtsFiltersProps {
  venues: CourtFormVenue[];
  canManage?: boolean;
}

export function CourtsFilters({ venues, canManage }: CourtsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") ?? ""
  );

  const view = searchParams.get("view") ?? "grid";
  const status = searchParams.get("status") ?? "";
  const venueId = searchParams.get("venueId") ?? "";
  const sportType = searchParams.get("sportType") ?? "";
  const indoor = searchParams.get("isIndoor") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
      if (!("page" in updates)) params.delete("page");
      startTransition(() => {
        router.push(`/courts?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchValue });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courts..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              type="button"
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => updateParams({ view: "grid" })}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => updateParams({ view: "list" })}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {canManage && (
            <Button asChild>
              <Link href="/courts/new">
                <Plus className="h-4 w-4" />
                Add court
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className={cn("flex flex-wrap gap-2", isPending && "opacity-60")}>
        <select
          value={venueId}
          onChange={(e) => updateParams({ venueId: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by venue"
        >
          <option value="">All venues</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </select>

        <select
          value={sportType}
          onChange={(e) => updateParams({ sportType: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by sport"
        >
          <option value="">All sports</option>
          {COURT_SPORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={indoor}
          onChange={(e) => updateParams({ isIndoor: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by indoor/outdoor"
        >
          <option value="">Indoor & outdoor</option>
          <option value="true">Indoor only</option>
          <option value="false">Outdoor only</option>
        </select>
      </div>
    </div>
  );
}
