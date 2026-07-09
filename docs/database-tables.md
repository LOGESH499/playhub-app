# Database Tables Reference

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Overview

This document defines all PostgreSQL tables for PLAYHUB. Types reference enums defined in [Database Design](./database-design.md).

**Legend:** PK = Primary Key, FK = Foreign Key, UQ = Unique

---

## 2. Identity & Users

### 2.1 `profiles`

Extends Supabase `auth.users`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → auth.users | User ID |
| email | TEXT | NOT NULL | Denormalized email |
| full_name | TEXT | NOT NULL | Display name |
| phone | TEXT | | Phone number |
| avatar_url | TEXT | | Storage URL |
| date_of_birth | DATE | | For age-restricted academies |
| emergency_contact_name | TEXT | | |
| emergency_contact_phone | TEXT | | |
| is_platform_admin | BOOLEAN | DEFAULT false | Super-admin flag |
| preferences | JSONB | DEFAULT '{}' | Notification prefs, locale |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

### 2.2 `guardian_links`

Links parent accounts to minor profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| guardian_id | UUID | FK → profiles | Parent user |
| ward_id | UUID | FK → profiles | Minor user |
| relationship | TEXT | NOT NULL | parent, guardian |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

## 3. Tenancy

### 3.1 `tenants`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | TEXT | NOT NULL | Organization name |
| slug | TEXT | UQ, NOT NULL | URL slug |
| logo_url | TEXT | | |
| primary_color | TEXT | | Hex brand color |
| contact_email | TEXT | | |
| contact_phone | TEXT | | |
| address | TEXT | | HQ address |
| timezone | TEXT | DEFAULT 'Asia/Kolkata' | |
| currency | TEXT | DEFAULT 'INR' | |
| settings | JSONB | DEFAULT '{}' | Tenant config |
| status | TEXT | DEFAULT 'active' | active, suspended |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

### 3.2 `tenant_members`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| user_id | UUID | FK → profiles | |
| role | tenant_role | NOT NULL | Enum — see User Roles |
| status | TEXT | DEFAULT 'active' | active, invited, suspended |
| invited_by | UUID | FK → profiles | |
| joined_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UQ:** `(tenant_id, user_id)`

### 3.3 `tenant_invites`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| email | TEXT | NOT NULL | |
| role | tenant_role | NOT NULL | |
| token | TEXT | UQ, NOT NULL | Invite token |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| accepted_at | TIMESTAMPTZ | | |
| created_by | UUID | FK → profiles | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

## 4. Venues & Resources

### 4.1 `venues`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| name | TEXT | NOT NULL | |
| slug | TEXT | NOT NULL | Unique per tenant |
| description | TEXT | | |
| address_line1 | TEXT | NOT NULL | |
| address_line2 | TEXT | | |
| city | TEXT | NOT NULL | |
| state | TEXT | | |
| postal_code | TEXT | | |
| country | TEXT | DEFAULT 'IN' | |
| latitude | DECIMAL(10,8) | | |
| longitude | DECIMAL(11,8) | | |
| phone | TEXT | | |
| email | TEXT | | |
| amenities | JSONB | DEFAULT '[]' | parking, showers, etc. |
| images | JSONB | DEFAULT '[]' | Storage URLs |
| is_published | BOOLEAN | DEFAULT false | Public visibility |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

**UQ:** `(tenant_id, slug)`

### 4.2 `resources`

Bookable units (courts, lanes, pitches).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| venue_id | UUID | FK → venues | |
| name | TEXT | NOT NULL | Court 1, Lane A |
| sport_type | sport_type | NOT NULL | |
| resource_subtype | TEXT | | full_pitch, half_court, net_bay |
| capacity | INTEGER | DEFAULT 1 | Max players |
| surface_type | TEXT | | synthetic, grass, wood |
| is_indoor | BOOLEAN | DEFAULT true | |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| metadata | JSONB | DEFAULT '{}' | Sport-specific attrs |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

