-- PLAYHUB Module 2: RLS helper functions (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_role(p_tenant_id UUID)
RETURNS public.tenant_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.tenant_members
  WHERE tenant_id = p_tenant_id
    AND user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_role_level(p_role public.tenant_role)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_role
    WHEN 'owner' THEN 60
    WHEN 'admin' THEN 50
    WHEN 'manager' THEN 40
    WHEN 'staff' THEN 30
    WHEN 'coach' THEN 20
    WHEN 'member' THEN 10
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(
  p_tenant_id UUID,
  p_min_role public.tenant_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin()
    OR COALESCE(
      public.get_role_level(public.get_user_tenant_role(p_tenant_id))
        >= public.get_role_level(p_min_role),
      false
    );
$$;

-- Sync tenant_id from related tables for RLS on child rows
CREATE OR REPLACE FUNCTION public.sync_tenant_id_from_venue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id FROM public.venues WHERE id = NEW.venue_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_tenant_id_from_resource()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id FROM public.resources WHERE id = NEW.resource_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_tenant_id_from_batch()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id FROM public.batches WHERE id = NEW.batch_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_tenant_id_from_program()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id FROM public.academy_programs WHERE id = NEW.program_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_tenant_id_from_session()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id FROM public.batch_sessions WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

-- Auto-populate tenant_id on insert
CREATE TRIGGER bookings_sync_tenant
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_resource();

CREATE TRIGGER slot_holds_sync_tenant
  BEFORE INSERT ON public.slot_holds
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_resource();

CREATE TRIGGER waitlist_sync_tenant
  BEFORE INSERT ON public.waitlist_entries
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_resource();

CREATE TRIGGER enrollments_sync_tenant
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_batch();

CREATE TRIGGER batch_sessions_sync_tenant
  BEFORE INSERT ON public.batch_sessions
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_batch();

CREATE TRIGGER attendance_sync_tenant
  BEFORE INSERT ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_id_from_session();
