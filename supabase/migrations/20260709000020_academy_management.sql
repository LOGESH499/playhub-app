-- PLAYHUB Module 10: Academy management enhancements

-- ─── Sync tenant_id on batches from program ─────────────────────────────────

DROP TRIGGER IF EXISTS batches_sync_tenant ON public.batches;
CREATE TRIGGER batches_sync_tenant
  BEFORE INSERT ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_program();

-- ─── Fee records (offline payments, no gateway) ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.fee_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  period_label TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  paid_at TIMESTAMPTZ,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fee_records_enrollment_id_idx
  ON public.fee_records(enrollment_id);
CREATE INDEX IF NOT EXISTS fee_records_tenant_id_idx
  ON public.fee_records(tenant_id);

DROP TRIGGER IF EXISTS fee_records_updated_at ON public.fee_records;
CREATE TRIGGER fee_records_updated_at
  BEFORE UPDATE ON public.fee_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS fee_records_sync_tenant ON public.fee_records;
CREATE TRIGGER fee_records_sync_tenant
  BEFORE INSERT ON public.fee_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_enrollment();

-- ─── Student progress & performance tracking ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.enrollment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  skill_level TEXT CHECK (
    skill_level IS NULL OR skill_level IN ('beginner', 'intermediate', 'advanced')
  ),
  completion_percent INTEGER NOT NULL DEFAULT 0
    CHECK (completion_percent >= 0 AND completion_percent <= 100),
  milestones JSONB NOT NULL DEFAULT '[]',
  performance_notes TEXT,
  attendance_rate NUMERIC(5, 2) CHECK (
    attendance_rate IS NULL OR (attendance_rate >= 0 AND attendance_rate <= 100)
  ),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT enrollment_progress_enrollment_unique UNIQUE (enrollment_id)
);

CREATE INDEX IF NOT EXISTS enrollment_progress_tenant_id_idx
  ON public.enrollment_progress(tenant_id);

DROP TRIGGER IF EXISTS enrollment_progress_updated_at ON public.enrollment_progress;
CREATE TRIGGER enrollment_progress_updated_at
  BEFORE UPDATE ON public.enrollment_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS enrollment_progress_sync_tenant ON public.enrollment_progress;
CREATE TRIGGER enrollment_progress_sync_tenant
  BEFORE INSERT ON public.enrollment_progress
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_enrollment();

-- ─── Tenant sync from enrollment ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_tenant_id_from_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id
  FROM public.enrollments
  WHERE id = NEW.enrollment_id;
  RETURN NEW;
END;
$$;

-- ─── Audit helper ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_academy_audit(
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
    'academy',
    p_entity_id,
    p_old_values,
    p_new_values
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_academy_audit(UUID, TEXT, UUID, JSONB, JSONB)
  TO authenticated;

-- ─── Generate sessions from batch schedule JSONB ────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_batch_sessions(
  p_batch_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.batches;
  v_from DATE;
  v_to DATE;
  v_day TEXT;
  v_dow INTEGER;
  v_cursor DATE;
  v_days TEXT[];
  v_start TIME;
  v_end TIME;
  v_created INTEGER := 0;
  v_day_map CONSTANT JSONB := '{
    "sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6
  }'::JSONB;
BEGIN
  SELECT * INTO v_batch
  FROM public.batches
  WHERE id = p_batch_id
    AND deleted_at IS NULL
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found or inactive';
  END IF;

  IF NOT public.has_tenant_role(v_batch.tenant_id, 'coach') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  v_from := COALESCE(p_from_date, v_batch.start_date, CURRENT_DATE);
  v_to := COALESCE(p_to_date, v_batch.end_date, v_from + 56);

  IF v_to < v_from THEN
    RAISE EXCEPTION 'Invalid date range';
  END IF;

  SELECT ARRAY(
    SELECT jsonb_array_elements_text(COALESCE(v_batch.schedule->'days', '[]'::JSONB))
  ) INTO v_days;

  IF array_length(v_days, 1) IS NULL THEN
    RAISE EXCEPTION 'Batch schedule has no training days';
  END IF;

  v_start := COALESCE((v_batch.schedule->>'start')::TIME, '09:00'::TIME);
  v_end := COALESCE((v_batch.schedule->>'end')::TIME, '10:00'::TIME);

  v_cursor := v_from;
  WHILE v_cursor <= v_to LOOP
  FOREACH v_day IN ARRAY v_days LOOP
    v_dow := (v_day_map ->> lower(v_day))::INTEGER;
    IF EXTRACT(DOW FROM v_cursor)::INTEGER = v_dow THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.batch_sessions
        WHERE batch_id = p_batch_id
          AND session_date = v_cursor
          AND start_time = v_start
      ) THEN
        INSERT INTO public.batch_sessions (
          tenant_id,
          batch_id,
          session_date,
          start_time,
          end_time,
          status
        ) VALUES (
          v_batch.tenant_id,
          p_batch_id,
          v_cursor,
          v_start,
          v_end,
          'scheduled'
        );
        v_created := v_created + 1;
      END IF;
    END IF;
  END LOOP;
    v_cursor := v_cursor + 1;
  END LOOP;

  RETURN v_created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_batch_sessions(UUID, DATE, DATE)
  TO authenticated;

