const BUCKET = "academy-media";

export function buildAcademyMediaPath(
  tenantId: string,
  programId: string,
  fileName: string
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${tenantId}/${programId}/${Date.now()}-${safeName}`;
}

export function getAcademyMediaPublicUrl(
  supabaseUrl: string,
  path: string
): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

export { BUCKET as ACADEMY_MEDIA_BUCKET };
