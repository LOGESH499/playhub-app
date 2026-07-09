import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { listBookings } from "@/features/bookings/lib/queries";
import { listMyEnrollments } from "@/features/academies/lib/queries";
import { getNotificationSummary } from "@/features/dashboard/lib/queries";
import { bookingListFiltersSchema } from "@/lib/validators/booking.schema";
import { parseProfilePortalPreferences } from "@/lib/validators/portal.schema";
import type {
  FavoriteSport,
  FavoriteVenue,
  PortalDashboardData,
  ReviewWithVenue,
  UserPackageWithDetails,
} from "./types";

export { parseProfilePortalPreferences } from "@/lib/validators/portal.schema";

export async function requirePortalUser() {
  const context = await getAuthContext();
  if (!context) return null;
  return context;
}

export async function getPortalDashboard(): Promise<PortalDashboardData | null> {
  const context = await requirePortalUser();
  if (!context) return null;

  const now = new Date().toISOString();
  const supabase = await createClient();

  const [
    upcomingResult,
    { notifications, unreadCount },
    enrollments,
    memberships,
    { count: favVenues },
    { count: favSports },
    { count: reviews },
  ] = await Promise.all([
    listBookings(
      bookingListFiltersSchema.parse({
        page: 1,
        pageSize: 5,
        status: undefined,
      })
    ).then(async (result) => ({
      ...result,
      bookings: result.bookings.filter(
        (b) =>
          b.start_time >= now &&
          (b.status === "pending" || b.status === "confirmed")
      ),
    })),
    getNotificationSummary(context.userId),
    listMyEnrollments(),
    listMyMemberships(),
    supabase
      .from("user_favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("entity_type", "venue"),
    supabase
      .from("user_favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("entity_type", "sport"),
    supabase
      .from("venue_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId),
  ]);

  return {
    upcomingBookings: upcomingResult.bookings,
    recentNotifications: notifications.slice(0, 5),
    enrollments: enrollments.slice(0, 3),
    memberships,
    unreadCount,
    favoriteVenueCount: favVenues ?? 0,
    favoriteSportCount: favSports ?? 0,
    reviewCount: reviews ?? 0,
  };
}

export async function listMyMemberships(): Promise<UserPackageWithDetails[]> {
  const context = await requirePortalUser();
  if (!context) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_packages")
    .select(
      `
      *,
      package:membership_packages (
        id, name, description, credits, valid_days, price, sport_types
      )
    `
    )
    .eq("user_id", context.userId)
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });

  return (data ?? []).map((row) => {
    const { package: pkg, ...rest } = row as typeof row & {
      package: UserPackageWithDetails["package"];
    };
    return { ...rest, package: pkg };
  });
}

export async function listAvailableMembershipPackages() {
  const context = await requirePortalUser();
  if (!context?.activeTenant) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("membership_packages")
    .select("id, name, description, credits, valid_days, price, sport_types")
    .eq("tenant_id", context.activeTenant.tenantId)
    .eq("is_active", true)
    .order("price");

  return data ?? [];
}

export async function listUpcomingBookings() {
  const context = await requirePortalUser();
  if (!context) return [];

  const now = new Date().toISOString();
  const result = await listBookings(
    bookingListFiltersSchema.parse({ page: 1, pageSize: 50 })
  );
  return result.bookings.filter(
    (b) =>
      b.start_time >= now &&
      (b.status === "pending" || b.status === "confirmed")
  );
}

export async function listBookingHistory() {
  const context = await requirePortalUser();
  if (!context) return [];

  const now = new Date().toISOString();
  const result = await listBookings(
    bookingListFiltersSchema.parse({ page: 1, pageSize: 50 })
  );
  return result.bookings.filter(
    (b) =>
      b.start_time < now ||
      b.status === "completed" ||
      b.status === "cancelled" ||
      b.status === "expired"
  );
}

export async function listMyInvoices() {
  const result = await listBookings(
    bookingListFiltersSchema.parse({ page: 1, pageSize: 100 })
  );
  return result.bookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );
}

export async function listFavoriteVenues(): Promise<FavoriteVenue[]> {
  const context = await requirePortalUser();
  if (!context) return [];

  const supabase = await createClient();
  const { data: favs } = await supabase
    .from("user_favorites")
    .select("id, entity_id")
    .eq("user_id", context.userId)
    .eq("entity_type", "venue");

  const ids = (favs ?? []).map((f) => f.entity_id);
  if (ids.length === 0) return [];

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city, slug")
    .in("id", ids)
    .is("deleted_at", null);

  const venueMap = new Map((venues ?? []).map((v) => [v.id, v]));
  return (favs ?? []).map((f) => ({
    id: f.id,
    entity_id: f.entity_id,
    venue: venueMap.get(f.entity_id) ?? null,
  }));
}

export async function listFavoriteSports(): Promise<FavoriteSport[]> {
  const context = await requirePortalUser();
  if (!context) return [];

  const supabase = await createClient();
  const { data: favs } = await supabase
    .from("user_favorites")
    .select("id, entity_id")
    .eq("user_id", context.userId)
    .eq("entity_type", "sport");

  const ids = (favs ?? []).map((f) => f.entity_id);
  if (ids.length === 0) return [];

  const { data: sports } = await supabase
    .from("sports")
    .select("id, name, sport_type")
    .in("id", ids)
    .is("deleted_at", null);

  const sportMap = new Map((sports ?? []).map((s) => [s.id, s]));
  return (favs ?? []).map((f) => ({
    id: f.id,
    entity_id: f.entity_id,
    sport: sportMap.get(f.entity_id) ?? null,
  }));
}

export async function listMyReviews(): Promise<ReviewWithVenue[]> {
  const context = await requirePortalUser();
  if (!context) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_reviews")
    .select(
      `
      *,
      venue:venues ( id, name )
    `
    )
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const { venue, ...review } = row as typeof row & {
      venue: ReviewWithVenue["venue"];
    };
    return { ...review, venue };
  });
}

export async function listAllNotifications() {
  const context = await requirePortalUser();
  if (!context) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, type, read_at, created_at")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    data?.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      readAt: n.read_at,
      createdAt: n.created_at,
    })) ?? []
  );
}

export async function getPortalSettings() {
  const context = await requirePortalUser();
  if (!context) return null;

  return {
    profile: context.profile,
    email: context.email,
    preferences: parseProfilePortalPreferences(context.profile.preferences),
  };
}

export async function getReviewableVenues() {
  const context = await requirePortalUser();
  if (!context) return [];

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("venue_id, venue:venues ( id, name )")
    .eq("user_id", context.userId)
    .eq("status", "completed")
    .is("deleted_at", null);

  const seen = new Map<string, { id: string; name: string }>();
  for (const row of bookings ?? []) {
    const raw = row.venue as
      | { id: string; name: string }
      | { id: string; name: string }[]
      | null;
    const venue = Array.isArray(raw) ? raw[0] ?? null : raw;
    if (venue && !seen.has(venue.id)) seen.set(venue.id, venue);
  }
  return Array.from(seen.values());
}
