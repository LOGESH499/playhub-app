import type { Tables } from "@/types/database.types";

export type Venue = Tables<"venues">;
export type OperatingHour = Tables<"operating_hours">;
export type VenueHoliday = Tables<"venue_holidays">;
export type BlackoutPeriod = Tables<"blackout_periods">;
export type PricingRule = Tables<"pricing_rules">;

export interface VenueImage {
  url: string;
  path: string;
  caption?: string;
  sortOrder: number;
  isCover: boolean;
}

export interface VenueDetail extends Venue {
  operatingHours: OperatingHour[];
  holidays: VenueHoliday[];
  blackouts: BlackoutPeriod[];
  pricingRules: PricingRule[];
}

export interface VenuesListResult {
  venues: Venue[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
