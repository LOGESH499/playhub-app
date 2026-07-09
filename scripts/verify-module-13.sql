-- PLAYHUB Module 13 verification script
-- Usage: supabase db execute -f scripts/verify-module-13.sql

DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_enterprise_analytics'
  ) THEN
    v_failures := array_append(v_failures, 'M13: get_enterprise_analytics function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'analytics_snapshots'
  ) THEN
    v_failures := array_append(v_failures, 'M13: analytics_snapshots table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'analytics_snapshots'
  ) THEN
    v_failures := array_append(v_failures, 'M13: analytics_snapshots not in realtime publication');
  END IF;

  IF array_length(v_failures, 1) > 0 THEN
    RAISE EXCEPTION 'Module 13 verification failed:%', E'\n- ' || array_to_string(v_failures, E'\n- ');
  END IF;

  RAISE NOTICE 'Module 13 verification passed.';
END $$;
