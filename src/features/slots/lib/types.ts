import type { Tables } from "@/types/database.types";

export type Slot = Tables<"slots">;
export type SlotTemplate = Tables<"slot_templates">;

export interface SlotWithRelations extends Slot {
  resource: { id: string; name: string; sport_type: string } | null;
  venue: { id: string; name: string } | null;
}

export interface SlotsListResult {
  slots: SlotWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SlotFormResource {
  id: string;
  name: string;
  venue_id: string;
  capacity: number;
  default_slot_minutes?: number;
}

export interface SlotFormVenue {
  id: string;
  name: string;
}

export interface CalendarSlot extends SlotWithRelations {
  columnDate?: string;
}
