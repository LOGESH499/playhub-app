-- PLAYHUB Module 12 verification script
-- Usage: supabase db execute -f scripts/verify-module-12.sql

DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'payment_method'
  ) THEN
    v_failures := array_append(v_failures, 'M12: payment_method enum missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payment_transactions'
  ) THEN
    v_failures := array_append(v_failures, 'M12: payment_transactions table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'refund_requests'
  ) THEN
    v_failures := array_append(v_failures, 'M12: refund_requests table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'record_booking_payment'
  ) THEN
    v_failures := array_append(v_failures, 'M12: record_booking_payment function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'request_booking_refund'
  ) THEN
    v_failures := array_append(v_failures, 'M12: request_booking_refund function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'process_refund'
  ) THEN
    v_failures := array_append(v_failures, 'M12: process_refund function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'payment_transactions'
  ) THEN
    v_failures := array_append(v_failures, 'M12: payment_transactions not in realtime publication');
  END IF;

  IF array_length(v_failures, 1) > 0 THEN
    RAISE EXCEPTION 'Module 12 verification failed:%', E'\n- ' || array_to_string(v_failures, E'\n- ');
  END IF;

  RAISE NOTICE 'Module 12 verification passed.';
END $$;
