"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import type { SportWithCategory } from "@/features/sports/lib/types";
import {
  archiveSportAction,
  deleteSportAction,
  toggleSportStatusAction,
} from "@/features/sports/actions/sports.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SportActionsMenuProps {
  sport: SportWithCategory;
}

export function SportActionsMenu({ sport }: SportActionsMenuProps) {
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
          <Link href={`/sports/${sport.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        {sport.status === "active" ? (
          <DropdownMenuItem onClick={() => run(() => toggleSportStatusAction(sport.id, "disabled"))}>
            <Power className="h-4 w-4" />
            Disable
          </DropdownMenuItem>
        ) : sport.status === "disabled" ? (
          <DropdownMenuItem onClick={() => run(() => toggleSportStatusAction(sport.id, "active"))}>
            <Power className="h-4 w-4" />
            Enable
          </DropdownMenuItem>
        ) : null}
        {sport.status !== "archived" && (
          <DropdownMenuItem onClick={() => run(() => archiveSportAction(sport.id))}>
            <Archive className="h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => run(() => deleteSportAction(sport.id))}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
