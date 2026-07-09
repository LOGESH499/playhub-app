import Link from "next/link";
import type { CourtWithVenue } from "@/features/courts/lib/types";
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
import { Card } from "@/components/ui/card";

interface CourtTableProps {
  courts: CourtWithVenue[];
  canManage?: boolean;
}

export function CourtTable({ courts, canManage }: CourtTableProps) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Venue</th>
            <th className="p-4 font-medium">Sport</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Capacity</th>
            <th className="p-4 font-medium">Surface</th>
            {canManage && <th className="w-12 p-4" />}
          </tr>
        </thead>
        <tbody>
          {courts.map((court) => (
            <tr key={court.id} className="border-b last:border-0">
              <td className="p-4 font-medium">
                <Link href={`/courts/${court.id}/edit`} className="hover:underline">
                  {court.name}
                </Link>
              </td>
              <td className="p-4">{court.venue?.name ?? "—"}</td>
              <td className="p-4">{getCourtSportLabel(court.sport_type)}</td>
              <td className="p-4">
                <Badge variant={RESOURCE_STATUS_VARIANTS[court.status]}>
                  {RESOURCE_STATUS_LABELS[court.status]}
                </Badge>
              </td>
              <td className="p-4">{court.capacity}</td>
              <td className="p-4 text-muted-foreground">
                {getSurfaceLabel(court.surface_type)}
              </td>
              {canManage && (
                <td className="p-4">
                  <CourtActionsMenu court={court} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
