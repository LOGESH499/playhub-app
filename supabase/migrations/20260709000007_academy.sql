-- PLAYHUB Module 2: Academy management tables

CREATE TABLE public.academy_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  academy_type public.academy_type NOT NULL,
  description TEXT,
  images JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT academy_programs_tenant_slug_unique UNIQUE (tenant_id, slug)
);

CREATE INDEX academy_programs_tenant_id_idx ON public.academy_programs(tenant_id);
CREATE INDEX academy_programs_venue_id_idx ON public.academy_programs(venue_id);
CREATE INDEX academy_programs_published_idx ON public.academy_programs(is_published)
  WHERE deleted_at IS NULL AND is_published = true;

CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.academy_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group_min INTEGER CHECK (age_group_min IS NULL OR age_group_min >= 0),
  age_group_max INTEGER,
  skill_level TEXT CHECK (skill_level IS NULL OR skill_level IN ('beginner', 'intermediate', 'advanced')),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  fee_amount DECIMAL(10, 2) CHECK (fee_amount IS NULL OR fee_amount >= 0),
  fee_period TEXT CHECK (fee_period IS NULL OR fee_period IN ('monthly', 'quarterly', 'annual')),
  schedule JSONB NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT batches_age_range CHECK (
    age_group_min IS NULL OR age_group_max IS NULL OR age_group_max >= age_group_min
  ),
  CONSTRAINT batches_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX batches_program_id_idx ON public.batches(program_id);
CREATE INDEX batches_tenant_id_idx ON public.batches(tenant_id);

CREATE TABLE public.batch_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT batch_coaches_unique UNIQUE (batch_id, coach_id)
);

CREATE INDEX batch_coaches_coach_id_idx ON public.batch_coaches(coach_id);

CREATE TABLE public.batch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT batch_sessions_time_valid CHECK (end_time > start_time)
);

CREATE INDEX batch_sessions_batch_id_idx ON public.batch_sessions(batch_id, session_date);
CREATE INDEX batch_sessions_tenant_id_idx ON public.batch_sessions(tenant_id);

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.enrollment_status NOT NULL DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active enrollment per student per batch
CREATE UNIQUE INDEX enrollments_active_student_batch_idx
  ON public.enrollments(batch_id, student_id)
  WHERE status = 'active';

CREATE INDEX enrollments_student_id_idx ON public.enrollments(student_id);
CREATE INDEX enrollments_batch_id_idx ON public.enrollments(batch_id);

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.batch_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL,
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT attendance_records_unique UNIQUE (session_id, student_id)
);

CREATE INDEX attendance_records_session_id_idx ON public.attendance_records(session_id);
CREATE INDEX attendance_records_student_id_idx ON public.attendance_records(student_id);

CREATE TRIGGER academy_programs_updated_at
  BEFORE UPDATE ON public.academy_programs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER batch_sessions_updated_at
  BEFORE UPDATE ON public.batch_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
