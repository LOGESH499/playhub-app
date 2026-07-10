-- PLAYHUB Module 15 verification script
-- Usage: supabase db execute -f scripts/verify-module-15.sql

DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'subscription_tier'
  ) THEN
    v_failures := array_append(v_failures, 'M15: subscription_tier enum missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenant_subscriptions'
  ) THEN
    v_failures := array_append(v_failures, 'M15: tenant_subscriptions table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_settings'
  ) THEN
    v_failures := array_append(v_failures, 'M15: platform_settings table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'feature_flags'
  ) THEN
    v_failures := array_append(v_failures, 'M15: feature_flags table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_platform_analytics'
  ) THEN
    v_failures := array_append(v_failures, 'M15: get_platform_analytics function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'admin_update_tenant_subscription'
  ) THEN
    v_failures := array_append(v_failures, 'M15: admin_update_tenant_subscription function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'record_platform_health_snapshot'
  ) THEN
    v_failures := array_append(v_failures, 'M15: record_platform_health_snapshot function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'support_tickets'
  ) THEN
    v_failures := array_append(v_failures, 'M15: support_tickets not in realtime publication');
  END IF;

  IF array_length(v_failures, 1) > 0 THEN
    RAISE EXCEPTION 'Module 15 verification failed:%', E'\n- ' || array_to_string(v_failures, E'\n- ');
  END IF;

  RAISE NOTICE 'Module 15 verification passed.';
END $$;
