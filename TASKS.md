# PLAYHUB — Development Tasks

Track module-by-module implementation progress.

**Last updated:** 2026-07-09

---

## Module Status

| # | Module | Status | Completed |
|---|--------|--------|-----------|
| 1 | Authentication (foundation) | ✅ Complete | 2026-07-09 |
| 2 | Database | ✅ Complete | 2026-07-09 |
| 3 | Auth + Organizations + Roles | ✅ Complete | 2026-07-09 |
| 4 | Dashboard | ✅ Complete | 2026-07-09 |
| 5 | Sports Management | ✅ Verified | 2026-07-09 |
| 6 | Venue Management | ✅ Verified | 2026-07-09 |
| 7 | Court Management | ✅ Verified | 2026-07-09 |
| 8 | Slot Management | ✅ Verified | 2026-07-09 |
| 9 | Real-Time Booking | ✅ Verified | 2026-07-09 |
| 10 | Academy Management | ✅ Verified | 2026-07-09 |
| 11 | Customer Portal | ✅ Verified | 2026-07-09 |
| 12 | Membership | ⬜ Next | — |
| 13 | Payment | ⬜ Pending | — |
| 14 | Notifications | ⬜ Pending | — |
| 15 | Reports | ⬜ Pending | — |
| 16 | Admin Panel | ⬜ Pending | — |
| 17 | Deployment | ⬜ Pending | — |

---

## Module 1: Authentication ✅

### Completed tasks

- [x] Next.js 16 + React 19 + TypeScript project scaffold
- [x] Tailwind CSS v4 + Shadcn-style UI components
- [x] Supabase browser, server, and middleware clients (`@supabase/ssr`)
- [x] Auth middleware — protect `/dashboard`, `/profile`, `/onboarding`
- [x] Login page with email/password
- [x] Register page with validation (Zod)
- [x] Forgot password flow
- [x] Reset password page (recovery callback)
- [x] Magic link sign-in
- [x] OAuth callback route (`/auth/callback`)
- [x] Email verification holding page (`/verify-email`)
- [x] Sign out server action
- [x] Profile page with update form
- [x] Session helpers (`getUser`, `getProfile`)
- [x] Auth Zod schemas (login, register, forgot, reset, profile)
- [x] `profiles` table migration + `handle_new_user` trigger
- [x] RLS policies on profiles (select/update own)
- [x] Landing page with auth-aware navigation
- [x] Dashboard placeholder (post-login destination)
- [x] Onboarding placeholder page
- [x] CI workflow (lint, typecheck, build)
- [x] `.env.example` and Supabase `config.toml`

### Files added (key)

```
src/features/auth/          — forms, actions, exports
src/lib/supabase/           — client, server, middleware
src/lib/validators/         — auth.schema.ts
src/lib/auth/session.ts     — getUser, getProfile
src/app/(auth)/             — login, register, forgot-password, etc.
src/app/auth/callback/      — OAuth & email callback
middleware.ts               — session refresh + route guard
supabase/migrations/        — 20260709000001_auth_profiles.sql
```

---

## Module 2: Database ✅

### Completed tasks

- [x] 11 enums + `btree_gist` extension
- [x] 25 tables (26 total incl. profiles from Module 1)
- [x] Multi-tenant schema: tenants, members, invites, guardian_links
- [x] Venue schema: venues, resources, operating_hours, blackout_periods
- [x] Booking schema: bookings, slot_holds, waitlist + overlap exclusion constraint
- [x] Pricing schema: pricing_rules, membership_packages, user_packages, promo_codes
- [x] Academy schema: programs, batches, coaches, sessions, enrollments, attendance
- [x] System tables: sport_templates, academy_templates, notifications, audit_logs
- [x] RLS helper functions (`has_tenant_role`, `is_platform_admin`, etc.)
- [x] RLS policies on all 26 tables + storage buckets
- [x] RPC functions: `create_booking`, `cancel_booking`, `create_enrollment`, `expire_slot_holds`
- [x] Realtime publication (bookings, slot_holds, notifications, attendance)
- [x] Storage buckets: avatars, venue-media, academy-media
- [x] Seed data: 10 sports, 6 academies, 3 demo venues, pricing, promo, package
- [x] Typed Supabase clients (browser, server, admin)
- [x] Database types + enum constants (`src/lib/database/`)
- [x] `DATABASE.md` with ERD and setup guide
- [x] npm scripts: `db:push`, `db:reset`, `db:seed`

### Migration files

