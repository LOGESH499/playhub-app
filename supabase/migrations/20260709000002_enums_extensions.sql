-- PLAYHUB Module 2: Enums and PostgreSQL extensions

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  -- Sport types for slot booking
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'sport_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
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
      'swimming',
      'running_track'
    );
  END IF;

  -- Academy program types
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'academy_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.academy_type AS ENUM (
      'running_academy',
      'football_academy',
      'cricket_academy',
      'tennis_academy',
      'swimming_academy',
      'badminton_academy'
    );
  END IF;

  -- Tenant RBAC roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'tenant_role'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.tenant_role AS ENUM (
      'owner',
      'admin',
      'manager',
      'staff',
      'coach',
      'member'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'member_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.member_status AS ENUM (
      'active',
      'invited',
      'suspended'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'tenant_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.tenant_status AS ENUM (
      'active',
      'suspended'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'booking_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.booking_status AS ENUM (
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'no_show'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'payment_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.payment_status AS ENUM (
      'unpaid',
      'paid',
      'refunded',
      'partial'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'enrollment_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.enrollment_status AS ENUM (
      'pending',
      'active',
      'suspended',
      'completed',
      'cancelled'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'waitlist_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.waitlist_status AS ENUM (
      'waiting',
      'notified',
      'expired',
      'fulfilled'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'attendance_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.attendance_status AS ENUM (
      'present',
      'absent',
      'late',
      'excused'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'discount_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.discount_type AS ENUM (
      'percentage',
      'fixed'
    );
  END IF;
END $$;
