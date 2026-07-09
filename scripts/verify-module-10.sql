-- PLAYHUB Module 10 verification script
-- Run after: supabase db push  OR  supabase db reset
-- Usage: supabase db execute -f scripts/verify-module-10.sql

DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
  v_count INTEGER;
BEGIN
  -- ─── Module 10: Academy Management ───────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fee_records'
  ) THEN
    v_failures := array_append(v_failures, 'M10: fee_records table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'enrollment_progress'
  ) THEN
    v_failures := array_append(v_failures, 'M10: enrollment_progress table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'log_academy_audit'
  ) THEN
    v_failures := array_append(v_failures, 'M10: log_academy_audit function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_batch_sessions'
  ) THEN
    v_failures := array_append(v_failures, 'M10: generate_batch_sessions function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'upsert_session_attendance'
  ) THEN
    v_failures := array_append(v_failures, 'M10: upsert_session_attendance function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'upsert_enrollment_progress'
  ) THEN
    v_failures := array_append(v_failures, 'M10: upsert_enrollment_progress function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_batch_fees'
  ) THEN
    v_failures := array_append(v_failures, 'M10: generate_batch_fees function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'record_fee_payment'
  ) THEN
    v_failures := array_append(v_failures, 'M10: record_fee_payment function missing');
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM pg_trigger
  WHERE tgname = 'batches_sync_tenant';
  IF v_count < 1 THEN
    v_failures := array_append(v_failures, 'M10: batches_sync_tenant trigger missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'attendance_records'
  ) THEN
    v_failures := array_append(v_failures, 'M10: attendance_records not in realtime publication');
  END IF;

  IF array_length(v_failures, 1) > 0 THEN
    RAISE EXCEPTION 'Module 10 verification failed:%', E'\n- ' || array_to_string(v_failures, E'\n- ');
  END IF;

  RAISE NOTICE 'Module 10 verification passed.';
END $$;
