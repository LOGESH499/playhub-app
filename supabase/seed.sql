-- PLAYHUB Seed: Sport templates, academy templates, demo tenant & venues
-- Safe to re-run: uses ON CONFLICT / fixed UUIDs

-- ─── Sport templates (all 10 slot sports) ───────────────────────────────────

INSERT INTO public.sport_templates (sport_type, display_name, resource_label, default_slot_minutes, icon_name, metadata)
VALUES
  ('football', 'Football', 'Pitch', 90, 'trophy', '{"formats":["full","half"]}'),
  ('cricket', 'Cricket', 'Ground', 120, 'circle-dot', '{"formats":["full","half"]}'),
  ('cricket_nets', 'Cricket Nets', 'Net Bay', 60, 'target', '{}'),
  ('pickleball', 'Pickleball', 'Court', 60, 'disc', '{}'),
  ('badminton', 'Badminton', 'Court', 60, 'wind', '{}'),
  ('tennis', 'Tennis', 'Court', 60, 'circle', '{}'),
  ('squash', 'Squash', 'Court', 45, 'square', '{}'),
  ('basketball', 'Basketball', 'Court', 60, 'circle', '{"formats":["full","half"]}'),
  ('volleyball', 'Volleyball', 'Court', 60, 'circle', '{}'),
  ('swimming', 'Swimming', 'Lane', 30, 'waves', '{}')
