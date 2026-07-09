-- PLAYHUB Module 6: Venue Management
-- Idempotent: safe on fresh DB, partial failure retry, and already-migrated DB.

-- ─── venue_status enum ──────────────────────────────────────────────────────

DO $$
BEGIN
  CREATE TYPE public.venue_status AS ENUM (
    'draft',
    'active',
    'inactive',
    'maintenance',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── venues.status ──────────────────────────────────────────────────────────

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS status public.venue_status NOT NULL DEFAULT 'draft';

UPDATE public.venues
SET status = CASE
  WHEN is_published THEN 'active'::public.venue_status
  ELSE 'draft'::public.venue_status
END
WHERE status IS DISTINCT FROM CASE
  WHEN is_published THEN 'active'::public.venue_status
  ELSE 'draft'::public.venue_status
END;

CREATE INDEX IF NOT EXISTS venues_status_idx ON public.venues(status) WHERE deleted_at IS NULL;

-- Sync is_published from status for public listings
CREATE OR REPLACE FUNCTION public.sync_venue_published_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_published := (NEW.status = 'active');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS venues_sync_published ON public.venues;
CREATE TRIGGER venues_sync_published
  BEFORE INSERT OR UPDATE OF status ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.sync_venue_published_status();

-- Backfill published flag for existing rows
UPDATE public.venues
SET status = status
WHERE status IS NOT NULL;

-- ─── Venue holidays ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.venue_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  is_recurring_yearly BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS venue_holidays_venue_date_unique
  ON public.venue_holidays(venue_id, holiday_date);

CREATE INDEX IF NOT EXISTS venue_holidays_tenant_id_idx ON public.venue_holidays(tenant_id);
CREATE INDEX IF NOT EXISTS venue_holidays_venue_id_idx ON public.venue_holidays(venue_id);

DROP TRIGGER IF EXISTS venue_holidays_updated_at ON public.venue_holidays;
CREATE TRIGGER venue_holidays_updated_at
  BEFORE UPDATE ON public.venue_holidays
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Audit helper ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_venue_audit(
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
    'venue',
    p_entity_id,
    p_old_values,
    p_new_values
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_venue_audit(UUID, TEXT, UUID, JSONB, JSONB) TO authenticated;

-- ─── RLS: venue_holidays ────────────────────────────────────────────────────

ALTER TABLE public.venue_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venue_holidays_select_member" ON public.venue_holidays;
CREATE POLICY "venue_holidays_select_member"
  ON public.venue_holidays FOR SELECT
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "venue_holidays_select_public" ON public.venue_holidays;
CREATE POLICY "venue_holidays_select_public"
  ON public.venue_holidays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.id = venue_holidays.venue_id
        AND v.status = 'active'
        AND v.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "venue_holidays_manage_manager" ON public.venue_holidays;
CREATE POLICY "venue_holidays_manage_manager"
  ON public.venue_holidays FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

-- ─── Update venue public select policy ──────────────────────────────────────

DROP POLICY IF EXISTS "venues_select_public" ON public.venues;

CREATE POLICY "venues_select_public"
  ON public.venues FOR SELECT
  USING (status = 'active' AND deleted_at IS NULL);
