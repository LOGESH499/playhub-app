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
[████████████████████] Module 9  Real-Time Booking             ✅ VERIFIED
[████████████████████] Module 10 Academy Management            ✅ VERIFIED
[████████████████████] Module 11 Customer Portal                 ✅ VERIFIED
[████████████████████] Module 12 Payments                          ✅ VERIFIED
[████████████████████] Module 13 Enterprise Analytics              ✅ VERIFIED
[                    ] Module 14 Membership
[                    ] Module 15 Notifications
[                    ] Module 16 Admin Panel
[                    ] Module 17 Deployment
```

**Overall:** 13 / 17 modules verified (76%) — Module 14 next

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

**UI:** Enterprise design system applied (collapsible sidebar, command palette, Recharts, DataTable, PageHeader)

---

## Module 9: Real-Time Booking

**Status:** ✅ Verified  
**Depends on:** Module 8 (verified)

Atomic `book_slot` RPC, slot holds, waitlist, reschedule/cancel, notifications, QR check-in, invoice, realtime on `bookings` + `slots`.

**Routes:** `/bookings`, `/bookings/new`, `/bookings/[id]`, `/bookings/reports`

**Verification:** `scripts/verify-module-9.sql`

---

## Module 10: Academy Management

**Status:** ✅ Verified  
**Depends on:** Module 2 (verified)

Programs, batches, schedules, enrollments, coach allocation, attendance, progress, offline fees, reports. Realtime on `attendance_records`.

**Routes:** `/academies`, `/academies/new`, `/academies/[id]`, `/academies/reports`, batch & session routes

**Verification:** `scripts/verify-module-10.sql`

---

## Module 11: Customer Portal

**Status:** ✅ Verified  
**Depends on:** Modules 9–10

Customer dashboard, profile, bookings (upcoming/history), academy enrollments, membership view, notifications, favorites, reviews, invoices, settings. Realtime on `bookings` + `notifications`.

**Routes:** `/portal`, `/portal/bookings`, `/portal/academies`, `/portal/membership`, `/portal/notifications`, `/portal/favorites`, `/portal/reviews`, `/portal/invoices`, `/portal/settings`, `/portal/profile`

**Verification:** `scripts/verify-module-11.sql`

---

## Module 12: Payments

**Status:** ✅ Verified  
**Depends on:** Modules 9, 11

Offline payment ledger (no Stripe): cash, UPI, card (manual), offline recording. Payment status on bookings, invoices with transaction lines, refund requests, transaction history, revenue reports, admin refund controls.

**Routes:** `/payments`, `/payments/reports`, `/payments/refunds` — plus payment panels on booking detail pages

**Verification:** `scripts/verify-module-12.sql`

---

## Module 13: Enterprise Analytics

**Status:** ✅ Verified  
**Depends on:** Modules 9, 10, 12

Venue utilization, revenue, booking trends, peak hours, sports popularity, academy & coach reports, customer growth. Charts, CSV/Excel/PDF exports, dashboard widgets, realtime analytics via Supabase Realtime.

**Routes:** `/reports`

**Verification:** `scripts/verify-module-13.sql`

---

## Module 14: Membership

**Status:** Planned  
**Depends on:** Module 9

Membership packages, user packages, credit deduction on booking.

---

## Module 15: Notifications

**Status:** Planned  
**Depends on:** Module 9

In-app notifications, Realtime delivery, booking confirmation email.

---

## Module 15: Reports

**Status:** Merged into Module 13  
**Depends on:** Modules 9, 10, 12

Enterprise analytics hub at `/reports` covers venue occupancy, revenue dashboards, and academy performance.

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
