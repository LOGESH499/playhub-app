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
| 5 | Sports Management | ⬜ Next | — |
| 6 | Venue Management | ⬜ Pending | — |
| 7 | Court Management | ⬜ Pending | — |
| 8 | Slot Management | ⬜ Pending | — |
| 9 | Real-Time Booking | ⬜ Pending | — |
| 10 | Academy Management | ⬜ Pending | — |
| 11 | Coach Management | ⬜ Pending | — |
| 12 | Membership | ⬜ Pending | — |
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

## Module 5: Sports Management (Next)

- [ ] Sport template pages
- [ ] Sport metadata and icons

---

## Notes

- Auth module includes minimal `profiles` migration (Module 1)
- Full schema + RLS in Module 2 — see [DATABASE.md](./DATABASE.md)
- Module 3 adds multi-tenant auth context on top of Module 1 foundation
- App builds and deploys on Vercel without Supabase env (shows config notice on dashboard)
- **Project rules** established 2026-07-09 — see [docs/project-rules.md](./docs/project-rules.md)
