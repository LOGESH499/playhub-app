export const COURT_MEDIA_BUCKET = "court-media";

export function buildCourtMediaPath(
  tenantId: string,
  courtId: string,
  fileName: string
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${tenantId}/${courtId}/${Date.now()}-${safeName}`;
}

export function getCourtMediaPublicUrl(
  supabaseUrl: string,
  path: string
): string {
  return `${supabaseUrl}/storage/v1/object/public/${COURT_MEDIA_BUCKET}/${path}`;
}
