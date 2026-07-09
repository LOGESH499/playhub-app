-- PLAYHUB Module 7: Court & Resource Management

ALTER TYPE public.sport_type ADD VALUE IF NOT EXISTS 'running_track';

CREATE TYPE public.resource_status AS ENUM (
  'active',
  'maintenance',
  'inactive',
  'archived'
);

ALTER TABLE public.resources
  ADD COLUMN description TEXT,
  ADD COLUMN images JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN equipment JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN booking_rules JSONB NOT NULL DEFAULT '{
    "min_advance_hours": 1,
    "max_advance_days": 30,
    "allow_same_day": true,
    "cancellation_hours": 24
  }'::jsonb,
  ADD COLUMN length_m DECIMAL(8, 2) CHECK (length_m IS NULL OR length_m > 0),
  ADD COLUMN width_m DECIMAL(8, 2) CHECK (width_m IS NULL OR width_m > 0),
  ADD COLUMN status public.resource_status NOT NULL DEFAULT 'active',
  ADD COLUMN maintenance_until TIMESTAMPTZ;

UPDATE public.resources
SET status = CASE
  WHEN is_active THEN 'active'::public.resource_status
  ELSE 'inactive'::public.resource_status
END;

CREATE INDEX resources_status_idx ON public.resources(status) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.sync_resource_active_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER resources_sync_active
  BEFORE INSERT OR UPDATE OF status ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.sync_resource_active_status();

UPDATE public.resources SET status = status;

-- ─── Audit helper ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_resource_audit(
  p_tenant_id UUID,
  p_action TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    tenant_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    p_tenant_id,
    auth.uid(),
    p_action,
    'resource',
    p_entity_id,
    p_old_values,
    p_new_values
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_resource_audit(UUID, TEXT, UUID, JSONB, JSONB) TO authenticated;

-- ─── Storage: court-media bucket ────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('court-media', 'court-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "court_media_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'court-media');

CREATE POLICY "court_media_insert_manager"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'court-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

CREATE POLICY "court_media_update_manager"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'court-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

CREATE POLICY "court_media_delete_manager"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'court-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

-- ─── Seed running track sport template ────────────────────────────────────────

INSERT INTO public.sports (
  sport_type, slug, name, resource_label, default_slot_minutes, icon_name, status, display_order
)
VALUES (
  'running_track', 'running-track', 'Running Track', 'Lane', 60, 'activity', 'active', 11
)
ON CONFLICT (sport_type) WHERE sport_type IS NOT NULL AND deleted_at IS NULL
DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  updated_at = now();
