-- PLAYHUB Module 2: Enums and PostgreSQL extensions

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Sport types for slot booking
CREATE TYPE public.sport_type AS ENUM (
  'football',
  'cricket',
  'cricket_nets',
  'pickleball',
  'badminton',
  'tennis',
  'squash',
  'basketball',
  'volleyball',
  'swimming'
);

-- Academy program types
CREATE TYPE public.academy_type AS ENUM (
  'running_academy',
  'football_academy',
  'cricket_academy',
  'tennis_academy',
  'swimming_academy',
  'badminton_academy'
);

-- Tenant RBAC roles
CREATE TYPE public.tenant_role AS ENUM (
  'owner',
  'admin',
  'manager',
  'staff',
  'coach',
  'member'
);

CREATE TYPE public.member_status AS ENUM (
  'active',
  'invited',
  'suspended'
);

CREATE TYPE public.tenant_status AS ENUM (
  'active',
  'suspended'
);

CREATE TYPE public.booking_status AS ENUM (
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

CREATE TYPE public.payment_status AS ENUM (
  'unpaid',
  'paid',
  'refunded',
  'partial'
);

CREATE TYPE public.enrollment_status AS ENUM (
  'pending',
  'active',
  'suspended',
  'completed',
  'cancelled'
);

CREATE TYPE public.waitlist_status AS ENUM (
  'waiting',
  'notified',
  'expired',
  'fulfilled'
);

CREATE TYPE public.attendance_status AS ENUM (
  'present',
  'absent',
  'late',
  'excused'
);

CREATE TYPE public.discount_type AS ENUM (
  'percentage',
  'fixed'
);
