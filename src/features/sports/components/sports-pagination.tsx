"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SportsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export function SportsPagination({
  page,
  totalPages,
  total,
}: SportsPaginationProps) {
  const searchParams = useSearchParams();

  function pageHref(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    return `/sports?${params.toString()}`;
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {total} sports
      </p>
      <div className="flex gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page <= 1}
        >
          <Link href={pageHref(page - 1)} aria-disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
        >
          <Link href={pageHref(page + 1)} aria-disabled={page >= totalPages}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