```
supabase/migrations/
  20260709000002_enums_extensions.sql
  20260709000003_identity_tenancy.sql
  20260709000004_venues_resources.sql
  20260709000005_booking.sql
  20260709000006_pricing.sql
  20260709000007_academy.sql
  20260709000008_system.sql
  20260709000009_rls_helpers.sql
  20260709000010_rls_policies.sql
  20260709000011_functions.sql
  20260709000012_realtime_storage.sql
  20260709000013_invite_accept.sql
supabase/seed.sql
```

---

## Module 3: Auth + Organizations + Roles ✅

### Completed tasks

- [x] Refactor all auth forms to React Hook Form + Zod (login, register, forgot/reset password, magic link, profile)
- [x] Expanded session layer: `getAuthContext()`, tenant memberships, active tenant cookie
- [x] App roles: Super Admin, Venue Admin, Coach, Customer (`src/lib/auth/roles.ts`)
- [x] Organization creation onboarding (`/onboarding`) with slug auto-generation
- [x] Tenant switcher + active tenant cookie (`playhub_tenant_id`)
- [x] Organizations list page (`/organizations`)
- [x] Invite acceptance flow (`/invite/[token]`) + `accept_tenant_invite` RPC migration
- [x] Platform admin route (`/platform`) with super-admin guard
- [x] Enhanced middleware: email verification gate, platform protection, smart post-login redirects
- [x] Auth callback uses `getPostLoginRedirect()` based on role and memberships
- [x] Resend verification email action + UI on `/verify-email`
- [x] Dashboard shell layout with header, role badge, tenant switcher
- [x] Shadcn form primitives + badge component
- [x] Lint, typecheck, and production build pass

### Key files

```
src/features/auth/components/     — RHF forms + resend verification
src/features/organization/        — actions, onboarding, tenant switcher, role badge
src/lib/auth/                     — roles, constants, session context
src/lib/validators/               — organization.schema.ts
src/app/(dashboard)/layout.tsx    — protected shell
src/app/(platform)/               — super-admin area
src/lib/supabase/middleware.ts    — route guards
supabase/migrations/20260709000013_invite_accept.sql
```

---

## Module 4: Dashboard ✅

### Completed tasks

- [x] `src/features/dashboard/` modular feature (shell, widgets, queries, actions)
- [x] Responsive sidebar with role-based navigation (desktop + mobile sheet)
- [x] Top navigation: search placeholder, tenant switcher, notifications, theme toggle, user menu
- [x] Dark/light/system theme via `next-themes` + CSS variables
- [x] KPI stat cards (role-aware: venue admin, customer, platform admin)
- [x] Recent activity feed (audit logs or bookings)
- [x] Weekly calendar with upcoming bookings
- [x] Notifications panel with mark-read actions
- [x] Route groups: `(shell)` for dashboard chrome, standalone onboarding layout
- [x] Shadcn UI: sheet, dropdown-menu, popover, avatar, scroll-area, separator, skeleton, tooltip
- [x] Lint, typecheck, and production build pass

### Key files

```
src/features/dashboard/
  components/   — shell, sidebar, top-nav, stat-cards, calendar, activity, notifications
  lib/          — navigation.ts, queries.ts, types.ts, format.ts
  actions/      — notification.actions.ts
src/app/(dashboard)/(shell)/   — dashboard, profile, organizations, invite
src/components/providers/theme-provider.tsx
src/components/theme-toggle.tsx
```

---

## Module 5: Sports Management ✅ (Verified)

### Verification (2026-07-09)

- [x] Migration `20260709000014` idempotent (`sport_templates` → `sports`, constraint-safe)
- [x] Tables: `sports`, `sport_categories`, `venue_sports`
- [x] Indexes: `sports_sport_type_unique`, `sports_slug_unique`, `sports_name_unique`
- [x] RLS: `sports_select_active`, `sports_manage_platform`, `sports_manage_tenant_admin`, `venue_sports_*`
- [x] FK: `venue_sports.sport_id` → `sports.id`
- [x] RPC: `log_sport_audit`
- [x] Types: `sport_status`, `sports`, `sport_categories`, `venue_sports` in `database.types.ts`
- [x] Script: `scripts/verify-modules-5-7.sql`

### Completed tasks

- [x] Migration `20260709000014_sports_management.sql` — extend `sport_templates` → `sports`
- [x] `sport_categories`, `venue_sports`, `sport_status` enum
- [x] Soft delete, featured flag, display order, booking rules JSONB, default price
- [x] RLS: platform admin + tenant admin policies; `log_sport_audit` RPC
- [x] Server actions: create, update, archive, delete, toggle status
- [x] Zod schemas (`sports.schema.ts`) + React Hook Form sport form
- [x] Sports list page: grid/list views, search, filters, pagination
- [x] Create/edit pages with venue assignment + default pricing sync
- [x] Loading, error, and empty states
- [x] Sidebar navigation enabled for Sports
- [x] Lint, typecheck, and production build pass

