-- PLAYHUB Module 2: Venues, resources, hours, blackouts

CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'IN',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  amenities JSONB NOT NULL DEFAULT '[]',
  images JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT venues_tenant_slug_unique UNIQUE (tenant_id, slug),
  CONSTRAINT venues_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX venues_tenant_id_idx ON public.venues(tenant_id);
CREATE INDEX venues_city_idx ON public.venues(city) WHERE deleted_at IS NULL;
CREATE INDEX venues_published_idx ON public.venues(is_published) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX venues_geo_idx ON public.venues(latitude, longitude) WHERE deleted_at IS NULL;

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport_type public.sport_type NOT NULL,
  resource_subtype TEXT,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
  surface_type TEXT,
  is_indoor BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX resources_venue_id_idx ON public.resources(venue_id);
CREATE INDEX resources_tenant_id_idx ON public.resources(tenant_id);
CREATE INDEX resources_sport_type_idx ON public.resources(sport_type) WHERE is_active = true AND deleted_at IS NULL;

CREATE TABLE public.operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT operating_hours_time_valid CHECK (close_time > open_time OR is_closed = true),
  CONSTRAINT operating_hours_scope_check CHECK (
    (venue_id IS NOT NULL AND resource_id IS NULL)
    OR (venue_id IS NULL AND resource_id IS NOT NULL)
    OR (venue_id IS NOT NULL AND resource_id IS NOT NULL)
  )
);

CREATE INDEX operating_hours_venue_id_idx ON public.operating_hours(venue_id);
CREATE INDEX operating_hours_resource_id_idx ON public.operating_hours(resource_id);

CREATE TABLE public.blackout_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blackout_periods_time_valid CHECK (end_time > start_time)
);

CREATE INDEX blackout_periods_venue_id_idx ON public.blackout_periods(venue_id);
CREATE INDEX blackout_periods_resource_time_idx ON public.blackout_periods(resource_id, start_time, end_time);

CREATE TRIGGER venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