-- ─── Bulk attendance upsert ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.upsert_session_attendance(
  p_session_id UUID,
  p_records JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.batch_sessions;
  v_record JSONB;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_session
  FROM public.batch_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF NOT public.has_tenant_role(v_session.tenant_id, 'coach') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  FOR v_record IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    INSERT INTO public.attendance_records (
      tenant_id,
      session_id,
      student_id,
      status,
      marked_by,
      notes
    ) VALUES (
      v_session.tenant_id,
      p_session_id,
      (v_record->>'student_id')::UUID,
      (v_record->>'status')::public.attendance_status,
      auth.uid(),
      v_record->>'notes'
    )
    ON CONFLICT (session_id, student_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      marked_by = auth.uid(),
      marked_at = now(),
      notes = EXCLUDED.notes;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_session_attendance(UUID, JSONB)
  TO authenticated;

-- ─── Update enrollment status ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_enrollment_status(
  p_enrollment_id UUID,
  p_status public.enrollment_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.enrollments;
BEGIN
  SELECT * INTO v_row
  FROM public.enrollments
  WHERE id = p_enrollment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  IF NOT public.has_tenant_role(v_row.tenant_id, 'staff') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE public.enrollments
  SET
    status = p_status,
    notes = COALESCE(p_notes, notes),
    completed_at = CASE
      WHEN p_status = 'completed' THEN now()
      ELSE completed_at
    END
  WHERE id = p_enrollment_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_enrollment_status(UUID, public.enrollment_status, TEXT)
  TO authenticated;

-- ─── Progress upsert + attendance rate refresh ──────────────────────────────

CREATE OR REPLACE FUNCTION public.upsert_enrollment_progress(
  p_enrollment_id UUID,
  p_skill_level TEXT DEFAULT NULL,
  p_completion_percent INTEGER DEFAULT NULL,
  p_milestones JSONB DEFAULT NULL,
  p_performance_notes TEXT DEFAULT NULL
)
RETURNS public.enrollment_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment public.enrollments;
  v_row public.enrollment_progress;
  v_total INTEGER;
  v_present INTEGER;
  v_rate NUMERIC(5, 2);
BEGIN
  SELECT * INTO v_enrollment
  FROM public.enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  IF NOT public.has_tenant_role(v_enrollment.tenant_id, 'coach') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.attendance_records ar
  JOIN public.batch_sessions bs ON bs.id = ar.session_id
  WHERE ar.student_id = v_enrollment.student_id
    AND bs.batch_id = v_enrollment.batch_id;

  SELECT COUNT(*) INTO v_present
  FROM public.attendance_records ar
  JOIN public.batch_sessions bs ON bs.id = ar.session_id
  WHERE ar.student_id = v_enrollment.student_id
    AND bs.batch_id = v_enrollment.batch_id
    AND ar.status IN ('present', 'late');

  v_rate := CASE
    WHEN v_total > 0 THEN ROUND((v_present::NUMERIC / v_total) * 100, 2)
    ELSE NULL
  END;

  INSERT INTO public.enrollment_progress (
    tenant_id,
    enrollment_id,
    skill_level,
    completion_percent,
    milestones,
    performance_notes,
    attendance_rate,
    updated_by
  ) VALUES (
    v_enrollment.tenant_id,
    p_enrollment_id,
    p_skill_level,
    COALESCE(p_completion_percent, 0),
    COALESCE(p_milestones, '[]'::JSONB),
    p_performance_notes,
    v_rate,
    auth.uid()
  )
  ON CONFLICT (enrollment_id)
  DO UPDATE SET
    skill_level = COALESCE(p_skill_level, enrollment_progress.skill_level),
    completion_percent = COALESCE(p_completion_percent, enrollment_progress.completion_percent),
    milestones = COALESCE(p_milestones, enrollment_progress.milestones),
    performance_notes = COALESCE(p_performance_notes, enrollment_progress.performance_notes),
    attendance_rate = v_rate,
    updated_by = auth.uid(),
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_enrollment_progress(UUID, TEXT, INTEGER, JSONB, TEXT)
  TO authenticated;

-- ─── Offline fee generation & payment recording ─────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_batch_fees(
  p_batch_id UUID,
  p_period_label TEXT,
  p_due_date DATE DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.batches;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_batch
  FROM public.batches
  WHERE id = p_batch_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;

  IF NOT public.has_tenant_role(v_batch.tenant_id, 'staff') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF v_batch.fee_amount IS NULL THEN
    RAISE EXCEPTION 'Batch has no fee amount configured';
  END IF;

  INSERT INTO public.fee_records (
    tenant_id,
    enrollment_id,
    amount,
    period_label,
    due_date,
    status
  )
  SELECT
    v_batch.tenant_id,
    e.id,
    v_batch.fee_amount,
    p_period_label,
    p_due_date,
    'pending'
  FROM public.enrollments e
  WHERE e.batch_id = p_batch_id
    AND e.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.fee_records fr
      WHERE fr.enrollment_id = e.id
        AND fr.period_label = p_period_label
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_batch_fees(UUID, TEXT, DATE)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.record_fee_payment(
  p_fee_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.fee_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.fee_records;
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

  UPDATE public.fee_records
  SET
    status = 'paid',
    paid_at = now(),
    recorded_by = auth.uid(),
    notes = COALESCE(p_notes, notes)
  WHERE id = p_fee_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_fee_payment(UUID, TEXT)
  TO authenticated;

-- ─── RLS for new tables ─────────────────────────────────────────────────────

ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fee_records_select_own" ON public.fee_records;
CREATE POLICY "fee_records_select_own"
  ON public.fee_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = fee_records.enrollment_id
        AND e.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "fee_records_select_staff" ON public.fee_records;
CREATE POLICY "fee_records_select_staff"
  ON public.fee_records FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

DROP POLICY IF EXISTS "fee_records_manage_staff" ON public.fee_records;
CREATE POLICY "fee_records_manage_staff"
  ON public.fee_records FOR ALL
  USING (public.has_tenant_role(tenant_id, 'staff'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'staff'));

DROP POLICY IF EXISTS "enrollment_progress_select_own" ON public.enrollment_progress;
CREATE POLICY "enrollment_progress_select_own"
  ON public.enrollment_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_progress.enrollment_id
        AND e.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "enrollment_progress_select_staff" ON public.enrollment_progress;
CREATE POLICY "enrollment_progress_select_staff"
  ON public.enrollment_progress FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

DROP POLICY IF EXISTS "enrollment_progress_manage_coach" ON public.enrollment_progress;
CREATE POLICY "enrollment_progress_manage_coach"
  ON public.enrollment_progress FOR ALL
  USING (public.has_tenant_role(tenant_id, 'coach'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'coach'));
