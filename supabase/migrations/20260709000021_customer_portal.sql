-- PLAYHUB Module 11: Customer portal — favorites & reviews

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('venue', 'sport')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_favorites_unique UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx
  ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_entity_idx
  ON public.user_favorites(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.venue_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT venue_reviews_user_venue_unique UNIQUE (user_id, venue_id)
);

CREATE INDEX IF NOT EXISTS venue_reviews_venue_id_idx
  ON public.venue_reviews(venue_id);
CREATE INDEX IF NOT EXISTS venue_reviews_user_id_idx
  ON public.venue_reviews(user_id);

DROP TRIGGER IF EXISTS venue_reviews_updated_at ON public.venue_reviews;
CREATE TRIGGER venue_reviews_updated_at
  BEFORE UPDATE ON public.venue_reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Toggle favorite ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.toggle_user_favorite(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_entity_type NOT IN ('venue', 'sport') THEN
    RAISE EXCEPTION 'Invalid entity type';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_favorites
    WHERE user_id = auth.uid()
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.user_favorites
    WHERE user_id = auth.uid()
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id;
    RETURN false;
  END IF;

  INSERT INTO public.user_favorites (user_id, tenant_id, entity_type, entity_id)
  VALUES (auth.uid(), p_tenant_id, p_entity_type, p_entity_id);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_user_favorite(TEXT, UUID, UUID)
  TO authenticated;

-- ─── Upsert venue review ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.upsert_venue_review(
  p_venue_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL
)
RETURNS public.venue_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_row public.venue_reviews;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.venues
  WHERE id = p_venue_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venue not found';
  END IF;

  INSERT INTO public.venue_reviews (
    tenant_id,
    user_id,
    venue_id,
    booking_id,
    rating,
    comment
  ) VALUES (
    v_tenant_id,
    auth.uid(),
    p_venue_id,
    p_booking_id,
    p_rating,
    p_comment
  )
  ON CONFLICT (user_id, venue_id)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    booking_id = COALESCE(EXCLUDED.booking_id, venue_reviews.booking_id),
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_venue_review(UUID, INTEGER, TEXT, UUID)
  TO authenticated;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_favorites_select_own" ON public.user_favorites;
CREATE POLICY "user_favorites_select_own"
  ON public.user_favorites FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_favorites_manage_own" ON public.user_favorites;
CREATE POLICY "user_favorites_manage_own"
  ON public.user_favorites FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "venue_reviews_select_all" ON public.venue_reviews;
CREATE POLICY "venue_reviews_select_all"
  ON public.venue_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "venue_reviews_manage_own" ON public.venue_reviews;
CREATE POLICY "venue_reviews_manage_own"
  ON public.venue_reviews FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
