import type { Tables } from "@/types/database.types";

export type Booking = Tables<"bookings">;

export interface BookingWithRelations extends Booking {
  venue: { id: string; name: string } | null;
  resource: { id: string; name: string; sport_type: string } | null;
  user: { id: string; full_name: string; email?: string } | null;
  slot: {
    id: string;
    start_time: string;
    end_time: string;
    price_per_slot: number;
  } | null;
}

export interface BookingsListResult {
  bookings: BookingWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

export interface BookableSlot {
  id: string;
  venue_id: string;
  resource_id: string;
  start_time: string;
  end_time: string;
  price_per_slot: number;
  duration_minutes: number;
  status: string;
  resource: { id: string; name: string; sport_type: string } | null;
  venue: { id: string; name: string } | null;
}
