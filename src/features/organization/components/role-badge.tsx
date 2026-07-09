import { APP_ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROLE_VARIANTS: Record<
  AppRole,
  "default" | "secondary" | "outline" | "success" | "warning"
> = {
  super_admin: "warning",
  venue_admin: "default",
  coach: "success",
  customer: "secondary",
};

interface RoleBadgeProps {
  role: AppRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge variant={ROLE_VARIANTS[role]} className={cn(className)}>
      {APP_ROLE_LABELS[role]}
    </Badge>
  );
}
