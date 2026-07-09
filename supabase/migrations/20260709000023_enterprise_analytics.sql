-- PLAYHUB Module 13: Enterprise analytics

CREATE OR REPLACE FUNCTION public.get_enterprise_analytics(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  IF NOT public.has_tenant_role(p_tenant_id, 'staff') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  v_start := p_start_date::TIMESTAMPTZ;
  v_end := (p_end_date + 1)::TIMESTAMPTZ;

  SELECT jsonb_build_object(
    'summary', (
      SELECT jsonb_build_object(
        'totalRevenue', COALESCE((
          SELECT SUM(amount)
          FROM public.payment_transactions
          WHERE tenant_id = p_tenant_id
            AND direction = 'payment'
            AND created_at >= v_start
            AND created_at < v_end
        ), 0),
        'totalRefunds', COALESCE((
          SELECT SUM(amount)
          FROM public.payment_transactions
          WHERE tenant_id = p_tenant_id
            AND direction = 'refund'
            AND created_at >= v_start
            AND created_at < v_end
        ), 0),
        'totalBookings', COALESCE((
          SELECT COUNT(*)
          FROM public.bookings
          WHERE tenant_id = p_tenant_id
            AND deleted_at IS NULL
            AND start_time >= v_start
            AND start_time < v_end
        ), 0),
        'activeCustomers', COALESCE((
          SELECT COUNT(DISTINCT user_id)
          FROM public.bookings
          WHERE tenant_id = p_tenant_id
            AND deleted_at IS NULL
            AND start_time >= v_start
            AND start_time < v_end
        ), 0),
        'avgVenueUtilization', COALESCE((
          SELECT ROUND(AVG(utilization_pct)::numeric, 1)
          FROM (
            SELECT
              CASE
                WHEN COUNT(s.id) > 0 THEN
                  100.0 * COUNT(b.id) FILTER (
                    WHERE b.status IN ('confirmed', 'completed', 'pending')
                  ) / COUNT(s.id)
                ELSE 0
              END AS utilization_pct
            FROM public.venues v
            LEFT JOIN public.slots s
              ON s.venue_id = v.id
              AND s.deleted_at IS NULL
              AND s.start_time >= v_start
              AND s.start_time < v_end
            LEFT JOIN public.bookings b
              ON b.venue_id = v.id
              AND b.deleted_at IS NULL
              AND b.start_time >= v_start
              AND b.start_time < v_end
            WHERE v.tenant_id = p_tenant_id
              AND v.deleted_at IS NULL
            GROUP BY v.id
          ) vu
        ), 0)
      )
    ),
    'venueUtilization', COALESCE((
      SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.utilization_pct DESC)
      FROM (
        SELECT
          v.id AS venue_id,
          v.name AS venue_name,
          COUNT(DISTINCT s.id) AS total_slots,
          COUNT(DISTINCT b.id) FILTER (
            WHERE b.status IN ('confirmed', 'completed', 'pending')
          ) AS booked_slots,
          CASE
            WHEN COUNT(DISTINCT s.id) > 0 THEN
              ROUND(
                100.0 * COUNT(DISTINCT b.id) FILTER (
                  WHERE b.status IN ('confirmed', 'completed', 'pending')
                ) / COUNT(DISTINCT s.id),
                1
              )
            ELSE 0
          END AS utilization_pct
        FROM public.venues v
        LEFT JOIN public.slots s
          ON s.venue_id = v.id
          AND s.deleted_at IS NULL
          AND s.start_time >= v_start
          AND s.start_time < v_end
        LEFT JOIN public.bookings b
          ON b.venue_id = v.id
          AND b.deleted_at IS NULL
          AND b.start_time >= v_start
          AND b.start_time < v_end
        WHERE v.tenant_id = p_tenant_id
          AND v.deleted_at IS NULL
        GROUP BY v.id, v.name
      ) t
    ), '[]'::jsonb),
    'revenueByMonth', COALESCE((
      SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.month)
      FROM (
        SELECT
          to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
          COALESCE(SUM(amount) FILTER (WHERE direction = 'payment'), 0) AS revenue,
          COALESCE(SUM(amount) FILTER (WHERE direction = 'refund'), 0) AS refunds
        FROM public.payment_transactions
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_start
          AND created_at < v_end
        GROUP BY 1
      ) t
    ), '[]'::jsonb),
    'bookingTrends', COALESCE((
      SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.date)
      FROM (
        SELECT
          to_char(date_trunc('day', start_time), 'YYYY-MM-DD') AS date,
          COUNT(*) AS bookings,
          COALESCE(SUM(amount) FILTER (WHERE payment_status = 'paid'), 0) AS revenue
        FROM public.bookings
        WHERE tenant_id = p_tenant_id
          AND deleted_at IS NULL
          AND start_time >= v_start
          AND start_time < v_end
        GROUP BY 1
      ) t
    ), '[]'::jsonb),
    'peakHours', COALESCE((
      SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.hour)
      FROM (
        SELECT
          EXTRACT(HOUR FROM start_time AT TIME ZONE 'Asia/Kolkata')::INT AS hour,
          COUNT(*) AS bookings
        FROM public.bookings
        WHERE tenant_id = p_tenant_id
          AND deleted_at IS NULL
          AND start_time >= v_start
          AND start_time < v_end
          AND status IN ('confirmed', 'completed', 'pending')
        GROUP BY 1
      ) t
    ), '[]'::jsonb),
    'sportsPopularity', COALESCE((
      SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.bookings DESC)
      FROM (
        SELECT
          sport_type::TEXT AS sport,
          COUNT(*) AS bookings,
          COALESCE(SUM(amount) FILTER (WHERE payment_status IN ('paid', 'partial')), 0) AS revenue
        FROM public.bookings
        WHERE tenant_id = p_tenant_id
          AND deleted_at IS NULL
          AND start_time >= v_start
          AND start_time < v_end
        GROUP BY sport_type
      ) t
    ), '[]'::jsonb),
    'academyReports', (
      SELECT jsonb_build_object(
        'programs', (
          SELECT COUNT(*) FROM public.academy_programs
          WHERE tenant_id = p_tenant_id AND deleted_at IS NULL
        ),
        'batches', (
          SELECT COUNT(*) FROM public.batches
          WHERE tenant_id = p_tenant_id AND deleted_at IS NULL
        ),
        'activeEnrollments', (
          SELECT COUNT(*) FROM public.enrollments
          WHERE tenant_id = p_tenant_id AND status = 'active'
        ),
        'sessionsInRange', (
          SELECT COUNT(*) FROM public.batch_sessions
          WHERE tenant_id = p_tenant_id
            AND session_date >= p_start_date
            AND session_date <= p_end_date
        ),
        'attendanceRate', COALESCE((
          SELECT ROUND(
            100.0 * COUNT(*) FILTER (WHERE status = 'present')
            / NULLIF(COUNT(*), 0),
            1
          )
          FROM public.attendance_records ar
          JOIN public.batch_sessions bs ON bs.id = ar.session_id
          WHERE ar.tenant_id = p_tenant_id
            AND bs.session_date >= p_start_date
            AND bs.session_date <= p_end_date
        ), 0),
        'feesCollected', COALESCE((
          SELECT SUM(amount)
          FROM public.payment_transactions
          WHERE tenant_id = p_tenant_id
            AND entity_type = 'academy_fee'
            AND direction = 'payment'
            AND created_at >= v_start
            AND created_at < v_end
        ), 0)
      )
    ),
    'coachReports', COALESCE((
      SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.sessions DESC)
      FROM (
        SELECT
          p.id AS coach_id,
          p.full_name AS coach_name,
          COUNT(DISTINCT bs.id) AS sessions,
          COUNT(ar.id) AS attendance_marked,
          COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
          CASE
            WHEN COUNT(ar.id) > 0 THEN
              ROUND(100.0 * COUNT(ar.id) FILTER (WHERE ar.status = 'present') / COUNT(ar.id), 1)
            ELSE 0
          END AS attendance_rate
        FROM public.batch_coaches bc
        JOIN public.batches b ON b.id = bc.batch_id
        JOIN public.profiles p ON p.id = bc.coach_id
        LEFT JOIN public.batch_sessions bs
          ON bs.batch_id = b.id
          AND bs.session_date >= p_start_date
          AND bs.session_date <= p_end_date
        LEFT JOIN public.attendance_records ar ON ar.session_id = bs.id
        WHERE b.tenant_id = p_tenant_id
          AND b.deleted_at IS NULL
        GROUP BY p.id, p.full_name
      ) t
    ), '[]'::jsonb),
    'customerGrowth', COALESCE((
      SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.month)
      FROM (
        SELECT
          to_char(date_trunc('month', first_seen), 'YYYY-MM') AS month,
          COUNT(*) AS new_customers
        FROM (
          SELECT user_id, MIN(created_at) AS first_seen
          FROM public.bookings
          WHERE tenant_id = p_tenant_id
            AND deleted_at IS NULL
          GROUP BY user_id
        ) first_bookings
        WHERE first_seen >= v_start
          AND first_seen < v_end
        GROUP BY 1
      ) t
    ), '[]'::jsonb),
    'generatedAt', to_jsonb(now())
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_enterprise_analytics(UUID, DATE, DATE)
  TO authenticated;

-- Realtime analytics materialized view refresh helper (lightweight snapshot table)
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL DEFAULT '{}',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_snapshots_tenant_idx
  ON public.analytics_snapshots(tenant_id, created_at DESC);

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_snapshots_select_staff" ON public.analytics_snapshots;
CREATE POLICY "analytics_snapshots_select_staff"
  ON public.analytics_snapshots FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

DROP POLICY IF EXISTS "analytics_snapshots_insert_staff" ON public.analytics_snapshots;
CREATE POLICY "analytics_snapshots_insert_staff"
  ON public.analytics_snapshots FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, 'staff'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'analytics_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_snapshots;
  END IF;
END $$;
