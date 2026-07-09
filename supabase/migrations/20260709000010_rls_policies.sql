-- PLAYHUB Module 2: Row Level Security policies

-- ─── Enable RLS on all tables ───────────────────────────────────────────────

ALTER TABLE public.guardian_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blackout_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── Profiles (extend Module 1 policies) ────────────────────────────────────

CREATE POLICY "profiles_select_platform_admin"
  ON public.profiles FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "profiles_select_tenant_peers"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.tenant_members tm1
      JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = profiles.id
        AND tm1.status = 'active'
        AND tm2.status = 'active'
    )
  );

-- ─── Guardian links ─────────────────────────────────────────────────────────

CREATE POLICY "guardian_links_select_own"
  ON public.guardian_links FOR SELECT
  USING (guardian_id = auth.uid() OR ward_id = auth.uid());

CREATE POLICY "guardian_links_insert_guardian"
  ON public.guardian_links FOR INSERT
  WITH CHECK (guardian_id = auth.uid());

CREATE POLICY "guardian_links_delete_guardian"
  ON public.guardian_links FOR DELETE
  USING (guardian_id = auth.uid());

-- ─── Tenants ────────────────────────────────────────────────────────────────

CREATE POLICY "tenants_select_member"
  ON public.tenants FOR SELECT
  USING (
    deleted_at IS NULL
    AND (public.is_tenant_member(id) OR public.is_platform_admin())
  );

CREATE POLICY "tenants_insert_authenticated"
  ON public.tenants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tenants_update_admin"
  ON public.tenants FOR UPDATE
  USING (public.has_tenant_role(id, 'admin'))
  WITH CHECK (public.has_tenant_role(id, 'admin'));

CREATE POLICY "tenants_delete_owner"
  ON public.tenants FOR DELETE
  USING (public.has_tenant_role(id, 'owner'));

CREATE POLICY "tenants_select_platform_admin"
  ON public.tenants FOR SELECT
  USING (public.is_platform_admin());

-- ─── Tenant members ─────────────────────────────────────────────────────────

CREATE POLICY "tenant_members_select_member"
  ON public.tenant_members FOR SELECT
  USING (public.is_tenant_member(tenant_id) OR public.is_platform_admin());

CREATE POLICY "tenant_members_insert_admin"
  ON public.tenant_members FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY "tenant_members_update_admin"
  ON public.tenant_members FOR UPDATE
  USING (public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY "tenant_members_delete_admin"
  ON public.tenant_members FOR DELETE
  USING (public.has_tenant_role(tenant_id, 'admin'));

-- ─── Tenant invites ─────────────────────────────────────────────────────────

CREATE POLICY "tenant_invites_select_admin"
  ON public.tenant_invites FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY "tenant_invites_insert_admin"
  ON public.tenant_invites FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY "tenant_invites_update_admin"
  ON public.tenant_invites FOR UPDATE
  USING (public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY "tenant_invites_delete_admin"
  ON public.tenant_invites FOR DELETE
  USING (public.has_tenant_role(tenant_id, 'admin'));

-- ─── Venues ─────────────────────────────────────────────────────────────────

CREATE POLICY "venues_select_public"
  ON public.venues FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "venues_select_member"
  ON public.venues FOR SELECT
  USING (public.is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "venues_insert_manager"
  ON public.venues FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY "venues_update_manager"
  ON public.venues FOR UPDATE
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY "venues_delete_admin"
  ON public.venues FOR DELETE
  USING (public.has_tenant_role(tenant_id, 'admin'));

-- ─── Resources ──────────────────────────────────────────────────────────────

CREATE POLICY "resources_select_public"
  ON public.resources FOR SELECT
  USING (
    deleted_at IS NULL
    AND is_active = true
    AND EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.id = resources.venue_id
        AND v.is_published = true
        AND v.deleted_at IS NULL
    )
  );

CREATE POLICY "resources_select_member"
  ON public.resources FOR SELECT
  USING (public.is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "resources_insert_manager"
  ON public.resources FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY "resources_update_manager"
  ON public.resources FOR UPDATE
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY "resources_delete_admin"
  ON public.resources FOR DELETE
  USING (public.has_tenant_role(tenant_id, 'admin'));

-- ─── Operating hours ────────────────────────────────────────────────────────

CREATE POLICY "operating_hours_select_public"
  ON public.operating_hours FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.id = operating_hours.venue_id
        AND v.is_published = true
        AND v.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.resources r
      JOIN public.venues v ON v.id = r.venue_id
      WHERE r.id = operating_hours.resource_id
        AND v.is_published = true
        AND v.deleted_at IS NULL
    )
  );

CREATE POLICY "operating_hours_select_member"
  ON public.operating_hours FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "operating_hours_manage_manager"
  ON public.operating_hours FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

-- ─── Blackout periods ───────────────────────────────────────────────────────

CREATE POLICY "blackout_periods_select_member"
  ON public.blackout_periods FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "blackout_periods_manage_manager"
  ON public.blackout_periods FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

-- ─── Bookings ───────────────────────────────────────────────────────────────

CREATE POLICY "bookings_select_own"
  ON public.bookings FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "bookings_select_staff"
  ON public.bookings FOR SELECT
  USING (
    public.has_tenant_role(tenant_id, 'staff')
    AND deleted_at IS NULL
  );

CREATE POLICY "bookings_insert_authenticated"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR public.has_tenant_role(tenant_id, 'staff'))
  );

