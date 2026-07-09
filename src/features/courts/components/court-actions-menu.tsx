"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, MoreHorizontal, Pencil, Power, Trash2, Wrench } from "lucide-react";
import type { CourtWithVenue } from "@/features/courts/lib/types";
import {
  archiveCourtAction,
  deleteCourtAction,
  updateCourtStatusAction,
} from "@/features/courts/actions/court.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourtActionsMenuProps {
  court: CourtWithVenue;
}

export function CourtActionsMenu({ court }: CourtActionsMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.error) router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/courts/${court.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        {court.status === "active" ? (
          <>
            <DropdownMenuItem
              onClick={() => run(() => updateCourtStatusAction(court.id, "maintenance"))}
            >
              <Wrench className="h-4 w-4" />
              Maintenance
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => run(() => updateCourtStatusAction(court.id, "inactive"))}
            >
              <Power className="h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          </>
        ) : court.status === "maintenance" || court.status === "inactive" ? (
          <DropdownMenuItem
            onClick={() => run(() => updateCourtStatusAction(court.id, "active"))}
          >
            <Power className="h-4 w-4" />
            Activate
          </DropdownMenuItem>
        ) : null}
        {court.status !== "archived" && (
          <DropdownMenuItem onClick={() => run(() => archiveCourtAction(court.id))}>
            <Archive className="h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => run(() => deleteCourtAction(court.id))}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
