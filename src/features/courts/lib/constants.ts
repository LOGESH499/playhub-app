import type { CourtSportType } from "@/lib/validators/court.schema";

export const COURT_SPORT_OPTIONS: {
  value: CourtSportType;
  label: string;
  defaultSubtype: string;
}[] = [
  { value: "football", label: "Football Turf", defaultSubtype: "turf" },
  { value: "cricket", label: "Cricket Ground", defaultSubtype: "ground" },
  { value: "cricket_nets", label: "Cricket Nets", defaultSubtype: "nets" },
  { value: "pickleball", label: "Pickleball", defaultSubtype: "court" },
  { value: "tennis", label: "Tennis", defaultSubtype: "court" },
  { value: "badminton", label: "Badminton", defaultSubtype: "court" },
  { value: "squash", label: "Squash", defaultSubtype: "court" },
  { value: "basketball", label: "Basketball", defaultSubtype: "court" },
  { value: "volleyball", label: "Volleyball", defaultSubtype: "court" },
  { value: "swimming", label: "Swimming Lanes", defaultSubtype: "lane" },
  { value: "running_track", label: "Running Track", defaultSubtype: "track" },
];

export const SURFACE_TYPE_OPTIONS = [
  { value: "synthetic", label: "Synthetic" },
  { value: "grass", label: "Grass" },
  { value: "turf", label: "Artificial turf" },
  { value: "clay", label: "Clay" },
  { value: "hardwood", label: "Hardwood" },
  { value: "concrete", label: "Concrete" },
  { value: "rubber", label: "Rubber" },
  { value: "acrylic", label: "Acrylic" },
] as const;

export function getCourtSportLabel(sportType: CourtSportType): string {
  return (
    COURT_SPORT_OPTIONS.find((option) => option.value === sportType)?.label ??
    sportType
  );
}

export function getSurfaceLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return (
    SURFACE_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}