CREATE POLICY "bookings_update_own_or_staff"
  ON public.bookings FOR UPDATE
  USING (
    (user_id = auth.uid() OR public.has_tenant_role(tenant_id, 'staff'))
    AND deleted_at IS NULL
  );

-- ─── Slot holds ─────────────────────────────────────────────────────────────

CREATE POLICY "slot_holds_select_own"
  ON public.slot_holds FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "slot_holds_select_staff"
  ON public.slot_holds FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

CREATE POLICY "slot_holds_insert_own"
  ON public.slot_holds FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "slot_holds_delete_own"
  ON public.slot_holds FOR DELETE
  USING (user_id = auth.uid() OR public.has_tenant_role(tenant_id, 'staff'));

-- ─── Waitlist ───────────────────────────────────────────────────────────────

CREATE POLICY "waitlist_select_own"
  ON public.waitlist_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "waitlist_select_staff"
  ON public.waitlist_entries FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

CREATE POLICY "waitlist_insert_own"
  ON public.waitlist_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "waitlist_update_own_or_staff"
  ON public.waitlist_entries FOR UPDATE
  USING (user_id = auth.uid() OR public.has_tenant_role(tenant_id, 'staff'));

-- ─── Pricing ────────────────────────────────────────────────────────────────

CREATE POLICY "pricing_rules_select_member"
  ON public.pricing_rules FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "pricing_rules_manage_manager"
  ON public.pricing_rules FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY "membership_packages_select_public"
  ON public.membership_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "membership_packages_select_member"
  ON public.membership_packages FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "membership_packages_manage_manager"
  ON public.membership_packages FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY "user_packages_select_own"
  ON public.user_packages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_packages_select_staff"
  ON public.user_packages FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

CREATE POLICY "user_packages_insert_staff"
  ON public.user_packages FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, 'staff'));

CREATE POLICY "promo_codes_select_member"
  ON public.promo_codes FOR SELECT
  USING (public.is_tenant_member(tenant_id) AND is_active = true);

CREATE POLICY "promo_codes_manage_manager"
  ON public.promo_codes FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

-- ─── Academy ────────────────────────────────────────────────────────────────

CREATE POLICY "academy_programs_select_public"
  ON public.academy_programs FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "academy_programs_select_member"
  ON public.academy_programs FOR SELECT
  USING (public.is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "academy_programs_manage_manager"
  ON public.academy_programs FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY "batches_select_public"
  ON public.batches FOR SELECT
  USING (
    is_active = true
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.academy_programs ap
      WHERE ap.id = batches.program_id
        AND ap.is_published = true
        AND ap.deleted_at IS NULL
    )
  );

CREATE POLICY "batches_select_member"
  ON public.batches FOR SELECT
  USING (public.is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "batches_manage_manager"
  ON public.batches FOR ALL
  USING (public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY "batch_coaches_select_member"
  ON public.batch_coaches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.batches b
      WHERE b.id = batch_coaches.batch_id
        AND public.is_tenant_member(b.tenant_id)
    )
  );

CREATE POLICY "batch_coaches_manage_manager"
  ON public.batch_coaches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.batches b
      WHERE b.id = batch_coaches.batch_id
        AND public.has_tenant_role(b.tenant_id, 'manager')
    )
  );

CREATE POLICY "batch_sessions_select_member"
  ON public.batch_sessions FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "batch_sessions_manage_coach"
  ON public.batch_sessions FOR ALL
  USING (public.has_tenant_role(tenant_id, 'coach'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'coach'));

CREATE POLICY "enrollments_select_own"
  ON public.enrollments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "enrollments_select_staff"
  ON public.enrollments FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'staff'));

CREATE POLICY "enrollments_insert_authenticated"
  ON public.enrollments FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    OR public.has_tenant_role(tenant_id, 'staff')
  );

CREATE POLICY "enrollments_update_staff"
  ON public.enrollments FOR UPDATE
  USING (public.has_tenant_role(tenant_id, 'staff'));

CREATE POLICY "attendance_select_own"
  ON public.attendance_records FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "attendance_select_coach"
  ON public.attendance_records FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'coach'));

CREATE POLICY "attendance_manage_coach"
  ON public.attendance_records FOR ALL
  USING (public.has_tenant_role(tenant_id, 'coach'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'coach'));

-- ─── System tables ──────────────────────────────────────────────────────────

CREATE POLICY "sport_templates_select_all"
  ON public.sport_templates FOR SELECT
  USING (true);

CREATE POLICY "sport_templates_manage_platform"
  ON public.sport_templates FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "academy_templates_select_all"
  ON public.academy_templates FOR SELECT
  USING (true);

CREATE POLICY "academy_templates_manage_platform"
  ON public.academy_templates FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert_system"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (
    public.is_platform_admin()
    OR (tenant_id IS NOT NULL AND public.has_tenant_role(tenant_id, 'admin'))
  );

CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
