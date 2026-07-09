"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { BookingWithRelations } from "@/features/bookings/lib/types";
import { BOOKING_STATUS_LABELS } from "@/lib/validators/booking.schema";
import { BOOKING_STATUS_VARIANTS } from "@/features/bookings/lib/status";
import { formatTimeRange } from "@/features/slots/lib/calendar";
import { BookingActionsMenu } from "@/features/bookings/components/booking-actions-menu";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";

interface BookingTableProps {
  bookings: BookingWithRelations[];
  canManage?: boolean;
}

export function BookingTable({ bookings, canManage }: BookingTableProps) {
  const columns = useMemo<ColumnDef<BookingWithRelations>[]>(() => {
    const cols: ColumnDef<BookingWithRelations>[] = [
      {
        accessorKey: "confirmation_code",
        header: "Code",
        cell: ({ row }) => (
          <Link
            href={`/bookings/${row.original.id}`}
            className="font-mono text-xs font-medium hover:underline"
          >
            {row.original.confirmation_code ?? row.original.id.slice(0, 8)}
          </Link>
        ),
      },
      {
        id: "when",
        header: "When",
        accessorFn: (row) => row.start_time,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {new Date(row.original.start_time).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTimeRange(row.original.start_time, row.original.end_time)}
            </p>
          </div>
        ),
      },
      {
        id: "venue",
        header: "Venue",
        accessorFn: (row) => row.venue?.name ?? "—",
      },
      {
        id: "resource",
        header: "Resource",
        accessorFn: (row) => row.resource?.name ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={BOOKING_STATUS_VARIANTS[row.original.status]}>
            {BOOKING_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ getValue }) => (
          <span>₹{Number(getValue()).toLocaleString("en-IN")}</span>
        ),
      },
    ];

    if (canManage) {
      cols.splice(4, 0, {
        id: "customer",
        header: "Customer",
        accessorFn: (row) => row.user?.full_name ?? "—",
      });
      cols.push({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <BookingActionsMenu booking={row.original} />,
      });
    }

    return cols;
  }, [canManage]);

  return (
    <DataTable
      columns={columns}
      data={bookings}
      emptyMessage="No bookings found."
    />
  );
}
