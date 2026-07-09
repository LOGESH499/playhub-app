-- PLAYHUB Module 7: Court & Resource Management
-- Idempotent: safe on fresh DB, partial failure retry, and already-migrated DB.
-- Depends on: Module 5 (public.sports), Module 4 (public.resources)
-- Note: running_track enum value is added in 20260709000016_01_running_track_enum.sql

-- ─── resource_status enum ───────────────────────────────────────────────────

DO $$
BEGIN
  CREATE TYPE public.resource_status AS ENUM (
    'active',
    'maintenance',
    'inactive',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Extend resources ───────────────────────────────────────────────────────

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS equipment JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS booking_rules JSONB NOT NULL DEFAULT '{
    "min_advance_hours": 1,
    "max_advance_days": 30,
    "allow_same_day": true,
    "cancellation_hours": 24
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS length_m DECIMAL(8, 2),
  ADD COLUMN IF NOT EXISTS width_m DECIMAL(8, 2),
  ADD COLUMN IF NOT EXISTS status public.resource_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS maintenance_until TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'resources'
      AND constraint_name = 'resources_length_m_check'
  ) THEN
    ALTER TABLE public.resources
      ADD CONSTRAINT resources_length_m_check CHECK (length_m IS NULL OR length_m > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'resources'
      AND constraint_name = 'resources_width_m_check'
  ) THEN
    ALTER TABLE public.resources
      ADD CONSTRAINT resources_width_m_check CHECK (width_m IS NULL OR width_m > 0);
  END IF;
END $$;

UPDATE public.resources
SET status = CASE
  WHEN is_active THEN 'active'::public.resource_status
  ELSE 'inactive'::public.resource_status
END
WHERE status IS DISTINCT FROM CASE
  WHEN is_active THEN 'active'::public.resource_status
  ELSE 'inactive'::public.resource_status
END;

CREATE INDEX IF NOT EXISTS resources_status_idx ON public.resources(status) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.sync_resource_active_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS resources_sync_active ON public.resources;
CREATE TRIGGER resources_sync_active
  BEFORE INSERT OR UPDATE OF status ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.sync_resource_active_status();

UPDATE public.resources SET status = status WHERE status IS NOT NULL;

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

DROP POLICY IF EXISTS "court_media_select_public" ON storage.objects;
CREATE POLICY "court_media_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'court-media');

DROP POLICY IF EXISTS "court_media_insert_manager" ON storage.objects;
CREATE POLICY "court_media_insert_manager"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'court-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

DROP POLICY IF EXISTS "court_media_update_manager" ON storage.objects;
CREATE POLICY "court_media_update_manager"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'court-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

DROP POLICY IF EXISTS "court_media_delete_manager" ON storage.objects;
CREATE POLICY "court_media_delete_manager"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'court-media'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'manager')
  );

-- ─── Seed running track sport template ────────────────────────────────────────

DO $$
BEGIN
  IF to_regclass('public.sports') IS NULL THEN
    RAISE WARNING 'Module 7: public.sports missing — skipping running_track seed (apply Module 5 first)';
    RETURN;
  END IF;

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
END $$;
