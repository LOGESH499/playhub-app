"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ACADEMY_TYPES, ACADEMY_LABELS } from "@/lib/database/enums";

interface AcademiesFiltersProps {
  canManage: boolean;
}

export function AcademiesFilters({ canManage }: AcademiesFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`/academies?${next.toString()}`);
  }

  return (
    <form
      className="surface-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const search = String(fd.get("search") ?? "");
        update("search", search);
      }}
    >
      <input
        name="search"
        defaultValue={params.get("search") ?? ""}
        placeholder="Search programs..."
        className="h-9 rounded-md border border-input bg-background px-3 text-sm lg:col-span-2"
      />
      <select
        defaultValue={params.get("academyType") ?? ""}
        onChange={(e) => update("academyType", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">All types</option>
        {ACADEMY_TYPES.map((type) => (
          <option key={type} value={type}>
            {ACADEMY_LABELS[type]}
          </option>
        ))}
      </select>
      {canManage && (
        <select
          defaultValue={params.get("published") ?? ""}
          onChange={(e) => update("published", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All visibility</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      )}
      <select
        defaultValue={params.get("view") ?? "grid"}
        onChange={(e) => update("view", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="grid">Grid</option>
        <option value="list">List</option>
      </select>
    </form>
  );
}
