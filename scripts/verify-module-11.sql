-- PLAYHUB Module 11 verification script
-- Usage: supabase db execute -f scripts/verify-module-11.sql

DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_favorites'
  ) THEN
    v_failures := array_append(v_failures, 'M11: user_favorites table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'venue_reviews'
  ) THEN
    v_failures := array_append(v_failures, 'M11: venue_reviews table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'toggle_user_favorite'
  ) THEN
    v_failures := array_append(v_failures, 'M11: toggle_user_favorite function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'upsert_venue_review'
  ) THEN
    v_failures := array_append(v_failures, 'M11: upsert_venue_review function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    v_failures := array_append(v_failures, 'M11: notifications not in realtime publication');
  END IF;

  IF array_length(v_failures, 1) > 0 THEN
    RAISE EXCEPTION 'Module 11 verification failed:%', E'\n- ' || array_to_string(v_failures, E'\n- ');
  END IF;

  RAISE NOTICE 'Module 11 verification passed.';
END $$;
