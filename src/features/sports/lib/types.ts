import type { Tables } from "@/types/database.types";

export type Sport = Tables<"sports">;
export type SportCategory = Tables<"sport_categories">;
export type VenueSport = Tables<"venue_sports">;

export interface SportWithCategory extends Sport {
  category: Pick<SportCategory, "id" | "name" | "slug"> | null;
  venue_count?: number;
}

export interface SportsListResult {
  sports: SportWithCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SportFormVenue {
  id: string;
  name: string;
  assigned: boolean;
}
