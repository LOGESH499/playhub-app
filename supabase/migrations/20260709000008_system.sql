-- PLAYHUB Module 2: System tables (templates, notifications, audit)

CREATE TABLE public.sport_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_type public.sport_type NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  resource_label TEXT NOT NULL,
  default_slot_minutes INTEGER NOT NULL CHECK (default_slot_minutes > 0),
  icon_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_type public.academy_type NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  default_batch_duration_minutes INTEGER CHECK (
    default_batch_duration_minutes IS NULL OR default_batch_duration_minutes > 0
  ),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_id_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications(user_id) WHERE read_at IS NULL;

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_tenant_id_idx ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX audit_logs_actor_id_idx ON public.audit_logs(actor_id);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs(entity_type, entity_id);