### 4.3 `operating_hours`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| venue_id | UUID | FK → venues | Nullable — venue-wide |
| resource_id | UUID | FK → resources | Nullable — resource-specific |
| day_of_week | INTEGER | NOT NULL | 0=Sun, 6=Sat |
| open_time | TIME | NOT NULL | |
| close_time | TIME | NOT NULL | |
| is_closed | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 4.4 `blackout_periods`

Maintenance, events, holidays.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| venue_id | UUID | FK → venues | |
| resource_id | UUID | FK → resources | Nullable — all resources |
| start_time | TIMESTAMPTZ | NOT NULL | |
| end_time | TIMESTAMPTZ | NOT NULL | |
| reason | TEXT | | |
| created_by | UUID | FK → profiles | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

## 5. Booking

### 5.1 `bookings`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| venue_id | UUID | FK → venues | |
| resource_id | UUID | FK → resources | |
| user_id | UUID | FK → profiles | Player |
| booked_by | UUID | FK → profiles | Staff if on behalf |
| sport_type | sport_type | NOT NULL | Denormalized |
| start_time | TIMESTAMPTZ | NOT NULL | |
| end_time | TIMESTAMPTZ | NOT NULL | |
| status | booking_status | NOT NULL | pending, confirmed, etc. |
| payment_status | TEXT | DEFAULT 'unpaid' | unpaid, paid, refunded |
| amount | DECIMAL(10,2) | NOT NULL | |
| currency | TEXT | DEFAULT 'INR' | |
| notes | TEXT | | |
| cancellation_reason | TEXT | | |
| cancelled_at | TIMESTAMPTZ | | |
| recurring_group_id | UUID | | Links recurring series |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

### 5.2 `slot_holds`

Temporary reservation during checkout.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| resource_id | UUID | FK → resources | |
| user_id | UUID | FK → profiles | |
| start_time | TIMESTAMPTZ | NOT NULL | |
| end_time | TIMESTAMPTZ | NOT NULL | |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 5.3 `waitlist_entries`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| resource_id | UUID | FK → resources | |
| user_id | UUID | FK → profiles | |
| desired_start | TIMESTAMPTZ | NOT NULL | |
| desired_end | TIMESTAMPTZ | NOT NULL | |
| status | TEXT | DEFAULT 'waiting' | waiting, notified, expired |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

## 6. Pricing & Packages

### 6.1 `pricing_rules`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| venue_id | UUID | FK → venues | Nullable |
| resource_id | UUID | FK → resources | Nullable |
| sport_type | sport_type | | Nullable — all sports |
| name | TEXT | NOT NULL | Peak Hour, Weekend |
| day_of_week | INTEGER[] | | Empty = all days |
| start_time | TIME | | Time window start |
| end_time | TIME | | Time window end |
| price_per_slot | DECIMAL(10,2) | NOT NULL | |
| slot_duration_minutes | INTEGER | NOT NULL | |
| priority | INTEGER | DEFAULT 0 | Higher wins conflicts |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

### 6.2 `membership_packages`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| name | TEXT | NOT NULL | |
| description | TEXT | | |
| credits | INTEGER | | Slot credits |
| discount_percent | DECIMAL(5,2) | | |
| valid_days | INTEGER | NOT NULL | Validity period |
| price | DECIMAL(10,2) | NOT NULL | |
| sport_types | sport_type[] | | Applicable sports |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

### 6.3 `user_packages`

Purchased memberships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| user_id | UUID | FK → profiles | |
| package_id | UUID | FK → membership_packages | |
| credits_remaining | INTEGER | | |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| purchased_at | TIMESTAMPTZ | NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 6.4 `promo_codes`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| code | TEXT | NOT NULL | |
| discount_type | TEXT | NOT NULL | percentage, fixed |
| discount_value | DECIMAL(10,2) | NOT NULL | |
| max_uses | INTEGER | | |
| uses_count | INTEGER | DEFAULT 0 | |
| valid_from | TIMESTAMPTZ | | |
| valid_until | TIMESTAMPTZ | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**UQ:** `(tenant_id, code)`

---

## 7. Academy

### 7.1 `academy_programs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| venue_id | UUID | FK → venues | |
| name | TEXT | NOT NULL | |
| slug | TEXT | NOT NULL | |
| academy_type | academy_type | NOT NULL | |
| description | TEXT | | |
| images | JSONB | DEFAULT '[]' | |
| is_published | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

