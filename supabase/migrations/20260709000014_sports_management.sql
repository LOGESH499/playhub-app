-- PLAYHUB Module 5: Sports Management

CREATE TYPE public.sport_status AS ENUM ('active', 'disabled', 'archived');

-- ─── Sport categories ───────────────────────────────────────────────────────

CREATE TABLE public.sport_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT sport_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX sport_categories_slug_unique
  ON public.sport_categories (tenant_id, slug)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX sport_categories_name_unique
  ON public.sport_categories (tenant_id, name)
  WHERE deleted_at IS NULL;

CREATE INDEX sport_categories_tenant_id_idx
  ON public.sport_categories(tenant_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER sport_categories_updated_at
  BEFORE UPDATE ON public.sport_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Extend sport_templates → sports ──────────────────────────────────────

ALTER TABLE public.sport_templates RENAME TO sports;

ALTER TABLE public.sports
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN category_id UUID REFERENCES public.sport_categories(id) ON DELETE SET NULL,
  ADD COLUMN slug TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN image_url TEXT,
  ADD COLUMN status public.sport_status NOT NULL DEFAULT 'active',
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN default_price DECIMAL(10, 2) CHECK (default_price IS NULL OR default_price >= 0),
  ADD COLUMN booking_rules JSONB NOT NULL DEFAULT '{
    "min_advance_hours": 1,
    "max_advance_days": 30,
    "allow_same_day": true,
    "cancellation_hours": 24
  }'::jsonb,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill slug from sport_type for platform sports
UPDATE public.sports
SET slug = sport_type::text
WHERE slug IS NULL;

ALTER TABLE public.sports
  ALTER COLUMN slug SET NOT NULL;

-- sport_type optional for custom tenant sports
ALTER TABLE public.sports
  ALTER COLUMN sport_type DROP NOT NULL;

-- Rename display_name → name for clarity
ALTER TABLE public.sports RENAME COLUMN display_name TO name;

-- Unique constraints (soft-delete aware)
DROP INDEX IF EXISTS sport_templates_sport_type_key;
CREATE UNIQUE INDEX sports_sport_type_unique
  ON public.sports (sport_type)
  WHERE sport_type IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX sports_slug_unique
  ON public.sports (tenant_id, slug)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX sports_name_unique
  ON public.sports (tenant_id, name)
  WHERE deleted_at IS NULL;

CREATE INDEX sports_status_idx ON public.sports(status) WHERE deleted_at IS NULL;
CREATE INDEX sports_featured_idx ON public.sports(is_featured) WHERE deleted_at IS NULL AND is_featured = true;
CREATE INDEX sports_display_order_idx ON public.sports(display_order);
CREATE INDEX sports_tenant_id_idx ON public.sports(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX sports_category_id_idx ON public.sports(category_id) WHERE deleted_at IS NULL;

CREATE TRIGGER sports_updated_at
  BEFORE UPDATE ON public.sports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Venue ↔ sport assignments ──────────────────────────────────────────────

CREATE TABLE public.venue_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  default_price DECIMAL(10, 2) CHECK (default_price IS NULL OR default_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT venue_sports_unique UNIQUE (venue_id, sport_id)
);

CREATE INDEX venue_sports_tenant_id_idx ON public.venue_sports(tenant_id);
CREATE INDEX venue_sports_venue_id_idx ON public.venue_sports(venue_id);
CREATE INDEX venue_sports_sport_id_idx ON public.venue_sports(sport_id);

CREATE TRIGGER venue_sports_updated_at
  BEFORE UPDATE ON public.venue_sports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Seed platform categories ─────────────────────────────────────────────────

INSERT INTO public.sport_categories (id, tenant_id, name, slug, description, display_order)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL, 'Court Sports', 'court-sports', 'Indoor and outdoor court-based sports', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NULL, 'Field Sports', 'field-sports', 'Large field and pitch sports', 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NULL, 'Aquatic', 'aquatic', 'Pool and lane-based sports', 3)
ON CONFLICT DO NOTHING;

UPDATE public.sports SET
  category_id = CASE sport_type
    WHEN 'football' THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid
    WHEN 'cricket' THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid
    WHEN 'cricket_nets' THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid
    WHEN 'swimming' THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid
    ELSE 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid
  END,
  display_order = CASE sport_type
    WHEN 'badminton' THEN 1
    WHEN 'football' THEN 2
    WHEN 'cricket' THEN 3
    WHEN 'tennis' THEN 4
    WHEN 'swimming' THEN 5
    ELSE 10
  END,
  is_featured = sport_type IN ('badminton', 'football', 'cricket', 'swimming'),
  status = 'active'
WHERE tenant_id IS NULL;

-- ─── Audit helper ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_sport_audit(
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
    'sport',
    p_entity_id,
    p_old_values,
    p_new_values
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_sport_audit(UUID, TEXT, UUID, JSONB, JSONB) TO authenticated;

-- ─── RLS: sport_categories ──────────────────────────────────────────────────

ALTER TABLE public.sport_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sport_categories_select_all"
  ON public.sport_categories FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "sport_categories_manage_platform"
  ON public.sport_categories FOR ALL
  USING (
    tenant_id IS NULL AND public.is_platform_admin()
  )
  WITH CHECK (
    tenant_id IS NULL AND public.is_platform_admin()
  );

CREATE POLICY "sport_categories_manage_tenant"
  ON public.sport_categories FOR ALL
  USING (
    tenant_id IS NOT NULL
    AND public.has_tenant_role(tenant_id, 'admin')
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    AND public.has_tenant_role(tenant_id, 'admin')
  );

-- ─── RLS: sports (replaces sport_templates policies) ────────────────────────

DROP POLICY IF EXISTS "sport_templates_select_all" ON public.sports;
DROP POLICY IF EXISTS "sport_templates_manage_platform" ON public.sports;

CREATE POLICY "sports_select_active"
  ON public.sports FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      tenant_id IS NULL
      OR public.is_tenant_member(tenant_id)
      OR public.is_platform_admin()
    )
  );

CREATE POLICY "sports_select_platform_admin_archived"
  ON public.sports FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "sports_manage_platform"
  ON public.sports FOR ALL
  USING (
    tenant_id IS NULL AND public.is_platform_admin()
  )
  WITH CHECK (
    tenant_id IS NULL AND public.is_platform_admin()
  );

CREATE POLICY "sports_manage_tenant_admin"
  ON public.sports FOR ALL
  USING (
    tenant_id IS NOT NULL
    AND public.has_tenant_role(tenant_id, 'admin')
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    AND public.has_tenant_role(tenant_id, 'admin')
  );

-- ─── RLS: venue_sports ──────────────────────────────────────────────────────

ALTER TABLE public.venue_sports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_sports_select_member"
  ON public.venue_sports FOR SELECT
  USING (public.is_tenant_member(tenant_id) OR public.is_platform_admin());

CREATE POLICY "venue_sports_manage_manager"
  ON public.venue_sports FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));
