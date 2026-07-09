"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Grid3X3, List, Plus, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface VenuesFiltersProps {
  cities: string[];
  canManage?: boolean;
}

export function VenuesFilters({ cities, canManage }: VenuesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") ?? ""
  );

  const view = searchParams.get("view") ?? "grid";
  const status = searchParams.get("status") ?? "";
  const city = searchParams.get("city") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
      if (!("page" in updates)) params.delete("page");
      startTransition(() => {
        router.push(`/venues?${params.toString()}`);
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
            placeholder="Search venues..."
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
              <Link href="/venues/new">
                <Plus className="h-4 w-4" />
                Add venue
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className={cn("flex flex-wrap gap-2", isPending && "opacity-60")}>
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={city}
          onChange={(e) => updateParams({ city: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by city"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
