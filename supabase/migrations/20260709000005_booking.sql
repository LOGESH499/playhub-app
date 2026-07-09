-- PLAYHUB Module 2: Booking engine tables

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sport_type public.sport_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  recurring_group_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT bookings_time_valid CHECK (end_time > start_time)
);

-- Prevent overlapping active bookings on the same resource
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (
    status IN ('pending', 'confirmed')
    AND deleted_at IS NULL
  );

CREATE INDEX bookings_resource_time_idx ON public.bookings(resource_id, start_time, end_time);
CREATE INDEX bookings_tenant_created_idx ON public.bookings(tenant_id, created_at DESC);
CREATE INDEX bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX bookings_venue_id_idx ON public.bookings(venue_id);
CREATE INDEX bookings_status_idx ON public.bookings(status) WHERE deleted_at IS NULL;

CREATE TABLE public.slot_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT slot_holds_time_valid CHECK (end_time > start_time)
);

CREATE INDEX slot_holds_resource_time_idx ON public.slot_holds(resource_id, start_time, end_time);
CREATE INDEX slot_holds_expires_at_idx ON public.slot_holds(expires_at);
CREATE INDEX slot_holds_user_id_idx ON public.slot_holds(user_id);

CREATE TABLE public.waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  desired_start TIMESTAMPTZ NOT NULL,
  desired_end TIMESTAMPTZ NOT NULL,
  status public.waitlist_status NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_entries_time_valid CHECK (desired_end > desired_start)
);

CREATE INDEX waitlist_entries_resource_idx ON public.waitlist_entries(resource_id, status);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
