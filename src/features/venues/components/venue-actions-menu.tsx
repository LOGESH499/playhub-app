"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import type { Venue } from "@/features/venues/lib/types";
import {
  archiveVenueAction,
  deleteVenueAction,
  updateVenueStatusAction,
} from "@/features/venues/actions/venue.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VenueActionsMenuProps {
  venue: Venue;
}

export function VenueActionsMenu({ venue }: VenueActionsMenuProps) {
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
          <Link href={`/venues/${venue.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        {venue.status === "active" ? (
          <DropdownMenuItem
            onClick={() => run(() => updateVenueStatusAction(venue.id, "inactive"))}
          >
            <Power className="h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        ) : venue.status !== "archived" ? (
          <DropdownMenuItem
            onClick={() => run(() => updateVenueStatusAction(venue.id, "active"))}
          >
            <Power className="h-4 w-4" />
            Activate
          </DropdownMenuItem>
        ) : null}
        {venue.status !== "archived" && (
          <DropdownMenuItem onClick={() => run(() => archiveVenueAction(venue.id))}>
            <Archive className="h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => run(() => deleteVenueAction(venue.id))}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
