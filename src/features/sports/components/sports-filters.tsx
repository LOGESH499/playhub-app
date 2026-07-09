"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Grid3X3, List, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { SportCategory } from "@/features/sports/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SportsFiltersProps {
  categories: SportCategory[];
  canManage?: boolean;
}

export function SportsFilters({ categories, canManage }: SportsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") ?? ""
  );

  const view = searchParams.get("view") ?? "grid";
  const status = searchParams.get("status") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const featured = searchParams.get("featured") === "true";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
      if (!("page" in updates)) params.delete("page");
      startTransition(() => {
        router.push(`/sports?${params.toString()}`);
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
            placeholder="Search sports..."
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
              <Link href="/sports/new">
                <Plus className="h-4 w-4" />
                Add sport
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
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={categoryId}
          onChange={(e) => updateParams({ categoryId: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant={featured ? "default" : "outline"}
          size="sm"
          onClick={() => updateParams({ featured: featured ? null : "true" })}
        >
          Featured only
        </Button>
      </div>
    </div>
  );
}
