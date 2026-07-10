-- PLAYHUB Module 14 verification script
-- Usage: supabase db execute -f scripts/verify-module-14.sql

DO $$
DECLARE
  v_failures TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'notification_kind'
  ) THEN
    v_failures := array_append(v_failures, 'M14: notification_kind enum missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_emails'
  ) THEN
    v_failures := array_append(v_failures, 'M14: notification_emails table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_broadcasts'
  ) THEN
    v_failures := array_append(v_failures, 'M14: notification_broadcasts table missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'dispatch_notification'
  ) THEN
    v_failures := array_append(v_failures, 'M14: dispatch_notification function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'send_tenant_broadcast'
  ) THEN
    v_failures := array_append(v_failures, 'M14: send_tenant_broadcast function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'queue_academy_reminders'
  ) THEN
    v_failures := array_append(v_failures, 'M14: queue_academy_reminders function missing');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notification_emails'
  ) THEN
    v_failures := array_append(v_failures, 'M14: notification_emails not in realtime publication');
  END IF;

  IF array_length(v_failures, 1) > 0 THEN
    RAISE EXCEPTION 'Module 14 verification failed:%', E'\n- ' || array_to_string(v_failures, E'\n- ');
  END IF;

  RAISE NOTICE 'Module 14 verification passed.';
END $$;
