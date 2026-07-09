import type { Tables } from "@/types/database.types";
import type { BookingWithRelations } from "@/features/bookings/lib/types";
import type { EnrollmentWithStudent } from "@/features/academies/lib/types";
import type { DashboardNotification } from "@/features/dashboard/lib/types";

export type UserPackage = Tables<"user_packages">;
export type VenueReview = Tables<"venue_reviews">;
export type UserFavorite = Tables<"user_favorites">;

export interface MembershipPackageRow {
  id: string;
  name: string;
  description: string | null;
  credits: number | null;
  valid_days: number;
  price: number;
  sport_types: string[];
}

export interface UserPackageWithDetails extends UserPackage {
  package: MembershipPackageRow | null;
}

export interface FavoriteVenue {
  id: string;
  entity_id: string;
  venue: { id: string; name: string; city: string | null; slug: string } | null;
}

export interface FavoriteSport {
  id: string;
  entity_id: string;
  sport: { id: string; name: string; sport_type: string | null } | null;
}

export interface ReviewWithVenue extends VenueReview {
  venue: { id: string; name: string } | null;
}

export interface PortalDashboardData {
  upcomingBookings: BookingWithRelations[];
  recentNotifications: DashboardNotification[];
  enrollments: EnrollmentWithStudent[];
  memberships: UserPackageWithDetails[];
  unreadCount: number;
  favoriteVenueCount: number;
  favoriteSportCount: number;
  reviewCount: number;
}
