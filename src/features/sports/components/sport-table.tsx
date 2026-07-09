"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { SportWithCategory } from "@/features/sports/lib/types";
import { SportIcon } from "@/features/sports/components/sport-icon";
import { SPORT_STATUS_LABELS, SPORT_STATUS_VARIANTS } from "@/features/sports/lib/icons";
import { SportActionsMenu } from "@/features/sports/components/sport-actions-menu";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";

interface SportTableProps {
  sports: SportWithCategory[];
  canManage?: boolean;
}

export function SportTable({ sports, canManage }: SportTableProps) {
  const columns = useMemo<ColumnDef<SportWithCategory>[]>(() => {
    const cols: ColumnDef<SportWithCategory>[] = [
      {
        accessorKey: "name",
        header: "Sport",
        cell: ({ row }) => {
          const sport = row.original;
          return (
            <Link
              href={`/sports/${sport.id}/edit`}
              className="flex items-center gap-3 font-medium hover:underline"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <SportIcon iconName={sport.icon_name} className="text-primary" />
              </div>
              <div>
                <span>{sport.name}</span>
                {sport.is_featured && (
                  <Badge variant="warning" className="ml-2 text-[10px]">
                    Featured
                  </Badge>
                )}
                <p className="text-xs font-normal text-muted-foreground">
                  {sport.resource_label}
                </p>
              </div>
            </Link>
          );
        },
      },
      {
        id: "category",
        header: "Category",
        accessorFn: (row) => row.category?.name ?? "—",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "default_slot_minutes",
        header: "Duration",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as number} min</span>
        ),
      },
      {
        accessorKey: "default_price",
        header: "Price",
        cell: ({ getValue }) => {
          const price = getValue() as number | null;
          return (
            <span className="text-muted-foreground">
              {price != null ? `₹${Number(price).toLocaleString("en-IN")}` : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={SPORT_STATUS_VARIANTS[row.original.status]}>
            {SPORT_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
    ];

    if (canManage) {
      cols.push({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <SportActionsMenu sport={row.original} />,
      });
    }

    return cols;
  }, [canManage]);

  return (
    <DataTable
      columns={columns}
      data={sports}
      emptyMessage="No sports found."
    />
  );
}