### Key files

```
src/features/sports/
  actions/sports.actions.ts
  components/  — sport-card, sport-table, sport-form, filters, pagination
  lib/         — queries.ts, types.ts, icons.ts
src/app/(dashboard)/(shell)/sports/
supabase/migrations/20260709000014_sports_management.sql
src/lib/validators/sports.schema.ts
```

---

## Module 6: Venue Management ✅ (Verified)

### Verification (2026-07-09)

- [x] Migration `20260709000015` idempotent
- [x] `venue_status` enum + `venues.status` column
- [x] Table: `venue_holidays` with unique `(venue_id, holiday_date)`
- [x] Index: `venues_status_idx`
- [x] RLS: `venue_holidays_*`, updated `venues_select_public`
- [x] RPC: `log_venue_audit`; trigger `venues_sync_published`
- [x] Types: `venue_status`, `venue_holidays` in `database.types.ts`

### Completed tasks

- [x] Migration `20260709000015_venue_management.sql` — `venue_status` enum, `venue_holidays`, `log_venue_audit`
- [x] Venue CRUD server actions with Zod + React Hook Form
- [x] Multiple venues per tenant with address, geo coordinates, amenities
- [x] OpenStreetMap + Leaflet map picker and preview
- [x] Gallery upload to Supabase Storage (`venue-media` bucket)
- [x] Working hours, holidays, blackout dates, pricing rules editors
- [x] Venue status (draft, active, inactive, maintenance, archived)
- [x] List page: grid/list views, search, city/status filters, pagination
- [x] Soft delete, archive, activate/deactivate, audit logs
- [x] RLS on venues, holidays, hours, blackouts, pricing (existing + holidays)
- [x] Sidebar navigation enabled for Venues
- [x] Lint, typecheck, and production build pass

### Key files

```
src/features/venues/
  actions/venue.actions.ts
  components/  — venue-card, venue-table, venue-form, map, gallery, filters
  lib/         — queries.ts, parse.ts, types.ts, amenities.ts, storage.ts
src/app/(dashboard)/(shell)/venues/
supabase/migrations/20260709000015_venue_management.sql
src/lib/validators/venue.schema.ts
```

---

## Module 7: Court & Resource Management ✅ (Verified)

### Verification (2026-07-09)

- [x] Migration `20260709000016` idempotent
- [x] `resource_status` enum + `resources.status`, `maintenance_until`
- [x] Index: `resources_status_idx`
- [x] Trigger: `resources_sync_active` (syncs `is_active` from `status`)
- [x] Storage: `court-media` bucket + 4 RLS policies
- [x] RPC: `log_resource_audit`
- [x] Types: `resource_status`, extended `resources` row in `database.types.ts`
- [x] Lint, typecheck, and production build pass

### Completed tasks

- [x] Migration `20260709000016_court_management.sql` — extend `resources`, `resource_status`, `running_track` sport
- [x] Court CRUD with capacity, surface, dimensions (length/width), photos, equipment
- [x] Availability (operating hours), maintenance mode, blackout periods
- [x] Booking rules and resource-scoped pricing rules
- [x] Support: Football Turf, Cricket Ground, Cricket Nets, Pickleball, Tennis, Badminton, Squash, Basketball, Volleyball, Swimming Lanes, Running Track
- [x] `court-media` Supabase Storage bucket + `log_resource_audit` RPC
- [x] List page: grid/list, search, venue/sport/status/indoor filters, pagination
- [x] Server actions with Zod + React Hook Form
- [x] Sidebar navigation enabled for Courts
- [x] Lint, typecheck, and production build pass

### Key files

```
src/features/courts/
  actions/court.actions.ts
  components/  — court-card, court-table, court-form, gallery, filters
  lib/         — queries.ts, parse.ts, constants.ts, storage.ts
src/app/(dashboard)/(shell)/courts/
supabase/migrations/20260709000016_court_management.sql
src/lib/validators/court.schema.ts
```

---

## Module 8: Slot Management ✅

