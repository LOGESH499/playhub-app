# Development Roadmap

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Roadmap Overview

```
2026 Q3          2026 Q4          2027 Q1          2027 Q2
─────────────────────────────────────────────────────────────
Phase 0: Docs ████
Phase 1: Foundation     ████████
Phase 2: Booking              ████████████
Phase 3: Academy                      ████████████
Phase 4: Polish                               ████████
Phase 5: Scale                                      ████→
```

**Estimated timeline:** 20–24 weeks to MVP (v1.0) with 1–2 developers.

---

## 2. Phase 0 — Documentation & Planning (Current)

**Duration:** 1 week  
**Status:** In Progress

| Deliverable | Status |
|-------------|--------|
| Business & software requirements | ✅ |
| Architecture & database design | ✅ |
| API design & auth flows | ✅ |
| Wireframes & navigation | ✅ |
| Roadmap & sprint plan | ✅ |

**Exit criteria:** Documentation reviewed and approved; development environment ready.

---

## 3. Phase 1 — Foundation (Weeks 1–4)

**Goal:** Runnable app skeleton with auth, tenancy, and database.

### Module 1.1 — Project Scaffolding
- Next.js 16 + TypeScript + Tailwind + Shadcn UI
- ESLint, Prettier, path aliases
- Environment configuration
- CI pipeline (lint, typecheck)

### Module 1.2 — Supabase Setup
- Local Supabase via CLI
- Initial migrations (profiles, tenants, enums)
- RLS policies for core tables
- Type generation script

### Module 1.3 — Authentication
- Login, register, forgot password pages
- Supabase SSR cookie sessions
- Middleware route protection
- Profile management

### Module 1.4 — Multi-Tenancy
- Tenant creation (onboarding wizard)
- Tenant members and roles
- Tenant switcher
- Staff invite flow

### Module 1.5 — Public Shell
- Landing page
- Layout components (header, footer, sidebar)
- Sport listing pages (static)

**Milestone:** M1 — Authenticated multi-tenant shell

---

## 4. Phase 2 — Venue & Booking (Weeks 5–10)

**Goal:** End-to-end slot booking with real-time availability.

### Module 2.1 — Venue Management
- Venue CRUD dashboard
- Resource management
- Operating hours editor
- Blackout periods
- Image upload to Storage

### Module 2.2 — Public Venue Discovery
- Venue search and filters
- Leaflet map integration
- Venue profile page

### Module 2.3 — Pricing Engine
- Pricing rules CRUD
- Price calculation domain logic
- Promo codes (basic)

### Module 2.4 — Slot Engine
- Slot generation algorithm
- Availability API endpoint
- Slot hold mechanism
- `create_booking()` PostgreSQL function

### Module 2.5 — Booking UI
- Slot picker calendar grid
- Checkout flow
- Booking confirmation
- My bookings (player portal)

### Module 2.6 — Real-Time
- Supabase Realtime subscriptions
- Live slot updates
- React Query cache invalidation

### Module 2.7 — Staff Booking
- Quick booking POS screen
- Walk-in and on-behalf booking
- Booking management table

**Milestone:** M2 — Production-ready booking loop

---

## 5. Phase 3 — Academy Management (Weeks 11–15)

**Goal:** Full academy lifecycle from program creation to attendance.

### Module 3.1 — Academy Programs
- Program CRUD
- Public academy pages
- Academy discovery listing

### Module 3.2 — Batches & Schedules
- Batch creation with recurring schedule
- Coach assignment
- Session generation

### Module 3.3 — Enrollment
- Self-enrollment flow
- Staff-assisted enrollment
- Capacity and waitlist
- Guardian-minor enrollment

### Module 3.4 — Attendance
- Coach attendance screen
- Bulk mark attendance
- Attendance history

### Module 3.5 — Academy Dashboard
- Enrollment stats
- Attendance rate charts
- Batch management UI

**Milestone:** M3 — Academy operations live

---

## 6. Phase 4 — Dashboard, Reports & Polish (Weeks 16–19)

**Goal:** Operational dashboards, reporting, and production hardening.

### Module 4.1 — Analytics Dashboard
- KPI cards
- Recharts integration (bookings, utilization, revenue)
- Date range filters

### Module 4.2 — Membership Packages
- Package CRUD
- User package purchase (manual payment)
- Credit deduction on booking

### Module 4.3 — Notifications
- In-app notification center
- Realtime notification delivery
- Booking confirmation email (Edge Function)

### Module 4.4 — Platform Admin
- Tenant management
- Sport/academy templates
- Audit log viewer

### Module 4.5 — Polish & QA
- Dark mode
- Mobile UX pass
- Performance optimization
- Accessibility audit
- E2E test suite

**Milestone:** M4 — MVP release candidate

---

## 7. Phase 5 — Launch & Iteration (Weeks 20+)

**Goal:** Deploy to production, onboard pilot venues, gather feedback.

| Activity | Timeline |
|----------|----------|
| Production deployment (Vercel + Supabase) | Week 20 |
| Pilot with 2–3 venues | Weeks 20–22 |
| Bug fixes and feedback | Ongoing |
| v1.0 public launch | Week 24 |

### Post-MVP (v2 Roadmap)
- Online payments (Razorpay)
- PWA push notifications
- Advanced analytics
- Calendar sync
- Multi-language support
- Custom tenant domains

---

## 8. Module Dependency Graph

```
Phase 1: Scaffold → Supabase → Auth → Tenants → Public Shell
                                                    │
Phase 2:                    Venues → Resources → Pricing → Slots → Booking → Realtime
                                                    │
Phase 3:                              Academies → Batches → Enrollment → Attendance
                                                    │
Phase 4:                    Reports ← Notifications ← Packages ← Platform Admin
```

---

## 9. Risk-Adjusted Timeline

| Risk | Impact | Buffer |
|------|--------|--------|
| RLS complexity | +1 week | Phase 1 |
| Realtime edge cases | +1 week | Phase 2 |
| Academy schedule logic | +1 week | Phase 3 |
| E2E test flakiness | +0.5 week | Phase 4 |

**Total buffer:** ~3.5 weeks built into estimates.

---

## 10. Team Allocation (Suggested)

| Role | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|
| Full-stack dev | Auth, tenants | Booking engine | Academy | Reports |
| Full-stack dev | UI shell | Venue UI, maps | Attendance | QA, polish |
| PM/Design | Wireframe validation | UX review | Academy flows | Launch prep |

Solo developer: sequential modules, ~24 weeks.

---

## 11. Definition of Done (Per Module)

- [ ] Code merged to main with PR review
- [ ] TypeScript strict — no errors
- [ ] Zod validation on all inputs
- [ ] RLS policies tested
- [ ] Unit tests for domain logic
- [ ] Documentation updated if API/schema changed
- [ ] Responsive on mobile and desktop

---

## 12. Related Documents

- [Milestones](./milestones.md)
- [Sprint Plan](./sprint-plan.md)
- [Feature List](./feature-list.md)
- [Deployment Guide](./deployment-guide.md)
