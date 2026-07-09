-- PLAYHUB Module 8: Slot Management
-- Idempotent: safe on fresh DB, partial failure retry, and already-migrated DB.
-- Depends on: Module 6 (venues.status, venue_holidays), Module 7 (resources.status)

-- ─── Prerequisite repair (Modules 6 & 7 — out-of-sync recovery) ─────────────

DO $$
BEGIN
  CREATE TYPE public.venue_status AS ENUM (
    'draft', 'active', 'inactive', 'maintenance', 'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS status public.venue_status NOT NULL DEFAULT 'draft';

DO $$
BEGIN
  CREATE TYPE public.resource_status AS ENUM (
    'active', 'maintenance', 'inactive', 'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS status public.resource_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS maintenance_until TIMESTAMPTZ;

UPDATE public.resources
SET status = CASE
  WHEN is_active THEN 'active'::public.resource_status
  ELSE 'inactive'::public.resource_status
END
WHERE status IS DISTINCT FROM CASE
  WHEN is_active THEN 'active'::public.resource_status
  ELSE 'inactive'::public.resource_status
END;

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

-- ─── Slot enums ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  CREATE TYPE public.slot_type AS ENUM (
    'standard', 'peak', 'off_peak', 'blocked', 'holiday', 'maintenance'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.slot_status AS ENUM (
    'available', 'blocked', 'booked', 'maintenance', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.slot_recurrence AS ENUM (
    'none', 'daily', 'weekly', 'monthly'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Slot templates (recurring patterns) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.slot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  recurrence public.slot_recurrence NOT NULL DEFAULT 'weekly',
  days_of_week INTEGER[] NOT NULL DEFAULT '{}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL CHECK (slot_duration_minutes > 0),
  buffer_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  peak_price DECIMAL(10, 2) CHECK (peak_price IS NULL OR peak_price >= 0),
  off_peak_price DECIMAL(10, 2) CHECK (off_peak_price IS NULL OR off_peak_price >= 0),
  default_slot_type public.slot_type NOT NULL DEFAULT 'standard',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT slot_templates_time_valid CHECK (end_time > start_time),
  CONSTRAINT slot_templates_days_valid CHECK (
    cardinality(days_of_week) = 0
    OR days_of_week <@ ARRAY[0,1,2,3,4,5,6]
  )
);

CREATE INDEX IF NOT EXISTS slot_templates_tenant_id_idx ON public.slot_templates(tenant_id);
CREATE INDEX IF NOT EXISTS slot_templates_resource_id_idx ON public.slot_templates(resource_id);
CREATE INDEX IF NOT EXISTS slot_templates_active_idx ON public.slot_templates(is_active) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS slot_templates_updated_at ON public.slot_templates;
CREATE TRIGGER slot_templates_updated_at
  BEFORE UPDATE ON public.slot_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS slot_templates_sync_tenant ON public.slot_templates;
CREATE TRIGGER slot_templates_sync_tenant
  BEFORE INSERT ON public.slot_templates
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_resource();

-- ─── Slots (bookable windows) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.slot_templates(id) ON DELETE SET NULL,
  slot_type public.slot_type NOT NULL DEFAULT 'standard',
  recurrence public.slot_recurrence NOT NULL DEFAULT 'none',
  recurring_group_id UUID,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  buffer_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  price_per_slot DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (price_per_slot >= 0),
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
  status public.slot_status NOT NULL DEFAULT 'available',
  block_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT slots_time_valid CHECK (end_time > start_time)
);

-- Prevent overlapping active slots on the same resource
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'slots_no_overlap'
      AND conrelid = 'public.slots'::regclass
  ) THEN
    ALTER TABLE public.slots ADD CONSTRAINT slots_no_overlap
      EXCLUDE USING gist (
        resource_id WITH =,
        tstzrange(start_time, end_time) WITH &&
      ) WHERE (
        status IN ('available', 'blocked', 'booked', 'maintenance')
        AND deleted_at IS NULL
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS slots_tenant_id_idx ON public.slots(tenant_id);
CREATE INDEX IF NOT EXISTS slots_venue_id_idx ON public.slots(venue_id);
CREATE INDEX IF NOT EXISTS slots_resource_time_idx ON public.slots(resource_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS slots_status_idx ON public.slots(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS slots_start_time_idx ON public.slots(start_time) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS slots_recurring_group_idx ON public.slots(recurring_group_id) WHERE recurring_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS slots_template_id_idx ON public.slots(template_id) WHERE template_id IS NOT NULL;

DROP TRIGGER IF EXISTS slots_updated_at ON public.slots;
CREATE TRIGGER slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS slots_sync_tenant ON public.slots;
CREATE TRIGGER slots_sync_tenant
  BEFORE INSERT ON public.slots
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_resource();

-- ─── Validation helper ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.validate_slot_window(
  p_tenant_id UUID,
  p_venue_id UUID,
  p_resource_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_slot_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resource public.resources%ROWTYPE;
  v_day_of_week INTEGER;
  v_slot_start_time TIME;
  v_slot_end_time TIME;
  v_has_hours BOOLEAN := false;
BEGIN
  IF p_end_time <= p_start_time THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'End time must be after start time');
  END IF;

  SELECT * INTO v_resource
  FROM public.resources
  WHERE id = p_resource_id
    AND venue_id = p_venue_id
    AND tenant_id = p_tenant_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Resource not found');
  END IF;

  IF v_resource.status = 'maintenance'
    AND v_resource.maintenance_until IS NOT NULL
    AND p_start_time < v_resource.maintenance_until THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Resource is under maintenance');
  END IF;

  IF v_resource.status = 'inactive' OR v_resource.status = 'archived' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Resource is not active');
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_start_time AT TIME ZONE 'UTC')::INTEGER;
  v_slot_start_time := (p_start_time AT TIME ZONE 'UTC')::TIME;
  v_slot_end_time := (p_end_time AT TIME ZONE 'UTC')::TIME;

  -- Resource-specific hours, then venue hours
  SELECT EXISTS (
    SELECT 1 FROM public.operating_hours oh
    WHERE oh.resource_id = p_resource_id
      AND oh.day_of_week = v_day_of_week
      AND oh.is_closed = false
      AND v_slot_start_time >= oh.open_time
      AND v_slot_end_time <= oh.close_time
  ) OR EXISTS (
    SELECT 1 FROM public.operating_hours oh
    WHERE oh.venue_id = p_venue_id
      AND oh.resource_id IS NULL
      AND oh.day_of_week = v_day_of_week
      AND oh.is_closed = false
      AND v_slot_start_time >= oh.open_time
      AND v_slot_end_time <= oh.close_time
  ) INTO v_has_hours;

  IF NOT v_has_hours THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Outside operating hours');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.venue_holidays vh
    WHERE vh.venue_id = p_venue_id
      AND (
        vh.holiday_date = (p_start_time AT TIME ZONE 'UTC')::DATE
        OR (
          vh.is_recurring_yearly
          AND EXTRACT(MONTH FROM vh.holiday_date) = EXTRACT(MONTH FROM p_start_time AT TIME ZONE 'UTC')
          AND EXTRACT(DAY FROM vh.holiday_date) = EXTRACT(DAY FROM p_start_time AT TIME ZONE 'UTC')
        )
      )
  ) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Venue holiday');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blackout_periods bp
    WHERE bp.venue_id = p_venue_id
      AND (bp.resource_id IS NULL OR bp.resource_id = p_resource_id)
      AND tstzrange(bp.start_time, bp.end_time) && tstzrange(p_start_time, p_end_time)
  ) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Blackout period');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.slots s
    WHERE s.resource_id = p_resource_id
      AND s.deleted_at IS NULL
      AND s.status IN ('available', 'blocked', 'booked', 'maintenance')
      AND (p_exclude_slot_id IS NULL OR s.id <> p_exclude_slot_id)
      AND tstzrange(s.start_time, s.end_time) && tstzrange(p_start_time, p_end_time)
  ) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Overlapping slot');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.resource_id = p_resource_id
      AND b.deleted_at IS NULL
      AND b.status IN ('pending', 'confirmed')
      AND tstzrange(b.start_time, b.end_time) && tstzrange(p_start_time, p_end_time)
  ) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Overlapping booking');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.slot_holds h
    WHERE h.resource_id = p_resource_id
      AND h.expires_at > now()
      AND tstzrange(h.start_time, h.end_time) && tstzrange(p_start_time, p_end_time)
  ) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Active slot hold');
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_slot_window(UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;

-- ─── Audit helper ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_slot_audit(
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
    'slot',
    p_entity_id,
    p_old_values,
    p_new_values
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_slot_audit(UUID, TEXT, UUID, JSONB, JSONB) TO authenticated;

-- ─── RLS: slot_templates ────────────────────────────────────────────────────

ALTER TABLE public.slot_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slot_templates_select_member" ON public.slot_templates;
CREATE POLICY "slot_templates_select_member"
  ON public.slot_templates FOR SELECT
  USING (public.is_tenant_member(tenant_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "slot_templates_manage_manager" ON public.slot_templates;
CREATE POLICY "slot_templates_manage_manager"
  ON public.slot_templates FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

-- ─── RLS: slots ─────────────────────────────────────────────────────────────

ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slots_select_public" ON public.slots;
CREATE POLICY "slots_select_public"
  ON public.slots FOR SELECT
  USING (
    deleted_at IS NULL
    AND status = 'available'
    AND EXISTS (
      SELECT 1 FROM public.resources r
      JOIN public.venues v ON v.id = r.venue_id
      WHERE r.id = slots.resource_id
        AND r.status = 'active'
        AND v.status = 'active'
        AND v.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "slots_select_member" ON public.slots;
CREATE POLICY "slots_select_member"
  ON public.slots FOR SELECT
  USING (public.is_tenant_member(tenant_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "slots_manage_manager" ON public.slots;
CREATE POLICY "slots_manage_manager"
  ON public.slots FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

-- ─── Realtime ───────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'slots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.slots;
  END IF;
END $$;
