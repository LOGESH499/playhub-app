"use client";

import { useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { upsertReviewAction } from "@/features/portal/actions/portal.actions";
import type { ReviewWithVenue } from "@/features/portal/lib/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface PortalReviewsPanelProps {
  reviews: ReviewWithVenue[];
  reviewableVenues: Array<{ id: string; name: string }>;
}

export function PortalReviewsPanel({
  reviews,
  reviewableVenues,
}: PortalReviewsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [venueId, setVenueId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await upsertReviewAction({ venueId, rating, comment });
      if (result.error) setError(result.error);
      else {
        setSuccess(result.success ?? "Saved");
        setComment("");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="surface-card space-y-4 p-5">
        <h3 className="font-semibold">Write a review</h3>
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <select
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select a venue you visited</option>
          {reviewableVenues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="p-1"
              aria-label={`Rate ${n} stars`}
            >
              <Star
                className={`h-6 w-6 ${
                  n <= rating ? "fill-warning text-warning" : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />

        <Button type="submit" disabled={isPending || !venueId}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit review
        </Button>
      </form>

      <section className="space-y-3">
        <h3 className="font-semibold">Your reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="surface-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{r.venue?.name}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
