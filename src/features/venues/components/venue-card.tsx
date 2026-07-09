import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Venue } from "@/features/venues/lib/types";
import { parseVenueImages } from "@/features/venues/lib/parse";
import { getAmenityLabel } from "@/features/venues/lib/amenities";
import {
  VENUE_STATUS_LABELS,
  VENUE_STATUS_VARIANTS,
} from "@/features/venues/lib/status";
import { VenueMapPreview } from "@/features/venues/components/venue-map";
import { VenueActionsMenu } from "@/features/venues/components/venue-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VenueCardProps {
  venue: Venue;
  canManage?: boolean;
}

export function VenueCard({ venue, canManage }: VenueCardProps) {
  const images = parseVenueImages(venue.images);
  const cover = images.find((img) => img.isCover) ?? images[0];
  const amenities = Array.isArray(venue.amenities)
    ? (venue.amenities as string[]).slice(0, 3)
    : [];

  return (
    <Card className="overflow-hidden">
      {venue.latitude != null && venue.longitude != null ? (
        <VenueMapPreview
          latitude={Number(venue.latitude)}
          longitude={Number(venue.longitude)}
          className="border-b"
        />
      ) : cover ? (
        <div
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${cover.url})` }}
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-muted">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            <Link href={`/venues/${venue.id}/edit`} className="hover:underline">
              {venue.name}
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {venue.city}
            {venue.state ? `, ${venue.state}` : ""}
          </p>
        </div>
        {canManage && <VenueActionsMenu venue={venue} />}
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge variant={VENUE_STATUS_VARIANTS[venue.status]}>
          {VENUE_STATUS_LABELS[venue.status]}
        </Badge>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenities.map((value) => (
              <Badge key={value} variant="outline" className="text-xs">
                {getAmenityLabel(value)}
              </Badge>
            ))}
          </div>
        )}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {venue.address_line1}
        </p>
      </CardContent>
    </Card>
  );
}
