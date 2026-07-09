"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BookingsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export function BookingsPagination({
  page,
  totalPages,
  total,
}: BookingsPaginationProps) {
  const searchParams = useSearchParams();

  function hrefForPage(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    return `/bookings?${params.toString()}`;
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total} booking{total === 1 ? "" : "s"}
      </span>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link href={hrefForPage(page - 1)}>Previous</Link>
        </Button>
        <span className="flex items-center px-2">
          Page {page} of {totalPages}
        </span>
        <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
          <Link href={hrefForPage(page + 1)}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
