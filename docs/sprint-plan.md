# Sprint Plan

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Sprint Configuration

| Parameter | Value |
|-----------|-------|
| Sprint duration | 2 weeks |
| Total sprints (to MVP) | 12 |
| Team size (assumed) | 1–2 developers |
| Ceremonies | Planning (Day 1), Daily standup, Review (Day 10), Retro (Day 10) |

---

## 2. Sprint Overview

| Sprint | Dates (est.) | Theme | Milestone |
|--------|--------------|-------|-----------|
| S0 | Jul 7–11, 2026 | Documentation | M0 |
| S1 | Jul 14–25 | Project scaffold + Supabase | — |
| S2 | Jul 28–Aug 8 | Authentication | — |
| S3 | Aug 11–22 | Multi-tenancy + onboarding | M1 |
| S4 | Aug 25–Sep 5 | Venue management | — |
| S5 | Sep 8–19 | Pricing + slot engine | — |
| S6 | Sep 22–Oct 3 | Booking UI + realtime | M2 |
| S7 | Oct 6–17 | Staff booking + discovery polish | — |
| S8 | Oct 20–31 | Academy programs + batches | — |
| S9 | Nov 3–14 | Enrollment + attendance | M3 |
| S10 | Nov 17–28 | Dashboard, reports, notifications | — |
| S11 | Dec 1–12 | Platform admin + packages + polish | M4 |
| S12 | Dec 15–26 | QA, pilot, launch prep | M5 |

---

## 3. Sprint 0 — Documentation ✅

**Goal:** Complete all planning documentation.

### Backlog
- [x] Business requirements
- [x] Software requirements
- [x] Architecture documentation
- [x] Database design and ERD
- [x] API design
- [x] Wireframes and navigation
- [x] Roadmap and sprint plan

**Story points:** N/A (planning sprint)

---

## 4. Sprint 1 — Project Scaffold + Supabase

**Goal:** Runnable Next.js app connected to Supabase.

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S1-01 | As a developer, I want a Next.js 16 project with TypeScript, Tailwind, and Shadcn so I can build UI consistently | 3 |
| S1-02 | As a developer, I want Supabase local dev configured with migration workflow | 5 |
| S1-03 | As a developer, I want CI to run lint and typecheck on every PR | 2 |
| S1-04 | As a developer, I want generated database types from Supabase schema | 2 |
| S1-05 | As a developer, I want core enums and profiles table migrated | 3 |

**Total:** 15 points

### Technical Tasks
- Initialize `pnpm` project with Next.js 16 App Router
- Install and configure Shadcn UI
- Set up `supabase/config.toml` and initial migration
- Create `.env.example`
- Deploy empty app to Vercel preview
- Configure GitHub Actions CI

### Definition of Done
- `pnpm dev` runs locally
- `supabase db reset` applies migrations
- Vercel preview URL accessible

---

## 5. Sprint 2 — Authentication

**Goal:** Complete auth flows with Supabase SSR.

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S2-01 | As a user, I want to register with email and password | 3 |
| S2-02 | As a user, I want to log in and log out | 2 |
| S2-03 | As a user, I want to reset my forgotten password | 2 |
| S2-04 | As a user, I want to manage my profile (name, phone, avatar) | 3 |
| S2-05 | As a developer, I want middleware protecting dashboard routes | 3 |
| S2-06 | As a user, I want email verification before full access | 2 |

**Total:** 15 points

### Technical Tasks
- Implement `@supabase/ssr` cookie sessions
- Auth pages with React Hook Form + Zod
- `handle_new_user` trigger for profiles
- Avatar upload to Storage bucket
- Auth callback route handler

---

## 6. Sprint 3 — Multi-Tenancy + Onboarding

**Goal:** Tenant creation, roles, invites. **Milestone M1.**

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S3-01 | As a new user, I want to create my organization via onboarding wizard | 5 |
| S3-02 | As an owner, I want to invite staff with specific roles | 5 |
| S3-03 | As an invitee, I want to accept invite and join the organization | 3 |
| S3-04 | As a user in multiple tenants, I want to switch active organization | 3 |
| S3-05 | As a developer, I want RLS policies on tenant tables | 5 |
| S3-06 | As a visitor, I want to see a landing page explaining PLAYHUB | 2 |

**Total:** 23 points

### Technical Tasks
- Tenants, tenant_members, tenant_invites migrations
- RLS helper functions
- Onboarding 4-step wizard
- Tenant switcher component
- Dashboard layout with sidebar
- Landing page

---

## 7. Sprint 4 — Venue Management

**Goal:** Full venue and resource CRUD in dashboard.

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S4-01 | As an admin, I want to create venues with address and geo pin | 5 |
| S4-02 | As an admin, I want to add bookable resources per sport | 5 |
| S4-03 | As an admin, I want to set operating hours per venue/resource | 5 |
| S4-04 | As an admin, I want to block dates for maintenance | 3 |
| S4-05 | As an admin, I want to upload venue photos | 3 |
| S4-06 | As an admin, I want to publish/unpublish my venue | 2 |

