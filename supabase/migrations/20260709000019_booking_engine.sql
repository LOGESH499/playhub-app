-- PLAYHUB Module 9: Booking engine — slot integration, holds, waitlist, RPCs

-- ─── Schema extensions ───────────────────────────────────────────────────────

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS slot_id UUID REFERENCES public.slots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmation_code TEXT,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_confirmation_code_unique
  ON public.bookings(confirmation_code)
  WHERE confirmation_code IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bookings_slot_id_idx
  ON public.bookings(slot_id)
  WHERE slot_id IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE public.slot_holds
  ADD COLUMN IF NOT EXISTS slot_id UUID REFERENCES public.slots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS slot_holds_slot_id_idx
  ON public.slot_holds(slot_id)
  WHERE slot_id IS NOT NULL;

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_confirmation_code()
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
END;
$$;

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
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, tenant_id, type, title, body, data)
  VALUES (p_user_id, p_tenant_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_booking_slot(p_slot_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_slot_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.slots
  SET status = 'available', updated_at = now()
  WHERE id = p_slot_id
    AND deleted_at IS NULL
    AND status = 'booked'
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.slot_id = p_slot_id
        AND b.deleted_at IS NULL
        AND b.status IN ('pending', 'confirmed')
    );
END;
$$;

-- ─── Slot hold ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_slot_hold(
  p_slot_id UUID,
  p_duration_minutes INTEGER DEFAULT 10
)
RETURNS public.slot_holds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.slots;
  v_hold public.slot_holds;
  v_user_id UUID := auth.uid();
  v_validation JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_slot
  FROM public.slots
  WHERE id = p_slot_id
    AND deleted_at IS NULL
    AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not available';
  END IF;

  v_validation := public.validate_slot_window(
    v_slot.tenant_id,
    v_slot.venue_id,
    v_slot.resource_id,
    v_slot.start_time,
    v_slot.end_time,
    p_slot_id
  );

  IF NOT COALESCE((v_validation->>'valid')::boolean, false) THEN
    RAISE EXCEPTION '%', COALESCE(v_validation->>'reason', 'Slot validation failed');
  END IF;

  DELETE FROM public.slot_holds
  WHERE user_id = v_user_id
    AND resource_id = v_slot.resource_id
    AND expires_at < now();

  IF EXISTS (
    SELECT 1 FROM public.slot_holds h
    WHERE h.resource_id = v_slot.resource_id
      AND h.user_id <> v_user_id
      AND h.expires_at > now()
      AND tstzrange(h.start_time, h.end_time) && tstzrange(v_slot.start_time, v_slot.end_time)
  ) THEN
    RAISE EXCEPTION 'Slot is temporarily held by another user';
  END IF;

  INSERT INTO public.slot_holds (
    tenant_id,
    resource_id,
    user_id,
    slot_id,
    start_time,
    end_time,
    expires_at
  ) VALUES (
    v_slot.tenant_id,
    v_slot.resource_id,
    v_user_id,
    p_slot_id,
    v_slot.start_time,
    v_slot.end_time,
    now() + make_interval(mins => GREATEST(p_duration_minutes, 1))
  )
  RETURNING * INTO v_hold;

  RETURN v_hold;
END;
$$;

-- ─── Book slot (atomic, slot-integrated) ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.book_slot(
  p_slot_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_hold_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_booked_by UUID DEFAULT NULL,
  p_status public.booking_status DEFAULT 'confirmed'
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.slots;
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_booking public.bookings;
  v_validation JSONB;
  v_code TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_slot
  FROM public.slots
  WHERE id = p_slot_id
    AND deleted_at IS NULL
    AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not available for booking';
  END IF;

  v_validation := public.validate_slot_window(
    v_slot.tenant_id,
    v_slot.venue_id,
    v_slot.resource_id,
    v_slot.start_time,
    v_slot.end_time,
    p_slot_id
  );

  IF NOT COALESCE((v_validation->>'valid')::boolean, false) THEN
    RAISE EXCEPTION '%', COALESCE(v_validation->>'reason', 'Slot validation failed');
  END IF;

  IF p_hold_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.slot_holds
      WHERE id = p_hold_id
        AND user_id = v_user_id
        AND slot_id = p_slot_id
        AND expires_at > now()
    ) THEN
      RAISE EXCEPTION 'Hold expired or invalid';
    END IF;
  END IF;

  v_booking := public.create_booking(
    v_slot.resource_id,
    v_slot.start_time,
    v_slot.end_time,
    v_user_id,
    p_hold_id,
    v_slot.price_per_slot,
    'INR',
    p_notes,
    COALESCE(p_booked_by, auth.uid()),
    p_slot_id,
    p_status
  );

  RETURN v_booking;
END;
$$;

-- ─── Enhanced create_booking ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_booking(
  p_resource_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_user_id UUID,
  p_hold_id UUID DEFAULT NULL,
  p_amount DECIMAL DEFAULT 0,
  p_currency TEXT DEFAULT 'INR',
  p_notes TEXT DEFAULT NULL,
  p_booked_by UUID DEFAULT NULL,
  p_slot_id UUID DEFAULT NULL,
  p_status public.booking_status DEFAULT 'confirmed'
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resource public.resources;
  v_booking public.bookings;
  v_validation JSONB;
  v_code TEXT;
BEGIN
  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'Invalid time range';
  END IF;

  SELECT * INTO v_resource
  FROM public.resources
  WHERE id = p_resource_id
    AND deleted_at IS NULL
    AND (is_active = true OR status = 'active')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resource not found or inactive';
  END IF;

  v_validation := public.validate_slot_window(
    v_resource.tenant_id,
    v_resource.venue_id,
    p_resource_id,
    p_start_time,
    p_end_time,
    p_slot_id
  );

  IF NOT COALESCE((v_validation->>'valid')::boolean, false) THEN
    RAISE EXCEPTION '%', COALESCE(v_validation->>'reason', 'Booking validation failed');
  END IF;

  PERFORM 1 FROM public.bookings
  WHERE resource_id = p_resource_id
    AND status IN ('pending', 'confirmed')
    AND deleted_at IS NULL
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time)
  FOR UPDATE;

  IF FOUND THEN
    RAISE EXCEPTION 'BOOKING_CONFLICT: Slot is no longer available';
  END IF;

  v_code := public.generate_confirmation_code();

  INSERT INTO public.bookings (
    tenant_id,
    venue_id,
    resource_id,
    user_id,
    booked_by,
    sport_type,
    start_time,
    end_time,
    status,
    amount,
    currency,
    notes,
    slot_id,
    confirmation_code,
    metadata
  ) VALUES (
    v_resource.tenant_id,
    v_resource.venue_id,
    p_resource_id,
    p_user_id,
    COALESCE(p_booked_by, auth.uid()),
    v_resource.sport_type,
    p_start_time,
    p_end_time,
    p_status,
    p_amount,
    p_currency,
    p_notes,
    p_slot_id,
    v_code,
    jsonb_build_object('email_queued', true)
  )
  RETURNING * INTO v_booking;

  IF p_slot_id IS NOT NULL THEN
    UPDATE public.slots
    SET status = 'booked', updated_at = now()
    WHERE id = p_slot_id
      AND deleted_at IS NULL
      AND status = 'available';
  END IF;

  IF p_hold_id IS NOT NULL THEN
    DELETE FROM public.slot_holds
    WHERE id = p_hold_id AND user_id = p_user_id;
  END IF;

  PERFORM public.notify_booking_event(
    p_user_id,
    v_resource.tenant_id,
    'booking_confirmation',
    'Booking confirmed',
    format('Your booking %s is confirmed.', v_code),
    jsonb_build_object(
      'booking_id', v_booking.id,
      'confirmation_code', v_code,
      'slot_id', p_slot_id
    )
  );

  RETURN v_booking;
END;
$$;

-- ─── Cancel booking (release slot) ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  UPDATE public.bookings
  SET
    status = 'cancelled',
    cancellation_reason = p_reason,
    cancelled_at = now(),
    updated_at = now()
  WHERE id = p_booking_id
    AND status IN ('pending', 'confirmed')
    AND deleted_at IS NULL
    AND (
      user_id = auth.uid()
      OR public.has_tenant_role(tenant_id, 'staff')
    )
  RETURNING * INTO v_booking;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or cannot be cancelled';
  END IF;

  PERFORM public.release_booking_slot(v_booking.slot_id);

  PERFORM public.notify_booking_event(
    v_booking.user_id,
    v_booking.tenant_id,
    'booking_cancelled',
    'Booking cancelled',
    COALESCE(p_reason, 'Your booking was cancelled.'),
    jsonb_build_object('booking_id', v_booking.id)
  );

  RETURN v_booking;
END;
$$;

-- ─── Reschedule booking ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reschedule_booking(
  p_booking_id UUID,
  p_new_slot_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old public.bookings;
  v_new public.bookings;
  v_slot public.slots;
BEGIN
  SELECT * INTO v_old
  FROM public.bookings
  WHERE id = p_booking_id
    AND status IN ('pending', 'confirmed')
    AND deleted_at IS NULL
    AND (
      user_id = auth.uid()
      OR public.has_tenant_role(tenant_id, 'staff')
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or cannot be rescheduled';
  END IF;

  SELECT * INTO v_slot
  FROM public.slots
  WHERE id = p_new_slot_id
    AND deleted_at IS NULL
    AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target slot not available';
  END IF;

  IF v_slot.resource_id <> v_old.resource_id THEN
    RAISE EXCEPTION 'Cannot reschedule to a different resource';
  END IF;

  UPDATE public.bookings
  SET
    status = 'cancelled',
    cancellation_reason = 'Rescheduled',
    cancelled_at = now(),
    updated_at = now()
  WHERE id = p_booking_id;

  PERFORM public.release_booking_slot(v_old.slot_id);

  v_new := public.book_slot(
    p_new_slot_id,
    v_old.user_id,
    NULL,
    COALESCE(p_notes, v_old.notes),
    auth.uid(),
    'confirmed'
  );

  UPDATE public.bookings
  SET metadata = COALESCE(v_old.metadata, '{}'::jsonb) || jsonb_build_object('rescheduled_from', v_old.id)
  WHERE id = v_new.id;

  PERFORM public.notify_booking_event(
    v_old.user_id,
    v_old.tenant_id,
    'booking_rescheduled',
    'Booking rescheduled',
    'Your booking has been moved to a new time slot.',
    jsonb_build_object('booking_id', v_new.id, 'previous_booking_id', v_old.id)
  );

  RETURN v_new;
END;
$$;

-- ─── Complete booking ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_booking(p_booking_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  UPDATE public.bookings
  SET status = 'completed', updated_at = now()
  WHERE id = p_booking_id
    AND status = 'confirmed'
    AND deleted_at IS NULL
    AND public.has_tenant_role(tenant_id, 'staff')
  RETURNING * INTO v_booking;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or cannot be completed';
  END IF;

  RETURN v_booking;
END;
$$;

-- ─── Confirm pending booking ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.confirm_booking(p_booking_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  UPDATE public.bookings
  SET status = 'confirmed', updated_at = now()
  WHERE id = p_booking_id
    AND status = 'pending'
    AND deleted_at IS NULL
    AND (
      user_id = auth.uid()
      OR public.has_tenant_role(tenant_id, 'staff')
    )
  RETURNING * INTO v_booking;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or not pending';
  END IF;

  RETURN v_booking;
END;
$$;

-- ─── Expire pending bookings ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.expire_pending_bookings(
  p_max_age_minutes INTEGER DEFAULT 30
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
    WHERE status = 'pending'
      AND deleted_at IS NULL
      AND created_at < now() - make_interval(mins => GREATEST(p_max_age_minutes, 1))
    FOR UPDATE
  LOOP
    UPDATE public.bookings
    SET status = 'expired', updated_at = now()
    WHERE id = v_row.id;

    PERFORM public.release_booking_slot(v_row.slot_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ─── Waitlist ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_slot_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS public.waitlist_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.slots;
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_entry public.waitlist_entries;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_slot
  FROM public.slots
  WHERE id = p_slot_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;

  IF v_slot.status = 'available' THEN
    RAISE EXCEPTION 'Slot is available — book directly instead of joining waitlist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.waitlist_entries
    WHERE resource_id = v_slot.resource_id
      AND user_id = v_user_id
      AND desired_start = v_slot.start_time
      AND status = 'waiting'
  ) THEN
    SELECT * INTO v_entry
    FROM public.waitlist_entries
    WHERE resource_id = v_slot.resource_id
      AND user_id = v_user_id
      AND desired_start = v_slot.start_time
      AND status = 'waiting'
    LIMIT 1;
  ELSE
    INSERT INTO public.waitlist_entries (
      tenant_id,
      resource_id,
      user_id,
      desired_start,
      desired_end,
      status
    ) VALUES (
      v_slot.tenant_id,
      v_slot.resource_id,
      v_user_id,
      v_slot.start_time,
      v_slot.end_time,
      'waiting'
    )
    RETURNING * INTO v_entry;
  END IF;

  PERFORM public.notify_booking_event(
    v_user_id,
    v_slot.tenant_id,
    'waitlist_joined',
    'Added to waitlist',
    'You will be notified if this slot becomes available.',
    jsonb_build_object('slot_id', p_slot_id, 'waitlist_id', v_entry.id)
  );

  RETURN v_entry;
END;
$$;

-- ─── Booking reminder queue ──────────────────────────────────────────────────

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
    PERFORM public.notify_booking_event(
      v_row.user_id,
      v_row.tenant_id,
      'booking_reminder',
      'Upcoming booking reminder',
      format('Your booking %s starts soon.', COALESCE(v_row.confirmation_code, v_row.id::text)),
      jsonb_build_object(
        'booking_id', v_row.id,
        'email_queued', true
      )
    );

    UPDATE public.bookings
    SET reminder_sent_at = now(), updated_at = now()
    WHERE id = v_row.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.generate_confirmation_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_booking_event(UUID, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_booking_slot(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_slot_hold(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_slot(UUID, UUID, UUID, TEXT, UUID, public.booking_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID, DECIMAL, TEXT, TEXT, UUID, UUID, public.booking_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_booking(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_bookings(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_waitlist(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_booking_reminders(INTEGER) TO authenticated;
