import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ACADEMY_LABELS } from "@/lib/database/enums";
import type { ProgramWithRelations } from "@/features/academies/lib/types";

interface AcademyProgramCardProps {
  program: ProgramWithRelations;
  canManage: boolean;
}

export function AcademyProgramCard({
  program,
  canManage,
}: AcademyProgramCardProps) {
  return (
    <Link
      href={`/academies/${program.id}`}
      className="surface-card-hover block space-y-3 p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{program.name}</h3>
          <p className="text-sm text-muted-foreground">
            {program.venue?.name ?? "No venue"}
          </p>
        </div>
        {canManage && (
          <Badge variant={program.is_published ? "success" : "secondary"}>
            {program.is_published ? "Published" : "Draft"}
          </Badge>
        )}
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {program.description ?? "No description"}
      </p>
      <Badge variant="outline">
        {ACADEMY_LABELS[program.academy_type]}
      </Badge>
    </Link>
  );
}