- [x] Migrations `20260709000017_slot_management.sql`, `20260709000018_slot_template_peak_hours.sql`
- [x] Verification script `scripts/verify-module-8.sql`
- [x] Slot CRUD, templates, calendar views (month/week/day/timeline/list)
- [x] Bulk generate/block/unblock/duplicate/delete, dynamic pricing
- [x] `validate_slot_window` RPC + overlap constraint
- [x] Realtime on `slots`, routes `/slots`, nav integration

**Files:**

```
src/features/slots/
  actions/slot.actions.ts
  components/  — calendars, timeline, bulk panel, forms, filters
  hooks/use-slots-realtime.ts
  lib/         — queries.ts, generation.ts, pricing.ts, calendar.ts
src/app/(dashboard)/(shell)/slots/
supabase/migrations/20260709000017_slot_management.sql
supabase/migrations/20260709000018_slot_template_peak_hours.sql
src/lib/validators/slot.schema.ts
```

---

## Enterprise UI Redesign ✅

UI-only pass across existing modules (no API / DB / business logic changes):

- [x] OKLCH design system in `globals.css` (light/dark/system, sidebar, success/warning tokens)
- [x] Geist typography, semantic shadows, `surface-card` utilities
- [x] Collapsible sidebar with `useSyncExternalStore` persistence
- [x] Command palette (cmdk) with ⌘K shortcut
- [x] Breadcrumbs, `PageHeader`, Sonner toasts
- [x] TanStack `DataTable` + shared `Table` primitives (Sports migrated)
- [x] Recharts dashboard analytics from real booking/stats data
- [x] Polished auth layout, platform admin header, module list pages

---

## Module 9: Real-Time Booking ✅

- [x] Migrations `20260709000019_01_expired_booking_enum.sql`, `20260709000019_booking_engine.sql`
- [x] `book_slot`, `create_slot_hold`, `reschedule_booking`, `join_waitlist` RPCs
- [x] Slot integration: `slot_id`, status sync, `validate_slot_window`
- [x] Booking UI: list, book flow, detail, invoice, QR, reports
- [x] Realtime on `bookings` + `slots`, in-app notifications
- [x] Verification script `scripts/verify-module-9.sql`

**Files:**

```
src/features/bookings/
  actions/booking.actions.ts
  components/  — table, slot picker, detail, invoice, QR, reports
  hooks/use-bookings-realtime.ts
  lib/queries.ts
src/app/(dashboard)/(shell)/bookings/
supabase/migrations/20260709000019_booking_engine.sql
src/lib/validators/booking.schema.ts
```

---

## Module 10: Academy Management ✅

- [x] Migration `20260709000020_academy_management.sql` — fees, progress, RPCs, audit
- [x] Programs & batches CRUD, training schedule editor, session generation
- [x] Coach allocation, enrollments, attendance sheet, progress tracking
- [x] Offline fee generation and payment recording
- [x] Admin reports, student/coach role views, realtime attendance
- [x] Verification script `scripts/verify-module-10.sql`

**Files:**

```
src/features/academies/
  actions/academy.actions.ts
  components/  — program/batch forms, attendance, coaches, fees, reports
  hooks/use-attendance-realtime.ts
  lib/queries.ts
src/app/(dashboard)/(shell)/academies/
supabase/migrations/20260709000020_academy_management.sql
src/lib/validators/academy.schema.ts
```

---

## Module 11: Customer Portal ✅

- [x] Migration `20260709000021_customer_portal.sql` — favorites, reviews, RPCs
- [x] Portal dashboard with stats, upcoming bookings, quick actions
- [x] Bookings (upcoming/history), invoices, academy enrollments
- [x] Membership view, notifications, favorites, reviews & ratings
- [x] Profile & settings (notification preferences in `profiles.preferences`)
- [x] Realtime on `bookings` + `notifications`
- [x] Verification script `scripts/verify-module-11.sql`

**Files:**

```
src/features/portal/
  actions/portal.actions.ts
  components/  — stats, favorites, reviews, settings, notifications, membership
  hooks/use-portal-realtime.ts
  lib/queries.ts
src/app/(dashboard)/(shell)/portal/
supabase/migrations/20260709000021_customer_portal.sql
src/lib/validators/portal.schema.ts
```

---

## Module 12: Membership (Next)

- [ ] Package purchase flow and credit deduction on booking

---

## Notes

- Auth module includes minimal `profiles` migration (Module 1)
- Full schema + RLS in Module 2 — see [DATABASE.md](./DATABASE.md)
- Module 3 adds multi-tenant auth context on top of Module 1 foundation
- App builds and deploys on Vercel without Supabase env (shows config notice on dashboard)
- **Project rules** established 2026-07-09 — see [docs/project-rules.md](./docs/project-rules.md)
