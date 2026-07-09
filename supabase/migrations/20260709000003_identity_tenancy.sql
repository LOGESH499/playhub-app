-- PLAYHUB Module 2: Identity extensions and multi-tenancy tables

-- Guardian / minor account links
CREATE TABLE public.guardian_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ward_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('parent', 'guardian')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guardian_links_distinct CHECK (guardian_id <> ward_id),
  CONSTRAINT guardian_links_unique UNIQUE (guardian_id, ward_id)
);

CREATE INDEX guardian_links_guardian_id_idx ON public.guardian_links(guardian_id);
CREATE INDEX guardian_links_ward_id_idx ON public.guardian_links(ward_id);

-- Organizations (multi-tenant root)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency TEXT NOT NULL DEFAULT 'INR',
  settings JSONB NOT NULL DEFAULT '{}',
  status public.tenant_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX tenants_status_idx ON public.tenants(status) WHERE deleted_at IS NULL;

-- User membership in tenants
CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.tenant_role NOT NULL,
  status public.member_status NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenant_members_unique UNIQUE (tenant_id, user_id)
);

CREATE INDEX tenant_members_user_id_idx ON public.tenant_members(user_id);
CREATE INDEX tenant_members_tenant_id_idx ON public.tenant_members(tenant_id);

-- Staff invite tokens
CREATE TABLE public.tenant_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.tenant_role NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenant_invites_email_unique UNIQUE (tenant_id, email)
);

CREATE INDEX tenant_invites_token_idx ON public.tenant_invites(token);
CREATE INDEX tenant_invites_tenant_id_idx ON public.tenant_invites(tenant_id);

-- updated_at triggers
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tenant_members_updated_at
  BEFORE UPDATE ON public.tenant_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
