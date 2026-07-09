import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { SportWithCategory } from "@/features/sports/lib/types";
import { SportIcon } from "@/features/sports/components/sport-icon";
import { SPORT_STATUS_LABELS, SPORT_STATUS_VARIANTS } from "@/features/sports/lib/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SportActionsMenu } from "@/features/sports/components/sport-actions-menu";
import { cn } from "@/lib/utils";

interface SportCardProps {
  sport: SportWithCategory;
  canManage?: boolean;
}

export function SportCard({ sport, canManage }: SportCardProps) {
  return (
    <Card className={cn("group relative overflow-hidden surface-card-hover", sport.is_featured && "ring-1 ring-primary/30")}>
      {sport.is_featured && (
        <div className="absolute right-3 top-3 z-10">
          <Badge variant="warning" className="gap-1">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </Badge>
        </div>
      )}

      {sport.image_url ? (
        <div className="relative h-32 w-full bg-muted">
          <Image
            src={sport.image_url}
            alt={sport.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          <SportIcon iconName={sport.icon_name} className="h-12 w-12 text-primary/60" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            <Link href={`/sports/${sport.id}/edit`} className="hover:underline">
              {sport.name}
            </Link>
          </CardTitle>
          {canManage && <SportActionsMenu sport={sport} />}
        </div>
        {sport.category && (
          <p className="text-xs text-muted-foreground">{sport.category.name}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant={SPORT_STATUS_VARIANTS[sport.status]}>
            {SPORT_STATUS_LABELS[sport.status]}
          </Badge>
          <Badge variant="outline">{sport.resource_label}</Badge>
        </div>
        <p className="text-muted-foreground">
          {sport.default_slot_minutes} min slots
          {sport.default_price != null && (
            <> · ₹{Number(sport.default_price).toLocaleString("en-IN")}</>
          )}
        </p>
        {sport.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {sport.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
