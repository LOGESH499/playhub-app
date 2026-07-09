import Link from "next/link";
import type { SportWithCategory } from "@/features/sports/lib/types";
import { SportIcon } from "@/features/sports/components/sport-icon";
import { SPORT_STATUS_LABELS, SPORT_STATUS_VARIANTS } from "@/features/sports/lib/icons";
import { Badge } from "@/components/ui/badge";
import { SportActionsMenu } from "@/features/sports/components/sport-actions-menu";

interface SportTableProps {
  sports: SportWithCategory[];
  canManage?: boolean;
}

export function SportTable({ sports, canManage }: SportTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Sport</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Category</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Duration</th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">Price</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canManage && <th className="px-4 py-3 font-medium w-12" />}
          </tr>
        </thead>
        <tbody>
          {sports.map((sport) => (
              <tr key={sport.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/sports/${sport.id}/edit`}
                    className="flex items-center gap-3 font-medium hover:underline"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                      <SportIcon iconName={sport.icon_name} className="text-primary" />
                    </div>
                    <div>
                      <span>{sport.name}</span>
                      {sport.is_featured && (
                        <Badge variant="warning" className="ml-2 text-[10px]">
                          Featured
                        </Badge>
                      )}
                      <p className="text-xs font-normal text-muted-foreground">
                        {sport.resource_label}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {sport.category?.name ?? "—"}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {sport.default_slot_minutes} min
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {sport.default_price != null
                    ? `₹${Number(sport.default_price).toLocaleString("en-IN")}`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={SPORT_STATUS_VARIANTS[sport.status]}>
                    {SPORT_STATUS_LABELS[sport.status]}
                  </Badge>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <SportActionsMenu sport={sport} />
                  </td>
                )}
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
