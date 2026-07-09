-- PLAYHUB Module 2: Pricing, packages, and promo codes

CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  sport_type public.sport_type,
  name TEXT NOT NULL,
  day_of_week INTEGER[] NOT NULL DEFAULT '{}',
  start_time TIME,
  end_time TIME,
  price_per_slot DECIMAL(10, 2) NOT NULL CHECK (price_per_slot >= 0),
  slot_duration_minutes INTEGER NOT NULL CHECK (slot_duration_minutes > 0),
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pricing_rules_tenant_id_idx ON public.pricing_rules(tenant_id);
CREATE INDEX pricing_rules_venue_id_idx ON public.pricing_rules(venue_id);
CREATE INDEX pricing_rules_resource_id_idx ON public.pricing_rules(resource_id);

CREATE TABLE public.membership_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER CHECK (credits IS NULL OR credits >= 0),
  discount_percent DECIMAL(5, 2) CHECK (
    discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)
  ),
  valid_days INTEGER NOT NULL CHECK (valid_days > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  sport_types public.sport_type[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX membership_packages_tenant_id_idx ON public.membership_packages(tenant_id);

CREATE TABLE public.user_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.membership_packages(id) ON DELETE CASCADE,
  credits_remaining INTEGER CHECK (credits_remaining IS NULL OR credits_remaining >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_packages_user_id_idx ON public.user_packages(user_id);
CREATE INDEX user_packages_tenant_id_idx ON public.user_packages(tenant_id);

CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type public.discount_type NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promo_codes_tenant_code_unique UNIQUE (tenant_id, code),
  CONSTRAINT promo_codes_valid_range CHECK (
    valid_from IS NULL OR valid_until IS NULL OR valid_until > valid_from
  )
);

CREATE INDEX promo_codes_tenant_id_idx ON public.promo_codes(tenant_id);

CREATE TRIGGER pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER membership_packages_updated_at
  BEFORE UPDATE ON public.membership_packages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
