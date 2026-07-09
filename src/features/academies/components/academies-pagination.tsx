"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AcademiesPaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export function AcademiesPagination({
  page,
  totalPages,
  total,
}: AcademiesPaginationProps) {
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(nextPage: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(nextPage));
    return `/academies?${next.toString()}`;
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {total} program{total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
          {page > 1 ? <Link href={hrefFor(page - 1)}>Previous</Link> : <span>Previous</span>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          asChild={page < totalPages}
        >
          {page < totalPages ? (
            <Link href={hrefFor(page + 1)}>Next</Link>
          ) : (
            <span>Next</span>
          )}
        </Button>
      </div>
    </div>
  );
}
