"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { ACADEMY_LABELS } from "@/lib/database/enums";
import type { ProgramWithRelations } from "@/features/academies/lib/types";

const columns: ColumnDef<ProgramWithRelations>[] = [
  {
    accessorKey: "name",
    header: "Program",
    cell: ({ row }) => (
      <Link
        href={`/academies/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "venue",
    header: "Venue",
    cell: ({ row }) => row.original.venue?.name ?? "—",
  },
  {
    accessorKey: "academy_type",
    header: "Type",
    cell: ({ row }) => ACADEMY_LABELS[row.original.academy_type],
  },
  {
    accessorKey: "is_published",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.is_published ? "success" : "secondary"}>
        {row.original.is_published ? "Published" : "Draft"}
      </Badge>
    ),
  },
];

interface AcademyProgramTableProps {
  programs: ProgramWithRelations[];
}

export function AcademyProgramTable({ programs }: AcademyProgramTableProps) {
  return <DataTable columns={columns} data={programs} />;
}
