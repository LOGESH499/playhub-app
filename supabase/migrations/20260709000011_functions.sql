-- PLAYHUB Module 2: PostgreSQL business functions (atomic operations)

-- Expire stale slot holds (run via cron / edge function)
CREATE OR REPLACE FUNCTION public.expire_slot_holds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.slot_holds WHERE expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Atomic booking creation with conflict prevention
CREATE OR REPLACE FUNCTION public.create_booking(
  p_resource_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_user_id UUID,
  p_hold_id UUID DEFAULT NULL,
  p_amount DECIMAL DEFAULT 0,
  p_currency TEXT DEFAULT 'INR',
  p_notes TEXT DEFAULT NULL,
  p_booked_by UUID DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resource public.resources;
  v_booking public.bookings;
BEGIN
  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'Invalid time range';
  END IF;

  SELECT * INTO v_resource
  FROM public.resources
  WHERE id = p_resource_id
    AND is_active = true
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resource not found or inactive';
  END IF;

  -- Lock overlapping bookings
  PERFORM 1 FROM public.bookings
  WHERE resource_id = p_resource_id
    AND status IN ('pending', 'confirmed')
    AND deleted_at IS NULL
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time)
  FOR UPDATE;

  IF FOUND THEN
    RAISE EXCEPTION 'BOOKING_CONFLICT: Slot is no longer available';
  END IF;

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
    notes
  ) VALUES (
    v_resource.tenant_id,
    v_resource.venue_id,
    p_resource_id,
    p_user_id,
    COALESCE(p_booked_by, auth.uid()),
    v_resource.sport_type,
    p_start_time,
    p_end_time,
    'confirmed',
    p_amount,
    p_currency,
    p_notes
  )
  RETURNING * INTO v_booking;

  IF p_hold_id IS NOT NULL THEN
    DELETE FROM public.slot_holds
    WHERE id = p_hold_id AND user_id = p_user_id;
  END IF;

  RETURN v_booking;
END;
$$;

-- Cancel booking with audit trail fields
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

  RETURN v_booking;
END;
$$;

-- Academy enrollment with capacity check
CREATE OR REPLACE FUNCTION public.create_enrollment(
  p_batch_id UUID,
  p_student_id UUID,
  p_enrolled_by UUID DEFAULT NULL
)
RETURNS public.enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.batches;
  v_active_count INTEGER;
  v_enrollment public.enrollments;
BEGIN
  SELECT * INTO v_batch
  FROM public.batches
  WHERE id = p_batch_id
    AND is_active = true
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found or inactive';
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM public.enrollments
  WHERE batch_id = p_batch_id AND status = 'active';

  IF v_active_count >= v_batch.capacity THEN
    RAISE EXCEPTION 'BATCH_FULL: No spots available';
  END IF;

  INSERT INTO public.enrollments (
    tenant_id,
    batch_id,
    student_id,
    enrolled_by,
    status
  ) VALUES (
    v_batch.tenant_id,
    p_batch_id,
    p_student_id,
    COALESCE(p_enrolled_by, auth.uid()),
    'active'
  )
  RETURNING * INTO v_enrollment;

  RETURN v_enrollment;
END;
$$;

-- Auto-create owner membership when tenant is created
CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.tenant_members (tenant_id, user_id, role, status, joined_at)
    VALUES (NEW.id, auth.uid(), 'owner', 'active', now())
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_tenant();

-- Grant execute on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION public.expire_slot_holds() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID, DECIMAL, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_enrollment(UUID, UUID, UUID) TO authenticated;
