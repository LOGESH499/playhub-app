-- PLAYHUB Module 15: Platform administration

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'subscription_tier'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'enterprise');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'subscription_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.subscription_status AS ENUM (
      'active',
      'trialing',
      'cancelled',
      'suspended'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  seats_limit INTEGER NOT NULL DEFAULT 10,
  venues_limit INTEGER NOT NULL DEFAULT 5,
  billing_email TEXT,
  trial_ends_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_subscriptions_tier_idx
  ON public.tenant_subscriptions(tier, status);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  rollout_percent INTEGER NOT NULL DEFAULT 100
    CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_status_idx
  ON public.support_tickets(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_health_snapshots_created_idx
  ON public.platform_health_snapshots(created_at DESC);

DROP TRIGGER IF EXISTS tenant_subscriptions_updated_at ON public.tenant_subscriptions;
CREATE TRIGGER tenant_subscriptions_updated_at
  BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed default platform settings & flags
INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('global', '{"maintenance_mode":false,"signup_enabled":true,"free_tier_default":true}'::jsonb, 'Global platform toggles'),
  ('support', '{"contact_email":"support@playhub.app","sla_hours":48}'::jsonb, 'Support configuration')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.feature_flags (key, enabled, description)
VALUES
  ('academy_module', true, 'Academy management'),
  ('payments_offline', true, 'Offline payment recording'),
  ('customer_portal', true, 'Customer self-service portal'),
  ('enterprise_analytics', true, 'Analytics dashboards'),
  ('notifications_center', true, 'Notification center'),
  ('membership_credits', false, 'Membership credit purchases')
ON CONFLICT (key) DO NOTHING;

-- Backfill subscriptions for existing tenants
INSERT INTO public.tenant_subscriptions (tenant_id, tier, status)
SELECT id, 'free', 'active'
FROM public.tenants
WHERE deleted_at IS NULL
ON CONFLICT (tenant_id) DO NOTHING;

-- Auto-provision subscription on new tenant
CREATE OR REPLACE FUNCTION public.provision_tenant_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tenant_subscriptions (tenant_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_provision_subscription ON public.tenants;
CREATE TRIGGER tenants_provision_subscription
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.provision_tenant_subscription();

-- ─── Platform analytics ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN jsonb_build_object(
    'tenants', (SELECT COUNT(*) FROM public.tenants WHERE deleted_at IS NULL),
    'activeTenants', (SELECT COUNT(*) FROM public.tenants WHERE deleted_at IS NULL AND status = 'active'),
    'suspendedTenants', (SELECT COUNT(*) FROM public.tenants WHERE deleted_at IS NULL AND status = 'suspended'),
    'users', (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL),
    'platformAdmins', (SELECT COUNT(*) FROM public.profiles WHERE is_platform_admin AND deleted_at IS NULL),
    'bookings', (SELECT COUNT(*) FROM public.bookings WHERE deleted_at IS NULL),
    'bookingsThisMonth', (
      SELECT COUNT(*) FROM public.bookings
      WHERE deleted_at IS NULL
        AND created_at >= date_trunc('month', now())
    ),
    'venues', (SELECT COUNT(*) FROM public.venues WHERE deleted_at IS NULL),
    'subscriptionsByTier', COALESCE((
      SELECT jsonb_agg(row_to_json(t)::jsonb)
      FROM (
        SELECT tier::TEXT AS tier, COUNT(*) AS count
        FROM public.tenant_subscriptions
        GROUP BY tier
      ) t
    ), '[]'::jsonb),
    'openSupportTickets', (
      SELECT COUNT(*) FROM public.support_tickets
      WHERE status IN ('open', 'in_progress')
    ),
    'generatedAt', to_jsonb(now())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_analytics() TO authenticated;

-- ─── Tenant admin updates ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_tenant_status(
  p_tenant_id UUID,
  p_status public.tenant_status
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.tenants;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE public.tenants
  SET status = p_status
  WHERE id = p_tenant_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found';
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id, actor_id, action, entity_type, entity_id, new_values
  ) VALUES (
    p_tenant_id, auth.uid(), 'tenant.status_updated', 'tenant', p_tenant_id,
    jsonb_build_object('status', p_status)
  );

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_tenant_status(UUID, public.tenant_status)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_tenant_subscription(
  p_tenant_id UUID,
  p_tier public.subscription_tier DEFAULT NULL,
  p_status public.subscription_status DEFAULT NULL,
  p_seats_limit INTEGER DEFAULT NULL,
  p_venues_limit INTEGER DEFAULT NULL
)
RETURNS public.tenant_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.tenant_subscriptions;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE public.tenant_subscriptions
  SET
    tier = COALESCE(p_tier, tier),
    status = COALESCE(p_status, status),
    seats_limit = COALESCE(p_seats_limit, seats_limit),
    venues_limit = COALESCE(p_venues_limit, venues_limit)
  WHERE tenant_id = p_tenant_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id, actor_id, action, entity_type, entity_id, new_values
  ) VALUES (
    p_tenant_id, auth.uid(), 'subscription.updated', 'subscription', v_row.id,
    jsonb_build_object('tier', v_row.tier, 'status', v_row.status)
  );

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_tenant_subscription(UUID, public.subscription_tier, public.subscription_status, INTEGER, INTEGER)
  TO authenticated;

-- ─── User management ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_platform_admin(
  p_user_id UUID,
  p_is_admin BOOLEAN
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.profiles;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF p_user_id = auth.uid() AND p_is_admin IS FALSE THEN
    RAISE EXCEPTION 'Cannot remove your own platform admin access';
  END IF;

  UPDATE public.profiles
  SET is_platform_admin = p_is_admin
  WHERE id = p_user_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.audit_logs (
    actor_id, action, entity_type, entity_id, new_values
  ) VALUES (
    auth.uid(), 'user.platform_admin_updated', 'profile', p_user_id,
    jsonb_build_object('is_platform_admin', p_is_admin)
  );

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_platform_admin(UUID, BOOLEAN)
  TO authenticated;

-- ─── Settings & feature flags ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_upsert_platform_setting(
  p_key TEXT,
  p_value JSONB,
  p_description TEXT DEFAULT NULL
)
RETURNS public.platform_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.platform_settings;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  INSERT INTO public.platform_settings (key, value, description, updated_by)
  VALUES (p_key, p_value, p_description, auth.uid())
  ON CONFLICT (key) DO UPDATE
  SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, platform_settings.description),
    updated_by = auth.uid(),
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_platform_setting(TEXT, JSONB, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_feature_flag(
  p_key TEXT,
  p_enabled BOOLEAN,
  p_description TEXT DEFAULT NULL,
  p_rollout_percent INTEGER DEFAULT 100
)
RETURNS public.feature_flags
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.feature_flags;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  INSERT INTO public.feature_flags (key, enabled, description, rollout_percent, updated_by)
  VALUES (p_key, p_enabled, p_description, p_rollout_percent, auth.uid())
  ON CONFLICT (key) DO UPDATE
  SET
    enabled = EXCLUDED.enabled,
    description = COALESCE(EXCLUDED.description, feature_flags.description),
    rollout_percent = EXCLUDED.rollout_percent,
    updated_by = auth.uid(),
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_feature_flag(TEXT, BOOLEAN, TEXT, INTEGER)
  TO authenticated;

-- ─── Support tickets ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_support_ticket(
  p_ticket_id UUID,
  p_status TEXT,
  p_priority TEXT DEFAULT NULL,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.support_tickets;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE public.support_tickets
  SET
    status = p_status,
    priority = COALESCE(p_priority, priority),
    resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
    assigned_to = COALESCE(assigned_to, auth.uid())
  WHERE id = p_ticket_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_support_ticket(UUID, TEXT, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_subject TEXT,
  p_body TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.support_tickets;
BEGIN
  INSERT INTO public.support_tickets (
    tenant_id, user_id, subject, body, priority
  ) VALUES (
    p_tenant_id, auth.uid(), p_subject, p_body, p_priority
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_support_ticket(TEXT, TEXT, UUID, TEXT)
  TO authenticated;

-- ─── Platform monitoring snapshot ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.record_platform_health_snapshot()
RETURNS public.platform_health_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.platform_health_snapshots;
  v_metrics JSONB;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  v_metrics := jsonb_build_object(
    'pending_emails', (SELECT COUNT(*) FROM public.notification_emails WHERE status = 'pending'),
    'open_tickets', (SELECT COUNT(*) FROM public.support_tickets WHERE status IN ('open', 'in_progress')),
    'active_bookings', (
      SELECT COUNT(*) FROM public.bookings
      WHERE status IN ('pending', 'confirmed') AND deleted_at IS NULL
    ),
    'failed_emails', (SELECT COUNT(*) FROM public.notification_emails WHERE status = 'failed'),
    'recorded_at', now()
  );

  INSERT INTO public.platform_health_snapshots (metrics)
  VALUES (v_metrics)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_platform_health_snapshot() TO authenticated;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_health_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_subscriptions_select" ON public.tenant_subscriptions;
CREATE POLICY "tenant_subscriptions_select"
  ON public.tenant_subscriptions FOR SELECT
  USING (
    public.is_platform_admin()
    OR public.has_tenant_role(tenant_id, 'admin')
  );

DROP POLICY IF EXISTS "tenant_subscriptions_manage_platform" ON public.tenant_subscriptions;
CREATE POLICY "tenant_subscriptions_manage_platform"
  ON public.tenant_subscriptions FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "platform_settings_platform_admin" ON public.platform_settings;
CREATE POLICY "platform_settings_platform_admin"
  ON public.platform_settings FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "feature_flags_select_all" ON public.feature_flags;
CREATE POLICY "feature_flags_select_all"
  ON public.feature_flags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "feature_flags_manage_platform" ON public.feature_flags;
CREATE POLICY "feature_flags_manage_platform"
  ON public.feature_flags FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "support_tickets_select" ON public.support_tickets;
CREATE POLICY "support_tickets_select"
  ON public.support_tickets FOR SELECT
  USING (
    public.is_platform_admin()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "support_tickets_insert" ON public.support_tickets;
CREATE POLICY "support_tickets_insert"
  ON public.support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS "support_tickets_update_platform" ON public.support_tickets;
CREATE POLICY "support_tickets_update_platform"
  ON public.support_tickets FOR UPDATE
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "platform_health_platform_admin" ON public.platform_health_snapshots;
CREATE POLICY "platform_health_platform_admin"
  ON public.platform_health_snapshots FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "tenants_update_platform_admin" ON public.tenants;
CREATE POLICY "tenants_update_platform_admin"
  ON public.tenants FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'support_tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
  END IF;
END $$;
