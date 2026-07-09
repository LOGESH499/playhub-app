-- PLAYHUB Module 2: Realtime publication and storage buckets

-- Realtime: live booking, holds, notifications, attendance
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_holds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;

-- Storage buckets (idempotent via insert on conflict)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('venue-media', 'venue-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('academy-media', 'academy-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Venue media policies
DROP POLICY IF EXISTS "venue_media_select_public" ON storage.objects;
DROP POLICY IF EXISTS "venue_media_insert_manager" ON storage.objects;
DROP POLICY IF EXISTS "venue_media_update_manager" ON storage.objects;
DROP POLICY IF EXISTS "venue_media_delete_manager" ON storage.objects;
CREATE POLICY "venue_media_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'venue-media');

CREATE POLICY "venue_media_insert_manager"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'venue-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

CREATE POLICY "venue_media_update_manager"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'venue-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

CREATE POLICY "venue_media_delete_manager"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'venue-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

-- Academy media policies
DROP POLICY IF EXISTS "academy_media_select_public" ON storage.objects;
DROP POLICY IF EXISTS "academy_media_insert_manager" ON storage.objects;
DROP POLICY IF EXISTS "academy_media_update_manager" ON storage.objects;
DROP POLICY IF EXISTS "academy_media_delete_manager" ON storage.objects;
CREATE POLICY "academy_media_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'academy-media');

CREATE POLICY "academy_media_insert_manager"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'academy-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

CREATE POLICY "academy_media_update_manager"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'academy-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

CREATE POLICY "academy_media_delete_manager"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'academy-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );
