"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface SlotsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export function SlotsPagination({ page, totalPages, total }: SlotsPaginationProps) {
  const searchParams = useSearchParams();

  function buildHref(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    return `/slots?${params.toString()}`;
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Page {page} of {totalPages} ({total} slots)
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} asChild>
          <Link href={buildHref(page - 1)}>Previous</Link>
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
          <Link href={buildHref(page + 1)}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
