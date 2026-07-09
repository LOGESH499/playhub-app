import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { CourtWithVenue } from "@/features/courts/lib/types";
import { parseCourtImages } from "@/features/courts/lib/parse";
import {
  getCourtSportLabel,
  getSurfaceLabel,
} from "@/features/courts/lib/constants";
import {
  RESOURCE_STATUS_LABELS,
  RESOURCE_STATUS_VARIANTS,
} from "@/features/courts/lib/status";
import { CourtActionsMenu } from "@/features/courts/components/court-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourtCardProps {
  court: CourtWithVenue;
  canManage?: boolean;
}

export function CourtCard({ court, canManage }: CourtCardProps) {
  const images = parseCourtImages(court.images);
  const cover = images.find((img) => img.isCover) ?? images[0];

  return (
    <Card className="overflow-hidden">
      {cover ? (
        <div
          className="h-36 bg-cover bg-center"
          style={{ backgroundImage: `url(${cover.url})` }}
        />
      ) : (
        <div className="flex h-36 items-center justify-center bg-muted">
          <LayoutGrid className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            <Link href={`/courts/${court.id}/edit`} className="hover:underline">
              {court.name}
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {court.venue?.name ?? "Unknown venue"}
          </p>
        </div>
        {canManage && <CourtActionsMenu court={court} />}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <Badge variant={RESOURCE_STATUS_VARIANTS[court.status]}>
            {RESOURCE_STATUS_LABELS[court.status]}
          </Badge>
          <Badge variant="outline">{getCourtSportLabel(court.sport_type)}</Badge>
          <Badge variant="outline">{court.is_indoor ? "Indoor" : "Outdoor"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Capacity {court.capacity}
          {court.surface_type ? ` · ${getSurfaceLabel(court.surface_type)}` : ""}
          {court.length_m && court.width_m
            ? ` · ${court.length_m}×${court.width_m}m`
            : ""}
        </p>
      </CardContent>
    </Card>
  );
}
