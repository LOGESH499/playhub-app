# Database Design

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Design Philosophy

PLAYHUB's data layer is built on **PostgreSQL via Supabase** with these core principles:

1. **Tenant isolation first** — Every business entity carries `tenant_id` where applicable
2. **RLS as the security boundary** — Application code is not the only gatekeeper
3. **Normalized core, denormalized reads** — Views/materialized views for dashboards (later)
4. **UUID primary keys** — Globally unique, safe for distributed clients
5. **Soft deletes** — `deleted_at` on user-facing entities for audit and recovery
6. **UTC timestamps** — `timestamptz` everywhere; display layer converts to local TZ

---

## 2. Database Engine

| Property | Value |
|----------|-------|
| Engine | PostgreSQL 15+ (Supabase managed) |
| Extensions | `uuid-ossp`, `pgcrypto`, `postgis` (optional for geo queries) |
| Connection | Supabase pooler (transaction mode) from Vercel serverless |
| Migrations | Supabase CLI — versioned SQL in `supabase/migrations/` |

---

## 3. Schema Domains

```
┌─────────────────────────────────────────────────────────────┐
│                      SCHEMA DOMAINS                          │
├──────────────┬──────────────┬──────────────┬──────────────┤
│   Identity   │   Tenant     │   Booking    │   Academy    │
│   profiles   │   tenants    │   venues     │   programs   │
│   roles      │   members    │   resources  │   batches    │
│   sessions   │   invites    │   slots      │   enrollments│
│              │              │   bookings   │   attendance │
├──────────────┴──────────────┴──────────────┴──────────────┤
│   Commerce (v1-lite)  │   System                          │
│   pricing_rules       │   audit_logs                      │
│   packages            │   notifications                   │
│   promo_codes         │   sport_templates                 │
└───────────────────────┴───────────────────────────────────┘
```

---

## 4. Multi-Tenancy Strategy

### 4.1 Tenant Scoping

All tenant-owned tables include:

```sql
tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
```

### 4.2 RLS Policy Pattern

```sql
-- Example: venues readable by tenant members
CREATE POLICY "venues_select_tenant_member"
ON venues FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Public venues visible to anonymous users
CREATE POLICY "venues_select_public"
ON venues FOR SELECT
USING (is_published = true AND deleted_at IS NULL);
```

### 4.3 Cross-Tenant User Access

Users exist globally (`profiles` linked to `auth.users`). Membership in tenants is via `tenant_members` with role column.

---

## 5. Sport Type Modeling

### 5.1 Enum Types

```sql
CREATE TYPE sport_type AS ENUM (
  'football', 'cricket', 'cricket_nets', 'pickleball',
  'badminton', 'tennis', 'squash', 'basketball',
  'volleyball', 'swimming'
);

CREATE TYPE academy_type AS ENUM (
  'running_academy', 'football_academy', 'cricket_academy',
  'tennis_academy', 'swimming_academy', 'badminton_academy'
);
```

### 5.2 Sport Templates

`sport_templates` stores default slot durations, resource labels, and metadata per sport — seeded at platform level, copied to tenant on venue creation.

---

## 6. Booking Data Model

### 6.1 Resource Hierarchy

```
Tenant → Venue → Resource (court/lane/pitch) → Slot Instance → Booking
```

### 6.2 Slot Generation Strategy

**Approach:** Slots are **computed at query time** from `operating_hours` + `resource_schedules` + existing `bookings`, not pre-materialized for all future dates.

**Rationale:** Saves storage on free tier; avoids stale slot rows.

**Exception:** `slot_holds` table for temporary 10-minute reservations during checkout.

### 6.3 Booking Atomicity

PostgreSQL function `create_booking()`:

1. Validates resource availability for time range
2. Locks conflicting rows (`FOR UPDATE`)
3. Inserts booking with status `confirmed` or `pending`
4. Deletes slot hold if exists
5. Returns booking ID or raises exception

---

## 7. Academy Data Model

```
Academy Program → Batch → Batch Session → Attendance Record
                ↘ Enrollment (student ↔ batch)
                ↘ Coach Assignment
```

- **Programs** belong to a tenant and have `academy_type`
- **Batches** have recurring schedule (JSON or separate `batch_schedules` table)
- **Enrollments** track student lifecycle
- **Attendance** is per session per student

---

## 8. Indexing Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| `bookings` | `(resource_id, start_time, end_time)` | Availability queries |
| `bookings` | `(tenant_id, created_at DESC)` | Dashboard lists |
| `venues` | `(tenant_id)` | Tenant scoping |
| `venues` | `(latitude, longitude)` or GiST | Geo search |
| `tenant_members` | `(user_id, tenant_id)` UNIQUE | Membership lookup |
| `notifications` | `(user_id, read_at)` | Unread count |

---

## 9. Constraints & Business Rules in DB

| Constraint | Implementation |
|------------|----------------|
| No overlapping confirmed bookings | EXCLUDE constraint or trigger on `bookings` |
| Batch capacity | Check trigger on `enrollments` INSERT |
| Valid time range | `end_time > start_time` CHECK |
| Positive price | `amount >= 0` CHECK |

```sql
-- Overlap prevention (confirmed bookings only)
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status IN ('confirmed', 'pending') AND deleted_at IS NULL);
```

---

## 10. Audit & Soft Delete

```sql
-- Standard columns on major tables
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
deleted_at TIMESTAMPTZ,
created_by UUID REFERENCES profiles(id)
```

`audit_logs` captures: actor, action, entity_type, entity_id, old_value, new_value (JSONB).

---

## 11. Realtime Publication

Tables published to Supabase Realtime:

- `bookings` — availability updates
- `slot_holds` — temporary locks
- `notifications` — in-app alerts
- `attendance_records` — live academy dashboards (optional)

---

## 12. Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `avatars` | User-owned | Profile pictures |
| `venue-media` | Tenant-scoped | Venue photos |
| `academy-media` | Tenant-scoped | Academy images |
| `documents` | Private | Waivers, certificates (future) |

---

## 13. Migration Strategy

1. **00001** — Extensions, enums, core tables
2. **00002** — RLS enable + policies
3. **00003** — Functions (booking, pricing)
4. **00004** — Realtime publication
5. **00005** — Seed sport templates
6. Incremental migrations per feature module

**Rules:**

- Never edit applied migrations; always add new ones
- Test migrations locally with `supabase db reset`
- Generate TypeScript types after each migration: `supabase gen types typescript`

---

## 14. Free Tier Optimization

| Concern | Mitigation |
|---------|------------|
| 500MB database limit | Archive old bookings to cold storage table (future) |
| Connection limits | Use Supabase pooler; minimize connection hold time |
| Realtime connections | Subscribe only to active venue channels |
| Large images | Client-side resize before upload; WebP format |

---

## 15. Related Documents

- [Database Tables](./database-tables.md) — Full column definitions
- [Entity Relationship Diagram](./entity-relationship-diagram.md)
- [API Design](./api-design.md)
- [Security Plan](./security-plan.md)
