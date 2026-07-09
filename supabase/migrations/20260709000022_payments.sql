-- PLAYHUB Module 12: Offline payments (no Stripe)

CREATE TYPE public.payment_method AS ENUM (
  'cash',
  'upi',
  'card',
  'offline'
);

CREATE TYPE public.payment_entity_type AS ENUM (
  'booking',
  'academy_fee',
  'membership'
);

CREATE TYPE public.refund_status AS ENUM (
  'requested',
  'approved',
  'rejected',
  'processed'
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type public.payment_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method public.payment_method NOT NULL,
  direction TEXT NOT NULL DEFAULT 'payment'
    CHECK (direction IN ('payment', 'refund')),
  status public.payment_status NOT NULL DEFAULT 'paid',
  reference TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_transactions_tenant_id_idx
  ON public.payment_transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_transactions_entity_idx
  ON public.payment_transactions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS payment_transactions_booking_id_idx
  ON public.payment_transactions(booking_id);

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  status public.refund_status NOT NULL DEFAULT 'requested',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refund_requests_tenant_id_idx
  ON public.refund_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS refund_requests_booking_id_idx
  ON public.refund_requests(booking_id);

DROP TRIGGER IF EXISTS refund_requests_updated_at ON public.refund_requests;
CREATE TRIGGER refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.fee_records
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method;

-- ─── Audit helper ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_payment_audit(
  p_tenant_id UUID,
  p_action TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    tenant_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    p_tenant_id,
    auth.uid(),
    p_action,
    'payment',
    p_entity_id,
    p_old_values,
    p_new_values
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_payment_audit(UUID, TEXT, UUID, JSONB, JSONB)
  TO authenticated;

-- ─── Record booking payment (cash / UPI / card / offline) ───────────────────

CREATE OR REPLACE FUNCTION public.record_booking_payment(
  p_booking_id UUID,
  p_amount DECIMAL,
  p_payment_method public.payment_method,
  p_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.payment_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
  v_paid_total DECIMAL(10, 2);
  v_row public.payment_transactions;
  v_status public.payment_status;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF NOT public.has_tenant_role(v_booking.tenant_id, 'staff') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid_total
  FROM public.payment_transactions
  WHERE booking_id = p_booking_id
    AND direction = 'payment'
    AND status IN ('paid', 'partial');

  v_paid_total := v_paid_total + p_amount;

  IF v_paid_total >= v_booking.amount THEN
    v_status := 'paid';
  ELSE
    v_status := 'partial';
  END IF;

  INSERT INTO public.payment_transactions (
    tenant_id,
    entity_type,
    entity_id,
    booking_id,
    user_id,
    amount,
    currency,
    payment_method,
    direction,
    status,
    reference,
    recorded_by,
    notes
  ) VALUES (
    v_booking.tenant_id,
    'booking',
    p_booking_id,
    p_booking_id,
    v_booking.user_id,
    p_amount,
    v_booking.currency,
    p_payment_method,
    'payment',
    v_status,
    p_reference,
    auth.uid(),
    p_notes
  )
  RETURNING * INTO v_row;

  UPDATE public.bookings
  SET payment_status = v_status
  WHERE id = p_booking_id;

  PERFORM public.log_payment_audit(
    v_booking.tenant_id,
    'booking.payment_recorded',
    p_booking_id,
    NULL,
    jsonb_build_object(
      'amount', p_amount,
      'method', p_payment_method,
      'status', v_status
    )
  );

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_booking_payment(UUID, DECIMAL, public.payment_method, TEXT, TEXT)
  TO authenticated;

-- ─── Enhanced academy fee payment with ledger ───────────────────────────────

CREATE OR REPLACE FUNCTION public.record_fee_payment(
  p_fee_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_payment_method public.payment_method DEFAULT 'offline',
  p_reference TEXT DEFAULT NULL
)
RETURNS public.fee_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.fee_records;
  v_enrollment public.enrollments;
BEGIN
  SELECT * INTO v_row
  FROM public.fee_records
  WHERE id = p_fee_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fee record not found';
  END IF;

  IF NOT public.has_tenant_role(v_row.tenant_id, 'staff') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT * INTO v_enrollment
  FROM public.enrollments
  WHERE id = v_row.enrollment_id;

  UPDATE public.fee_records
  SET
    status = 'paid',
    paid_at = now(),
    recorded_by = auth.uid(),
    notes = COALESCE(p_notes, notes),
    payment_method = p_payment_method
  WHERE id = p_fee_id
  RETURNING * INTO v_row;

  INSERT INTO public.payment_transactions (
    tenant_id,
    entity_type,
    entity_id,
    user_id,
    amount,
    payment_method,
    direction,
    status,
    reference,
    recorded_by,
    notes
  ) VALUES (
    v_row.tenant_id,
    'academy_fee',
    p_fee_id,
    v_enrollment.student_id,
    v_row.amount,
    p_payment_method,
    'payment',
    'paid',
    p_reference,
    auth.uid(),
    p_notes
  );

  RETURN v_row;
END;
$$;

-- ─── Refund request (customer or staff) ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.request_booking_refund(
  p_booking_id UUID,
  p_amount DECIMAL,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.refund_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
  v_row public.refund_requests;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.user_id <> auth.uid()
    AND NOT public.has_tenant_role(v_booking.tenant_id, 'staff') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF v_booking.payment_status NOT IN ('paid', 'partial') THEN
    RAISE EXCEPTION 'Booking has no recorded payment to refund';
  END IF;

  IF p_amount <= 0 OR p_amount > v_booking.amount THEN
    RAISE EXCEPTION 'Invalid refund amount';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.refund_requests
    WHERE booking_id = p_booking_id
      AND status IN ('requested', 'approved')
  ) THEN
    RAISE EXCEPTION 'A refund request is already pending for this booking';
  END IF;

  INSERT INTO public.refund_requests (
    tenant_id,
    booking_id,
    user_id,
    amount,
    reason,
    status
  ) VALUES (
    v_booking.tenant_id,
    p_booking_id,
    COALESCE(v_booking.user_id, auth.uid()),
    p_amount,
    p_reason,
    'requested'
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_booking_refund(UUID, DECIMAL, TEXT)
  TO authenticated;

-- ─── Process refund (admin) ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.process_refund(
  p_refund_id UUID,
  p_action TEXT,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS public.refund_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refund public.refund_requests;
  v_booking public.bookings;
  v_tx public.payment_transactions;
BEGIN
  SELECT * INTO v_refund
  FROM public.refund_requests
  WHERE id = p_refund_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Refund request not found';
  END IF;

  IF NOT public.has_tenant_role(v_refund.tenant_id, 'staff') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF v_refund.status <> 'requested' THEN
    RAISE EXCEPTION 'Refund request is not pending';
  END IF;

  IF p_action = 'reject' THEN
    UPDATE public.refund_requests
    SET
      status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_notes = p_review_notes
    WHERE id = p_refund_id
    RETURNING * INTO v_refund;
    RETURN v_refund;
  END IF;

  IF p_action <> 'approve' THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_refund.booking_id
  FOR UPDATE;

  INSERT INTO public.payment_transactions (
    tenant_id,
    entity_type,
    entity_id,
    booking_id,
    user_id,
    amount,
    payment_method,
    direction,
    status,
    recorded_by,
    notes
  ) VALUES (
    v_refund.tenant_id,
    'booking',
    v_refund.booking_id,
    v_refund.booking_id,
    v_refund.user_id,
    v_refund.amount,
    'offline',
    'refund',
    'refunded',
    auth.uid(),
    p_review_notes
  )
  RETURNING * INTO v_tx;

  UPDATE public.bookings
  SET payment_status = 'refunded'
  WHERE id = v_refund.booking_id;

  UPDATE public.refund_requests
  SET
    status = 'processed',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = p_review_notes,
    payment_transaction_id = v_tx.id
  WHERE id = p_refund_id
  RETURNING * INTO v_refund;

  PERFORM public.log_payment_audit(
    v_refund.tenant_id,
    'booking.refund_processed',
    v_refund.booking_id,
    NULL,
    jsonb_build_object('amount', v_refund.amount, 'refund_id', p_refund_id)
  );

  RETURN v_refund;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_refund(UUID, TEXT, TEXT)
  TO authenticated;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_transactions_select_own" ON public.payment_transactions;
CREATE POLICY "payment_transactions_select_own"
  ON public.payment_transactions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "payment_transactions_select_staff" ON public.payment_transactions;
CREATE POLICY "payment_transactions_select_staff"
  ON public.payment_transactions FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

DROP POLICY IF EXISTS "payment_transactions_insert_staff" ON public.payment_transactions;
CREATE POLICY "payment_transactions_insert_staff"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, 'staff'));

DROP POLICY IF EXISTS "refund_requests_select_own" ON public.refund_requests;
CREATE POLICY "refund_requests_select_own"
  ON public.refund_requests FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "refund_requests_select_staff" ON public.refund_requests;
CREATE POLICY "refund_requests_select_staff"
  ON public.refund_requests FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

DROP POLICY IF EXISTS "refund_requests_insert_authenticated" ON public.refund_requests;
CREATE POLICY "refund_requests_insert_authenticated"
  ON public.refund_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_tenant_role(tenant_id, 'staff')
  );

DROP POLICY IF EXISTS "refund_requests_update_staff" ON public.refund_requests;
CREATE POLICY "refund_requests_update_staff"
  ON public.refund_requests FOR UPDATE
  USING (public.has_tenant_role(tenant_id, 'staff'));

-- Realtime for payment updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'payment_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_transactions;
  END IF;
END $$;
