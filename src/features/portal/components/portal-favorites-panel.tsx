"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toggleFavoriteAction } from "@/features/portal/actions/portal.actions";
import type { FavoriteSport, FavoriteVenue } from "@/features/portal/lib/types";
import { SPORT_LABELS } from "@/lib/database/enums";
import type { SportType } from "@/lib/database/enums";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

interface PortalFavoritesPanelProps {
  venues: FavoriteVenue[];
  sports: FavoriteSport[];
}

export function PortalFavoritesPanel({ venues, sports }: PortalFavoritesPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove(entityType: "venue" | "sport", entityId: string) {
    setError(null);
    startTransition(async () => {
      const result = await toggleFavoriteAction({ entityType, entityId });
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <section className="space-y-3">
        <h3 className="font-semibold">Favorite venues</h3>
        {venues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No favorite venues yet.</p>
        ) : (
          <ul className="space-y-2">
            {venues.map((f) => (
              <li
                key={f.id}
                className="surface-card flex items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">{f.venue?.name ?? "Venue"}</p>
                  <p className="text-sm text-muted-foreground">{f.venue?.city}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => remove("venue", f.entity_id)}
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Favorite sports</h3>
        {sports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No favorite sports yet.</p>
        ) : (
          <ul className="space-y-2">
            {sports.map((f) => (
              <li
                key={f.id}
                className="surface-card flex items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">{f.sport?.name ?? "Sport"}</p>
                  {f.sport?.sport_type && (
                    <p className="text-sm text-muted-foreground">
                      {SPORT_LABELS[f.sport.sport_type as SportType]}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => remove("sport", f.entity_id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button asChild variant="outline">
        <Link href="/venues">Browse venues</Link>
      </Button>
    </div>
  );
}
