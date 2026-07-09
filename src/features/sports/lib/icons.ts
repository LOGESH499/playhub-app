import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Circle,
  CircleDot,
  Disc,
  Dumbbell,
  Square,
  Target,
  Trophy,
  Waves,
  Wind,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  "circle-dot": CircleDot,
  target: Target,
  disc: Disc,
  wind: Wind,
  circle: Circle,
  square: Square,
  waves: Waves,
  dumbbell: Dumbbell,
  activity: Activity,
};

export function getSportIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Activity;
  return ICON_MAP[iconName] ?? Activity;
}

export const SPORT_STATUS_LABELS: Record<
  "active" | "disabled" | "archived",
  string
> = {
  active: "Active",
  disabled: "Disabled",
  archived: "Archived",
};

export const SPORT_STATUS_VARIANTS: Record<
  "active" | "disabled" | "archived",
  "default" | "secondary" | "outline" | "success" | "warning"
> = {
  active: "success",
  disabled: "secondary",
  archived: "warning",
};
