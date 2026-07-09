-- PLAYHUB Modules 5–7 verification script
-- Run after: supabase db push  OR  supabase db reset
-- Usage: supabase db execute -f scripts/verify-modules-5-7.sql

DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
  v_count INTEGER;
BEGIN
  -- ─── Module 5: Sports ───────────────────────────────────────────────────

  IF to_regclass('public.sports') IS NULL THEN
    v_failures := array_append(v_failures, 'M5: public.sports table missing');
  END IF;

  IF to_regclass('public.sport_categories') IS NULL THEN
    v_failures := array_append(v_failures, 'M5: public.sport_categories table missing');
  END IF;

  IF to_regclass('public.venue_sports') IS NULL THEN
    v_failures := array_append(v_failures, 'M5: public.venue_sports table missing');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sport_status') THEN
    v_failures := array_append(v_failures, 'M5: sport_status enum missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'sports_sport_type_unique'
  ) THEN
    v_failures := array_append(v_failures, 'M5: sports_sport_type_unique index missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'log_sport_audit'
  ) THEN
    v_failures := array_append(v_failures, 'M5: log_sport_audit function missing');
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'sports'
    AND policyname IN (
      'sports_select_active',
      'sports_manage_platform',
      'sports_manage_tenant_admin'
    );
  IF v_count < 3 THEN
    v_failures := array_append(v_failures, 'M5: sports RLS policies incomplete');
  END IF;

  -- ─── Module 6: Venues ───────────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'status'
  ) THEN
    v_failures := array_append(v_failures, 'M6: venues.status column missing');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'venue_status') THEN
    v_failures := array_append(v_failures, 'M6: venue_status enum missing');
  END IF;

  IF to_regclass('public.venue_holidays') IS NULL THEN
    v_failures := array_append(v_failures, 'M6: public.venue_holidays table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'venues_status_idx'
  ) THEN
    v_failures := array_append(v_failures, 'M6: venues_status_idx missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'log_venue_audit'
  ) THEN
    v_failures := array_append(v_failures, 'M6: log_venue_audit function missing');
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'venue_holidays';
  IF v_count < 3 THEN
    v_failures := array_append(v_failures, 'M6: venue_holidays RLS policies incomplete');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venues' AND policyname = 'venues_select_public'
  ) THEN
    v_failures := array_append(v_failures, 'M6: venues_select_public policy missing');
  END IF;

  -- ─── Module 7: Courts & Resources ─────────────────────────────────────────

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_status') THEN
    v_failures := array_append(v_failures, 'M7: resource_status enum missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'status'
  ) THEN
    v_failures := array_append(v_failures, 'M7: resources.status column missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'maintenance_until'
  ) THEN
    v_failures := array_append(v_failures, 'M7: resources.maintenance_until column missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'resources_status_idx'
  ) THEN
    v_failures := array_append(v_failures, 'M7: resources_status_idx missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'log_resource_audit'
  ) THEN
    v_failures := array_append(v_failures, 'M7: log_resource_audit function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'resources_sync_active'
  ) THEN
    v_failures := array_append(v_failures, 'M7: resources_sync_active trigger missing');
  END IF;

  -- Foreign keys (sample)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'venue_sports'
      AND constraint_name = 'venue_sports_sport_id_fkey'
  ) THEN
    v_failures := array_append(v_failures, 'M5: venue_sports → sports FK missing');
  END IF;

  -- Storage bucket
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'court-media'
  ) THEN
    v_failures := array_append(v_failures, 'M7: court-media storage bucket missing');
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname LIKE 'court_media_%';
  IF v_count < 4 THEN
    v_failures := array_append(v_failures, 'M7: court-media storage policies incomplete');
  END IF;

  -- Realtime (Module 2 baseline — not Module 7, sanity check)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    v_failures := array_append(v_failures, 'Realtime: bookings not in supabase_realtime publication');
  END IF;

  IF array_length(v_failures, 1) IS NOT NULL THEN
    RAISE EXCEPTION E'Modules 5–7 verification FAILED:\n%', array_to_string(v_failures, E'\n');
  END IF;

  RAISE NOTICE 'Modules 5–7 verification PASSED (tables, RLS, indexes, FKs, storage, realtime baseline)';
END $$;