ON CONFLICT (sport_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  resource_label = EXCLUDED.resource_label,
  default_slot_minutes = EXCLUDED.default_slot_minutes,
  icon_name = EXCLUDED.icon_name,
  metadata = EXCLUDED.metadata;

-- ─── Academy templates (all 6 academy types) ──────────────────────────────

INSERT INTO public.academy_templates (academy_type, display_name, default_batch_duration_minutes, metadata)
VALUES
  ('running_academy', 'Running Academy', 60, '{"focus":"endurance"}'),
  ('football_academy', 'Football Academy', 90, '{"focus":"skills"}'),
  ('cricket_academy', 'Cricket Academy', 120, '{"focus":"batting_bowling"}'),
  ('tennis_academy', 'Tennis Academy', 60, '{"focus":"technique"}'),
  ('swimming_academy', 'Swimming Academy', 45, '{"focus":"lanes"}'),
  ('badminton_academy', 'Badminton Academy', 60, '{"focus":"rally"}')
ON CONFLICT (academy_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  default_batch_duration_minutes = EXCLUDED.default_batch_duration_minutes,
  metadata = EXCLUDED.metadata;

-- ─── Demo tenant (fixed UUIDs for reproducible dev) ─────────────────────────

-- Refresh demo child rows (safe for dev re-seed)
DELETE FROM public.operating_hours WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.pricing_rules WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.tenants (
  id, name, slug, contact_email, contact_phone, address,
  timezone, currency, status, primary_color
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'PLAYHUB Demo Sports',
  'playhub-demo',
  'demo@playhub.app',
  '+91 98765 43210',
  'Andheri Sports Complex, Mumbai',
  'Asia/Kolkata',
  'INR',
  'active',
  '#16a34a'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- ─── Demo Venue 1: Smash Arena (Badminton + Pickleball) ─────────────────────

INSERT INTO public.venues (
  id, tenant_id, name, slug, description,
  address_line1, city, state, postal_code, country,
  latitude, longitude, phone, email,
  amenities, is_published
)
VALUES (
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'Smash Arena',
  'smash-arena',
  'Premium badminton and pickleball courts in Andheri West.',
  'Link Road, Andheri West',
  'Mumbai',
  'Maharashtra',
  '400053',
  'IN',
  19.13640000,
  72.82960000,
  '+91 98765 43211',
  'smash@playhub.app',
  '["parking","showers","changing_rooms","cafeteria"]',
  true
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO public.resources (id, tenant_id, venue_id, name, sport_type, resource_subtype, capacity, surface_type, is_indoor, sort_order)
VALUES
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Court 1', 'badminton', 'full_court', 4, 'synthetic', true, 1),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Court 2', 'badminton', 'full_court', 4, 'synthetic', true, 2),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Pickleball Court A', 'pickleball', 'full_court', 4, 'synthetic', true, 3)
ON CONFLICT (id) DO NOTHING;

-- Operating hours: Mon–Sun 6am–10pm for Smash Arena
INSERT INTO public.operating_hours (tenant_id, venue_id, day_of_week, open_time, close_time)
SELECT
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  d,
  '06:00'::time,
  '22:00'::time
FROM generate_series(0, 6) AS d
ON CONFLICT DO NOTHING;

-- Pricing for Smash Arena
INSERT INTO public.pricing_rules (id, tenant_id, venue_id, name, day_of_week, start_time, end_time, price_per_slot, slot_duration_minutes, priority)
VALUES
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Off-Peak', '{}', '06:00', '17:00', 400.00, 60, 1),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Peak Evening', '{}', '17:00', '22:00', 600.00, 60, 2)
ON CONFLICT (id) DO NOTHING;

-- ─── Demo Venue 2: Aqua Sports Centre (Swimming) ────────────────────────────

INSERT INTO public.venues (
  id, tenant_id, name, slug, description,
  address_line1, city, state, postal_code, country,
  latitude, longitude, phone, amenities, is_published
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Aqua Sports Centre',
  'aqua-sports',
  'Olympic-size pool with lane booking.',
  'Powai Lake Road',
  'Mumbai',
  'Maharashtra',
  '400076',
  'IN',
  19.11760000,
  72.90600000,
  '+91 98765 43212',
  '["parking","lockers","showers"]',
  true
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO public.resources (id, tenant_id, venue_id, name, sport_type, resource_subtype, capacity, is_indoor, sort_order)
VALUES
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Lane 1', 'swimming', 'lane', 1, true, 1),
  ('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Lane 2', 'swimming', 'lane', 1, true, 2),
  ('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Lane 3', 'swimming', 'lane', 1, true, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operating_hours (tenant_id, venue_id, day_of_week, open_time, close_time)
SELECT
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  d,
  '05:30'::time,
  '21:00'::time
FROM generate_series(0, 6) AS d
ON CONFLICT DO NOTHING;

INSERT INTO public.pricing_rules (id, tenant_id, venue_id, name, price_per_slot, slot_duration_minutes, priority)
VALUES
  ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Standard Lane', 300.00, 30, 1)
ON CONFLICT (id) DO NOTHING;

-- ─── Demo Venue 3: Green Field FC (Football) ────────────────────────────────

INSERT INTO public.venues (
  id, tenant_id, name, slug, description,
  address_line1, city, state, country,
  latitude, longitude, amenities, is_published
)
VALUES (
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111111',
  'Green Field FC',
  'green-field-fc',
  'Full-size and half-size football pitches with academy programs.',
  'Hiranandani Gardens',
  'Mumbai',
  'Maharashtra',
  'IN',
  19.11970000,
  72.90800000,
  '["parking","floodlights","changing_rooms"]',
  true
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

INSERT INTO public.resources (id, tenant_id, venue_id, name, sport_type, resource_subtype, capacity, surface_type, is_indoor, sort_order)
VALUES
  ('33333333-3333-3333-3333-333333333337', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'Main Pitch', 'football', 'full_pitch', 22, 'turf', false, 1),
  ('33333333-3333-3333-3333-333333333338', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'Half Pitch A', 'football', 'half_pitch', 12, 'turf', false, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operating_hours (tenant_id, venue_id, day_of_week, open_time, close_time)
SELECT
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222223',
  d,
  '06:00'::time,
  '23:00'::time
FROM generate_series(0, 6) AS d
ON CONFLICT DO NOTHING;

INSERT INTO public.pricing_rules (id, tenant_id, venue_id, sport_type, name, price_per_slot, slot_duration_minutes, priority)
VALUES
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'football', 'Full Pitch', 5000.00, 90, 1),
  ('44444444-4444-4444-4444-444444444445', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'football', 'Half Pitch', 2500.00, 90, 1)
ON CONFLICT (id) DO NOTHING;

-- Demo academy program at Green Field
INSERT INTO public.academy_programs (id, tenant_id, venue_id, name, slug, academy_type, description, is_published)
VALUES (
  '55555555-5555-5555-5555-555555555551',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222223',
  'Green Field Football Academy',
  'football-academy',
  'football_academy',
  'Weekend football coaching for ages 6–18.',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.batches (id, tenant_id, program_id, name, age_group_min, age_group_max, skill_level, capacity, fee_amount, fee_period, schedule, start_date)
VALUES (
  '66666666-6666-6666-6666-666666666661',
  '11111111-1111-1111-1111-111111111111',
  '55555555-5555-5555-5555-555555555551',
  'U-10 Morning Batch',
  6, 10, 'beginner', 20, 3000.00, 'monthly',
  '{"days":["mon","wed","fri"],"start":"07:00","end":"08:30"}',
  CURRENT_DATE
)
ON CONFLICT (id) DO NOTHING;

-- Demo promo code
INSERT INTO public.promo_codes (id, tenant_id, code, discount_type, discount_value, max_uses, is_active)
VALUES (
  '77777777-7777-7777-7777-777777777771',
  '11111111-1111-1111-1111-111111111111',
  'PLAYHUB10',
  'percentage',
  10.00,
  100,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Demo membership package
INSERT INTO public.membership_packages (id, tenant_id, name, description, credits, valid_days, price, sport_types)
VALUES (
  '88888888-8888-8888-8888-888888888881',
  '11111111-1111-1111-1111-111111111111',
  'Badminton 10-Pack',
  '10 court credits valid for 60 days.',
  10,
  60,
  3500.00,
  ARRAY['badminton']::public.sport_type[]
)
ON CONFLICT (id) DO NOTHING;
