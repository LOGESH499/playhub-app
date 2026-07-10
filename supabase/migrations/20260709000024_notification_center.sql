-- PLAYHUB Module 14: Notification Center

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'notification_kind'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.notification_kind AS ENUM (
      'booking_confirmation',
      'booking_reminder',
      'booking_cancelled',
      'academy_reminder',
      'announcement',
      'maintenance',
      'broadcast',
      'payment',
      'system'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notification_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_emails_status_idx
  ON public.notification_emails(status, created_at DESC);
CREATE INDEX IF NOT EXISTS notification_emails_user_id_idx
  ON public.notification_emails(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.notification_kind NOT NULL DEFAULT 'broadcast',
  title TEXT NOT NULL,
  body TEXT,
  target_audience TEXT NOT NULL DEFAULT 'all'
    CHECK (target_audience IN ('all', 'members', 'staff')),
  recipients_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_broadcasts_tenant_idx
  ON public.notification_broadcasts(tenant_id, created_at DESC);

-- ─── Preference helper ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_wants_notification(
  p_user_id UUID,
  p_kind TEXT,
  p_channel TEXT DEFAULT 'in_app'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs JSONB;
  v_portal JSONB;
BEGIN
  IF p_channel = 'in_app' THEN
    RETURN TRUE;
  END IF;

  SELECT preferences INTO v_prefs
  FROM public.profiles
  WHERE id = p_user_id;

  v_portal := COALESCE(v_prefs->'portal', v_prefs, '{}'::jsonb);

  IF COALESCE((v_portal->>'emailNotifications')::BOOLEAN, TRUE) IS FALSE THEN
    RETURN FALSE;
  END IF;

  IF p_kind IN ('booking_confirmation', 'booking_reminder', 'booking_cancelled') THEN
    RETURN COALESCE((v_portal->>'bookingReminders')::BOOLEAN, TRUE);
  END IF;

  IF p_kind = 'academy_reminder' THEN
    RETURN COALESCE((v_portal->>'academyReminders')::BOOLEAN, TRUE);
  END IF;

  IF p_kind IN ('announcement', 'broadcast') THEN
    RETURN COALESCE((v_portal->>'announcements')::BOOLEAN, TRUE);
  END IF;

  IF p_kind = 'maintenance' THEN
    RETURN COALESCE((v_portal->>'maintenanceAlerts')::BOOLEAN, TRUE);
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_wants_notification(UUID, TEXT, TEXT)
  TO authenticated;

-- ─── Email queue ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.queue_notification_email(
  p_notification_id UUID,
  p_user_id UUID,
  p_tenant_id UUID,
  p_kind TEXT,
  p_subject TEXT,
  p_body TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_id UUID;
BEGIN
  IF NOT public.user_wants_notification(p_user_id, p_kind, 'email') THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notification_emails (
    notification_id,
    user_id,
    tenant_id,
    recipient_email,
    subject,
    body,
    status
  ) VALUES (
    p_notification_id,
    p_user_id,
    p_tenant_id,
    v_email,
    p_subject,
    COALESCE(p_body, ''),
    'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.queue_notification_email(UUID, UUID, UUID, TEXT, TEXT, TEXT)
  TO authenticated;

-- ─── Dispatch (in-app + optional email) ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.dispatch_notification(
  p_user_id UUID,
  p_tenant_id UUID,
  p_kind TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_queue_email BOOLEAN DEFAULT TRUE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, tenant_id, type, title, body, data)
  VALUES (p_user_id, p_tenant_id, p_kind, p_title, p_body, p_data)
  RETURNING id INTO v_id;

  IF p_queue_email THEN
    PERFORM public.queue_notification_email(
      v_id,
      p_user_id,
      p_tenant_id,
      p_kind,
      p_title,
      COALESCE(p_body, '')
    );
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispatch_notification(UUID, UUID, TEXT, TEXT, TEXT, JSONB, BOOLEAN)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_booking_event(
  p_user_id UUID,
  p_tenant_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.dispatch_notification(
    p_user_id,
    p_tenant_id,
    p_type,
    p_title,
    p_body,
    p_data,
    TRUE
  );
END;
$$;

-- ─── Admin broadcast / announcements / maintenance ────────────────────────────

CREATE OR REPLACE FUNCTION public.send_tenant_broadcast(
  p_tenant_id UUID,
  p_kind public.notification_kind,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_target_audience TEXT DEFAULT 'all'
)
RETURNS public.notification_broadcasts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_broadcast public.notification_broadcasts;
  v_member RECORD;
  v_count INTEGER := 0;
BEGIN
  IF NOT public.has_tenant_role(p_tenant_id, 'staff') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  INSERT INTO public.notification_broadcasts (
    tenant_id,
    created_by,
    kind,
    title,
    body,
    target_audience
  ) VALUES (
    p_tenant_id,
    auth.uid(),
    p_kind,
    p_title,
    p_body,
    p_target_audience
  )
  RETURNING * INTO v_broadcast;

  FOR v_member IN
    SELECT tm.user_id
    FROM public.tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
      AND tm.status = 'active'
      AND (
        p_target_audience = 'all'
        OR (p_target_audience = 'staff' AND tm.role IN ('owner', 'admin', 'manager', 'staff', 'coach'))
        OR (p_target_audience = 'members' AND tm.role = 'member')
      )
  LOOP
    PERFORM public.dispatch_notification(
      v_member.user_id,
      p_tenant_id,
      p_kind::TEXT,
      p_title,
      p_body,
      jsonb_build_object('broadcast_id', v_broadcast.id),
      TRUE
    );
    v_count := v_count + 1;
  END LOOP;

  UPDATE public.notification_broadcasts
  SET recipients_count = v_count
  WHERE id = v_broadcast.id
  RETURNING * INTO v_broadcast;

  RETURN v_broadcast;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_tenant_broadcast(UUID, public.notification_kind, TEXT, TEXT, TEXT)
  TO authenticated;

-- ─── Academy session reminders ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.queue_academy_reminders(
  p_hours_before INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_session RECORD;
  v_enrollment RECORD;
BEGIN
  FOR v_session IN
    SELECT bs.*, b.name AS batch_name
    FROM public.batch_sessions bs
    JOIN public.batches b ON b.id = bs.batch_id
    WHERE bs.session_date = CURRENT_DATE + 1
      AND bs.status = 'scheduled'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'academy_reminder'
          AND n.data->>'session_id' = bs.id::TEXT
          AND n.created_at > now() - INTERVAL '12 hours'
      )
  LOOP
    FOR v_enrollment IN
      SELECT e.student_id, e.tenant_id
      FROM public.enrollments e
      WHERE e.batch_id = v_session.batch_id
        AND e.status = 'active'
    LOOP
      PERFORM public.dispatch_notification(
        v_enrollment.student_id,
        v_enrollment.tenant_id,
        'academy_reminder',
        'Academy session reminder',
        format('Session for %s is coming up on %s.', v_session.batch_name, v_session.session_date),
        jsonb_build_object('session_id', v_session.id, 'batch_id', v_session.batch_id),
        TRUE
      );
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.queue_academy_reminders(INTEGER) TO authenticated;

-- ─── Re-queue booking reminders via dispatch ────────────────────────────────

CREATE OR REPLACE FUNCTION public.queue_booking_reminders(
  p_hours_before INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_row public.bookings;
BEGIN
  FOR v_row IN
    SELECT * FROM public.bookings
    WHERE status = 'confirmed'
      AND deleted_at IS NULL
      AND reminder_sent_at IS NULL
      AND start_time > now()
      AND start_time <= now() + make_interval(hours => GREATEST(p_hours_before, 1))
  LOOP
    PERFORM public.dispatch_notification(
      v_row.user_id,
      v_row.tenant_id,
      'booking_reminder',
      'Upcoming booking reminder',
      format('Your booking %s starts soon.', COALESCE(v_row.confirmation_code, v_row.id::text)),
      jsonb_build_object('booking_id', v_row.id),
      TRUE
    );

    UPDATE public.bookings
    SET reminder_sent_at = now(), updated_at = now()
    WHERE id = v_row.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ─── Email queue processing (mark sent / failed) ────────────────────────────

CREATE OR REPLACE FUNCTION public.mark_notification_email_status(
  p_email_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS public.notification_emails
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.notification_emails;
BEGIN
  UPDATE public.notification_emails
  SET
    status = p_status,
    error_message = p_error_message,
    sent_at = CASE WHEN p_status = 'sent' THEN now() ELSE sent_at END
  WHERE id = p_email_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email record not found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notification_email_status(UUID, TEXT, TEXT)
  TO authenticated;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.notification_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_emails_select_own" ON public.notification_emails;
CREATE POLICY "notification_emails_select_own"
  ON public.notification_emails FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_emails_select_staff" ON public.notification_emails;
CREATE POLICY "notification_emails_select_staff"
  ON public.notification_emails FOR SELECT
  USING (
    tenant_id IS NOT NULL
    AND public.has_tenant_role(tenant_id, 'staff')
  );

DROP POLICY IF EXISTS "notification_broadcasts_select_staff" ON public.notification_broadcasts;
CREATE POLICY "notification_broadcasts_select_staff"
  ON public.notification_broadcasts FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

DROP POLICY IF EXISTS "notification_broadcasts_insert_staff" ON public.notification_broadcasts;
CREATE POLICY "notification_broadcasts_insert_staff"
  ON public.notification_broadcasts FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, 'staff'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notification_emails'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_emails;
  END IF;
END $$;
