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
import { cn } from "@/lib/utils";

interface SportIconProps {
  iconName: string | null | undefined;
  className?: string;
}

export function SportIcon({ iconName, className }: SportIconProps) {
  const props = { className: cn("h-4 w-4", className) };

  switch (iconName) {
    case "trophy":
      return <Trophy {...props} />;
    case "circle-dot":
      return <CircleDot {...props} />;
    case "target":
      return <Target {...props} />;
    case "disc":
      return <Disc {...props} />;
    case "wind":
      return <Wind {...props} />;
    case "circle":
      return <Circle {...props} />;
    case "square":
      return <Square {...props} />;
    case "waves":
      return <Waves {...props} />;
    case "dumbbell":
      return <Dumbbell {...props} />;
    default:
      return <Activity {...props} />;
  }
}
