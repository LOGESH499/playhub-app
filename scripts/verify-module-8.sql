-- PLAYHUB Module 8 verification script
-- Run after: supabase db push  OR  supabase db reset
-- Usage: supabase db execute -f scripts/verify-module-8.sql

DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
  v_count INTEGER;
BEGIN
  -- ─── Module 8: Slot Management ───────────────────────────────────────────

  IF to_regclass('public.slots') IS NULL THEN
    v_failures := array_append(v_failures, 'M8: public.slots table missing');
  END IF;

  IF to_regclass('public.slot_templates') IS NULL THEN
    v_failures := array_append(v_failures, 'M8: public.slot_templates table missing');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_type') THEN
    v_failures := array_append(v_failures, 'M8: slot_type enum missing');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_status') THEN
    v_failures := array_append(v_failures, 'M8: slot_status enum missing');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_recurrence') THEN
    v_failures := array_append(v_failures, 'M8: slot_recurrence enum missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'slots_no_overlap'
      AND conrelid = 'public.slots'::regclass
  ) THEN
    v_failures := array_append(v_failures, 'M8: slots_no_overlap exclusion constraint missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'validate_slot_window'
  ) THEN
    v_failures := array_append(v_failures, 'M8: validate_slot_window function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'slot_templates'
      AND column_name = 'peak_start_time'
  ) THEN
    v_failures := array_append(v_failures, 'M8: slot_templates.peak_start_time column missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'slot_templates'
      AND column_name = 'peak_end_time'
  ) THEN
    v_failures := array_append(v_failures, 'M8: slot_templates.peak_end_time column missing');
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'slots'
    AND policyname IN (
      'slots_select_public',
      'slots_select_member',
      'slots_manage_manager'
    );
  IF v_count < 3 THEN
    v_failures := array_append(v_failures, 'M8: slots RLS policies incomplete');
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'slot_templates'
    AND policyname IN (
      'slot_templates_select_member',
      'slot_templates_manage_manager'
    );
  IF v_count < 2 THEN
    v_failures := array_append(v_failures, 'M8: slot_templates RLS policies incomplete');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'slots'
  ) THEN
    v_failures := array_append(v_failures, 'M8: slots not in supabase_realtime publication');
  END IF;

  -- ─── Report ───────────────────────────────────────────────────────────────

  IF array_length(v_failures, 1) IS NULL THEN
    RAISE NOTICE 'Module 8 verification PASSED';
  ELSE
    RAISE EXCEPTION 'Module 8 verification FAILED: %', array_to_string(v_failures, '; ');
  END IF;
END $$;
