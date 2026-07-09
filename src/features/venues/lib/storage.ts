const BUCKET = "venue-media";

export function buildVenueMediaPath(
  tenantId: string,
  venueId: string,
  fileName: string
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${tenantId}/${venueId}/${Date.now()}-${safeName}`;
}

export function getVenueMediaPublicUrl(
  supabaseUrl: string,
  path: string
): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

export { BUCKET as VENUE_MEDIA_BUCKET };
