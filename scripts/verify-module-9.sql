-- PLAYHUB Module 9 verification script
-- Run after: supabase db push  OR  supabase db reset
-- Usage: supabase db execute -f scripts/verify-module-9.sql

DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
  v_count INTEGER;
BEGIN
  -- ─── Module 9: Booking Engine ────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'booking_status' AND e.enumlabel = 'expired'
  ) THEN
    v_failures := array_append(v_failures, 'M9: booking_status.expired enum missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'slot_id'
  ) THEN
    v_failures := array_append(v_failures, 'M9: bookings.slot_id column missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'confirmation_code'
  ) THEN
    v_failures := array_append(v_failures, 'M9: bookings.confirmation_code column missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'book_slot'
  ) THEN
    v_failures := array_append(v_failures, 'M9: book_slot function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_slot_hold'
  ) THEN
    v_failures := array_append(v_failures, 'M9: create_slot_hold function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'reschedule_booking'
  ) THEN
    v_failures := array_append(v_failures, 'M9: reschedule_booking function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'join_waitlist'
  ) THEN
    v_failures := array_append(v_failures, 'M9: join_waitlist function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'queue_booking_reminders'
  ) THEN
    v_failures := array_append(v_failures, 'M9: queue_booking_reminders function missing');
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'bookings'
    AND policyname IN (
      'bookings_select_own',
      'bookings_select_staff',
      'bookings_insert_authenticated',
      'bookings_update_own_or_staff'
    );
  IF v_count < 4 THEN
    v_failures := array_append(v_failures, 'M9: bookings RLS policies incomplete');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    v_failures := array_append(v_failures, 'M9: bookings not in supabase_realtime publication');
  END IF;

  IF array_length(v_failures, 1) IS NULL THEN
    RAISE NOTICE 'Module 9 verification PASSED';
  ELSE
    RAISE EXCEPTION 'Module 9 verification FAILED: %', array_to_string(v_failures, '; ');
  END IF;
END $$;
