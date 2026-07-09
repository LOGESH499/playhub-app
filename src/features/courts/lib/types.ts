import type { Tables } from "@/types/database.types";

export type Court = Tables<"resources">;
export type OperatingHour = Tables<"operating_hours">;
export type BlackoutPeriod = Tables<"blackout_periods">;
export type PricingRule = Tables<"pricing_rules">;

export interface CourtImage {
  url: string;
  path: string;
  caption?: string;
  sortOrder: number;
  isCover: boolean;
}

export interface EquipmentItem {
  name: string;
  quantity: number;
  included: boolean;
}

export interface CourtWithVenue extends Court {
  venue: { id: string; name: string; city: string } | null;
}

export interface CourtDetail extends Court {
  venue: { id: string; name: string; city: string } | null;
  operatingHours: OperatingHour[];
  blackouts: BlackoutPeriod[];
  pricingRules: PricingRule[];
}

export interface CourtsListResult {
  courts: CourtWithVenue[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CourtFormVenue {
  id: string;
  name: string;
}
