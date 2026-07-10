import type { NotificationKind } from "@/lib/validators/notification.schema";
import { NOTIFICATION_KIND_LABELS } from "@/lib/validators/notification.schema";
import { Badge } from "@/components/ui/badge";

const VARIANTS: Partial<Record<NotificationKind, "default" | "secondary" | "outline" | "success" | "warning">> = {
  booking_confirmation: "success",
  booking_reminder: "default",
  booking_cancelled: "secondary",
  academy_reminder: "default",
  announcement: "outline",
  maintenance: "warning",
  broadcast: "outline",
  payment: "success",
  system: "secondary",
};

interface NotificationTypeBadgeProps {
  type: string;
}

export function NotificationTypeBadge({ type }: NotificationTypeBadgeProps) {
  const label =
    NOTIFICATION_KIND_LABELS[type as NotificationKind] ?? type.replaceAll("_", " ");
  const variant = VARIANTS[type as NotificationKind] ?? "outline";

  return <Badge variant={variant}>{label}</Badge>;
}