**UQ:** `(tenant_id, slug)`

### 7.2 `batches`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| program_id | UUID | FK → academy_programs | |
| name | TEXT | NOT NULL | U-12 Morning |
| age_group_min | INTEGER | | |
| age_group_max | INTEGER | | |
| skill_level | TEXT | | beginner, intermediate, advanced |
| capacity | INTEGER | NOT NULL | |
| fee_amount | DECIMAL(10,2) | | |
| fee_period | TEXT | | monthly, quarterly |
| schedule | JSONB | NOT NULL | Recurring schedule |
| start_date | DATE | NOT NULL | |
| end_date | DATE | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

### 7.3 `batch_coaches`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| batch_id | UUID | FK → batches | |
| coach_id | UUID | FK → profiles | |
| is_primary | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**UQ:** `(batch_id, coach_id)`

### 7.4 `batch_sessions`

Generated or scheduled sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| batch_id | UUID | FK → batches | |
| session_date | DATE | NOT NULL | |
| start_time | TIME | NOT NULL | |
| end_time | TIME | NOT NULL | |
| resource_id | UUID | FK → resources | Optional facility link |
| status | TEXT | DEFAULT 'scheduled' | scheduled, completed, cancelled |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

### 7.5 `enrollments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| batch_id | UUID | FK → batches | |
| student_id | UUID | FK → profiles | |
| enrolled_by | UUID | FK → profiles | Parent if minor |
| status | enrollment_status | NOT NULL | |
| enrolled_at | TIMESTAMPTZ | NOT NULL | |
| completed_at | TIMESTAMPTZ | | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**UQ:** `(batch_id, student_id)` WHERE status = 'active'

### 7.6 `attendance_records`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| session_id | UUID | FK → batch_sessions | |
| student_id | UUID | FK → profiles | |
| status | TEXT | NOT NULL | present, absent, late, excused |
| marked_by | UUID | FK → profiles | Coach |
| marked_at | TIMESTAMPTZ | NOT NULL | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**UQ:** `(session_id, student_id)`

---

## 8. System Tables

### 8.1 `sport_templates`

Platform-level sport defaults.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| sport_type | sport_type | UQ | |
| display_name | TEXT | NOT NULL | |
| resource_label | TEXT | NOT NULL | Court, Lane, Pitch |
| default_slot_minutes | INTEGER | NOT NULL | |
| icon_name | TEXT | | Lucide icon key |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 8.2 `academy_templates`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| academy_type | academy_type | UQ | |
| display_name | TEXT | NOT NULL | |
| default_batch_duration_minutes | INTEGER | | |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 8.3 `notifications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → profiles | |
| tenant_id | UUID | FK → tenants | Nullable |
| type | TEXT | NOT NULL | booking_confirmed, etc. |
| title | TEXT | NOT NULL | |
| body | TEXT | | |
| data | JSONB | DEFAULT '{}' | Deep link payload |
| read_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

### 8.4 `audit_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | Nullable |
| actor_id | UUID | FK → profiles | |
| action | TEXT | NOT NULL | create, update, delete |
| entity_type | TEXT | NOT NULL | booking, venue, etc. |
| entity_id | UUID | NOT NULL | |
| old_values | JSONB | | |
| new_values | JSONB | | |
| ip_address | INET | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

## 9. Enums Summary

```sql
CREATE TYPE tenant_role AS ENUM (
  'owner', 'admin', 'manager', 'staff', 'coach', 'member'
);

CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
);

CREATE TYPE enrollment_status AS ENUM (
  'pending', 'active', 'suspended', 'completed', 'cancelled'
);
```

---

## 10. Table Count Summary

| Domain | Tables |
|--------|--------|
| Identity | 2 |
| Tenancy | 3 |
| Venues | 4 |
| Booking | 3 |
| Pricing | 4 |
| Academy | 6 |
| System | 4 |
| **Total** | **26** |

---

## 11. Related Documents

- [Database Design](./database-design.md)
- [Entity Relationship Diagram](./entity-relationship-diagram.md)
- [Security Plan](./security-plan.md)
