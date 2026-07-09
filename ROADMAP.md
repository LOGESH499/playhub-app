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
[                    ] Module 5  Sports Management
[                    ] Module 6  Venue Management
[                    ] Module 7  Court Management
[                    ] Module 8  Slot Management
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

**Overall:** 4 / 17 modules complete (24%)

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

## Module 5: Sports Management

**Status:** Next up  
**Depends on:** Module 2

Sport templates, sport enum configuration, sport landing pages, icons and metadata per sport.

---

## Module 6: Venue Management

**Status:** Planned  
**Depends on:** Modules 2, 5

Venue CRUD, address/geo, amenities, images (Storage), publish/unpublish, public venue pages.

---

## Module 7: Court Management

**Status:** Planned  
**Depends on:** Module 6

Resources (courts/lanes/pitches), sport assignment, operating hours, blackout periods.

---

## Module 8: Slot Management

**Status:** Planned  
**Depends on:** Module 7

Slot generation algorithm, pricing rules, slot holds, availability API.

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