**Total:** 23 points

---

## 8. Sprint 5 — Pricing + Slot Engine

**Goal:** Backend logic for slots and pricing.

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S5-01 | As an admin, I want peak/off-peak pricing rules | 5 |
| S5-02 | As a developer, I want a slot generation algorithm | 8 |
| S5-03 | As a developer, I want GET /api/v1/slots returning availability | 5 |
| S5-04 | As a developer, I want slot hold with expiration | 5 |
| S5-05 | As a developer, I want create_booking() RPC with conflict prevention | 8 |

**Total:** 31 points (stretch — carry over if needed)

---

## 9. Sprint 6 — Booking UI + Realtime

**Goal:** Player can book end-to-end. **Milestone M2.**

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S6-01 | As a player, I want to see available slots on a calendar grid | 8 |
| S6-02 | As a player, I want to checkout and confirm my booking | 5 |
| S6-03 | As a player, I want real-time updates when slots are taken | 5 |
| S6-04 | As a player, I want to view my upcoming bookings | 3 |
| S6-05 | As a player, I want to cancel a booking | 3 |
| S6-06 | As a player, I want to apply a promo code | 3 |

**Total:** 27 points

---

## 10. Sprint 7 — Staff Booking + Discovery

**Goal:** Public discovery and staff tools.

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S7-01 | As a player, I want to search venues on a map | 8 |
| S7-02 | As a player, I want to filter venues by sport, date, and city | 5 |
| S7-03 | As staff, I want a quick booking screen for walk-ins | 8 |
| S7-04 | As staff, I want to book on behalf of a player | 3 |
| S7-05 | As staff, I want to view and manage all bookings in a table | 5 |

**Total:** 29 points

---

## 11. Sprint 8 — Academy Programs + Batches

**Goal:** Academy structure in place.

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S8-01 | As an admin, I want to create academy programs | 5 |
| S8-02 | As an admin, I want to create batches with schedule and capacity | 8 |
| S8-03 | As an admin, I want to assign coaches to batches | 3 |
| S8-04 | As a visitor, I want to browse academy programs | 5 |
| S8-05 | As a developer, I want batch session generation from schedule | 5 |

**Total:** 26 points

---

## 12. Sprint 9 — Enrollment + Attendance

**Goal:** Full academy operations. **Milestone M3.**

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S9-01 | As a player, I want to enroll in an open batch | 5 |
| S9-02 | As staff, I want to enroll a student in a batch | 3 |
| S9-03 | As a coach, I want to mark attendance for a session | 8 |
| S9-04 | As a parent, I want to view my child's attendance history | 3 |
| S9-05 | As an admin, I want capacity enforced on enrollment | 3 |
| S9-06 | As a coach, I want to add session notes | 2 |

**Total:** 24 points

---

## 13. Sprint 10 — Dashboard, Reports, Notifications

**Goal:** Operational visibility.

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S10-01 | As an owner, I want a dashboard with KPI cards | 5 |
| S10-02 | As an owner, I want booking trend and sport breakdown charts | 5 |
| S10-03 | As an owner, I want to export bookings as CSV | 3 |
| S10-04 | As a user, I want in-app notifications for booking events | 5 |
| S10-05 | As a player, I want email confirmation after booking | 5 |

**Total:** 23 points

---

## 14. Sprint 11 — Platform Admin + Polish

**Goal:** MVP feature complete. **Milestone M4.**

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S11-01 | As platform admin, I want to manage tenants | 5 |
| S11-02 | As platform admin, I want to manage sport templates | 3 |
| S11-03 | As an admin, I want membership packages with credits | 5 |
| S11-04 | As a user, I want dark mode | 3 |
| S11-05 | As a developer, I want E2E tests for critical flows | 8 |
| S11-06 | As a developer, I want performance and a11y pass | 5 |

**Total:** 29 points

---

## 15. Sprint 12 — QA, Pilot, Launch

**Goal:** Production launch. **Milestone M5.**

### User Stories

| ID | Story | Points |
|----|-------|--------|
| S12-01 | As a developer, I want production deployment configured | 5 |
| S12-02 | As a venue owner, I want onboarding support documentation | 3 |
| S12-03 | As a team, we want pilot venue feedback incorporated | 8 |
| S12-04 | As a team, we want zero critical bugs before launch | 5 |
| S12-05 | As a visitor, I want privacy policy and terms pages | 2 |

**Total:** 23 points

---

## 16. Velocity Assumptions

| Team Size | Points/Sprint |
|-----------|---------------|
| 1 developer | 15–20 |
| 2 developers | 25–35 |

Sprints 5, 6, 7, and 11 are high-load — consider splitting or extending if velocity is lower.

---

## 17. Backlog Grooming Rules

1. All stories have acceptance criteria before sprint planning
2. Stories > 8 points must be split
3. Bug fixes prioritized over new features after M2
4. Technical debt items logged in GitHub Issues with `tech-debt` label

---

## 18. Related Documents

- [Development Roadmap](./development-roadmap.md)
- [Milestones](./milestones.md)
- [Feature List](./feature-list.md)
