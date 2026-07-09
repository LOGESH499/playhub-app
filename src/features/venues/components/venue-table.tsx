import Link from "next/link";
import type { Venue } from "@/features/venues/lib/types";
import {
  VENUE_STATUS_LABELS,
  VENUE_STATUS_VARIANTS,
} from "@/features/venues/lib/status";
import { VenueActionsMenu } from "@/features/venues/components/venue-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface VenueTableProps {
  venues: Venue[];
  canManage?: boolean;
}

export function VenueTable({ venues, canManage }: VenueTableProps) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">City</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Address</th>
            {canManage && <th className="p-4 font-medium w-12" />}
          </tr>
        </thead>
        <tbody>
          {venues.map((venue) => (
            <tr key={venue.id} className="border-b last:border-0">
              <td className="p-4 font-medium">
                <Link href={`/venues/${venue.id}/edit`} className="hover:underline">
                  {venue.name}
                </Link>
              </td>
              <td className="p-4">{venue.city}</td>
              <td className="p-4">
                <Badge variant={VENUE_STATUS_VARIANTS[venue.status]}>
                  {VENUE_STATUS_LABELS[venue.status]}
                </Badge>
              </td>
              <td className="p-4 text-muted-foreground">{venue.address_line1}</td>
              {canManage && (
                <td className="p-4">
                  <VenueActionsMenu venue={venue} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
