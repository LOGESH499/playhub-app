# PLAYHUB — Development Roadmap

Module-by-module delivery plan. See [TASKS.md](./TASKS.md) for detailed checklists.

**Last updated:** 2026-07-09

---

## Engineering Standards

All development follows [docs/project-rules.md](./docs/project-rules.md):

- TypeScript, Next.js App Router, Server Components first, Supabase only
- Feature-based architecture, Zod + React Hook Form, Shadcn UI, Tailwind
- No Firebase/Clerk/paid APIs; no duplicate code; dark mode + responsive UI
- Update `TASKS.md`, `ROADMAP.md`, `README.md` after every module

---

## Progress Overview

```
[████████████████████] Module 1  Authentication (foundation) ✅ DONE
[████████████████████] Module 2  Database                      ✅ DONE
[████████████████████] Module 3  Auth + Orgs + Roles           ✅ DONE
[████████████████████] Module 4  Dashboard                      ✅ DONE
[████████████████████] Module 5  Sports Management              ✅ VERIFIED
[████████████████████] Module 6  Venue Management               ✅ VERIFIED
[████████████████████] Module 7  Court Management               ✅ VERIFIED
[████████████████████] Module 8  Slot Management               ✅ VERIFIED
[                    ] Module 9  Real-Time Booking
[                    ] Module 10 Academy Management
[                    ] Module 11 Coach Management
[                    ] Module 12 Membership
[                    ] Module 13 Payment
[                    ] Module 14 Notifications
[                    ] Module 15 Reports
[                    ] Module 16 Admin Panel
[                    ] Module 17 Deployment
```

**Overall:** 8 / 17 modules verified (47%) — Module 9 next

---

## Module 1: Authentication ✅

**Status:** Complete  
**Completed:** 2026-07-09

Supabase Auth with email/password, magic link, password reset, SSR cookie sessions, middleware route protection, profile management, and `profiles` database migration.

**Deliverables:**
- Login, register, forgot/reset password, verify email
- `/auth/callback` for email confirmation and OAuth
- Protected routes: `/dashboard`, `/profile`, `/onboarding`
- Server actions with Zod validation

---

## Module 2: Database ✅

**Status:** Complete  
**Completed:** 2026-07-09

Full PostgreSQL schema with 26 tables, 11 enums, RLS on all tables, atomic booking RPC, Realtime publication, storage buckets, and seed data (10 sports, 3 demo venues).

**Deliverables:**
- 12 migration files + `seed.sql`
- Typed Supabase clients + `src/lib/database/` constants
- [DATABASE.md](./DATABASE.md) reference

---

## Module 3: Auth + Organizations + Roles ✅

**Status:** Complete  
**Completed:** 2026-07-09

Production-ready authentication with multi-tenant organizations, role resolution, and enhanced route protection.

**Deliverables:**
- React Hook Form + Zod on all auth forms
- `getAuthContext()` with tenant memberships and active tenant cookie
- Roles: Super Admin → `/platform`, Venue Admin, Coach, Customer
- Organization onboarding, tenant switcher, invite acceptance (`accept_tenant_invite` RPC)
- Middleware: email verification, platform guard, smart redirects
- Dashboard shell layout (header, role badge, org switcher)

---

## Module 4: Dashboard ✅

**Status:** Complete  
**Completed:** 2026-07-09

Production dashboard shell with sidebar, top navigation, dark/light theme, role-aware KPI cards, recent activity, calendar, and notifications panel.

**Deliverables:**
- `DashboardShell` with responsive sidebar (Sheet on mobile)
- Role-based nav with future module placeholders
- `getDashboardData()` server queries (bookings, notifications, audit logs)
- Theme toggle (light / dark / system)
- Notification mark-read server actions

---

## Module 5: Sports Management ✅

**Status:** Complete  
**Completed:** 2026-07-09

Full sports catalog CRUD with categories, icons, images, booking rules, venue assignment, and audit logging.

**Deliverables:**
- Extended `sports` table (renamed from `sport_templates`) with soft delete, status, featured, display order
- `sport_categories` + `venue_sports` junction with default pricing sync
- `/sports` list (grid/list), `/sports/new`, `/sports/[id]/edit`
- Server actions with Zod + React Hook Form

---

## Module 5: Sports Management ✅

**Status:** Verified (2026-07-09)  
**Migration:** `20260709000014_sports_management.sql` (idempotent)

**Verified:** `sports`, `sport_categories`, `venue_sports` tables; soft-delete unique indexes; `log_sport_audit`; RLS on sports/categories/venue_sports.

---

## Module 6: Venue Management ✅

**Status:** Verified (2026-07-09)  
**Migration:** `20260709000015_venue_management.sql` (idempotent)

**Verified:** `venue_status` enum, `venues.status`, `venue_holidays`, `log_venue_audit`, `venues_select_public` policy, sync trigger.

**Routes:** `/venues`, `/venues/new`, `/venues/[id]/edit`

---

## Module 7: Court & Resource Management ✅

**Status:** Verified (2026-07-09)  
**Migration:** `20260709000016_court_management.sql` (idempotent)

**Verified:** `resource_status` enum, `resources.status`, `maintenance_until`, `resources_sync_active` trigger, `court-media` bucket + storage policies, `log_resource_audit`.

**Routes:** `/courts`, `/courts/new`, `/courts/[id]/edit`

---

## Module 8: Slot Management

**Status:** ✅ Verified  
**Depends on:** Module 7 (verified)

Slot templates, recurring generation, calendar views (day/week/month/timeline), bulk operations, dynamic pricing, `validate_slot_window` RPC, Realtime on `slots`.

**Routes:** `/slots`, `/slots/new`, `/slots/[id]/edit`, `/slots/templates`

**Verification:** `scripts/verify-module-8.sql`

---

## Module 9: Real-Time Booking

**Status:** Planned  
**Depends on:** Module 8

Booking flow UI, `create_booking()` RPC, Supabase Realtime, staff quick booking, cancellations.

---

## Module 10: Academy Management

**Status:** Planned  
**Depends on:** Module 2

Programs, batches, schedules, enrollment, public academy pages.

---

## Module 11: Coach Management

**Status:** Planned  
**Depends on:** Module 10

Coach assignment, attendance UI, session notes, coach-scoped views.

---

## Module 12: Membership

**Status:** Planned  
**Depends on:** Module 9

Membership packages, user packages, credit deduction on booking.

---

## Module 13: Payment

**Status:** Planned  
**Depends on:** Module 12

Manual payment recording (v1), payment status on bookings, future gateway prep.

---

## Module 14: Notifications

**Status:** Planned  
**Depends on:** Module 9

In-app notifications, Realtime delivery, booking confirmation email.

---

## Module 15: Reports

**Status:** Planned  
**Depends on:** Modules 9, 10

Dashboard analytics, Recharts, CSV export.

---

## Module 16: Admin Panel

**Status:** Planned  
**Depends on:** Module 2

Platform super-admin: tenants, sport templates, audit logs.

---

## Module 17: Deployment

**Status:** Planned  
**Depends on:** All modules

Production Vercel + Supabase setup, custom domain, launch checklist, monitoring.

---

## Related Documents

- [TASKS.md](./TASKS.md) — Detailed task checklists
- [docs/development-roadmap.md](./docs/development-roadmap.md) — Original phased plan
- [docs/sprint-plan.md](./docs/sprint-plan.md) — Sprint breakdown
