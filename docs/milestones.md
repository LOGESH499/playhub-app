# Milestones

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Milestone Summary

| ID | Milestone | Target | Phase |
|----|-----------|--------|-------|
| M0 | Documentation Complete | Week 0 | Phase 0 |
| M1 | Multi-Tenant Auth Shell | Week 4 | Phase 1 |
| M2 | Booking Loop Live | Week 10 | Phase 2 |
| M3 | Academy Operations Live | Week 15 | Phase 3 |
| M4 | MVP Release Candidate | Week 19 | Phase 4 |
| M5 | Production Launch (v1.0) | Week 24 | Phase 5 |

---

## 2. M0 — Documentation Complete

**Target:** Week 0 (2026-07-09)

### Deliverables
- [x] Business Requirements Document
- [x] Software Requirements Specification
- [x] System Architecture
- [x] Database design and ERD
- [x] API design
- [x] Auth and realtime architecture
- [x] Wireframes and navigation flows
- [x] Feature list, roadmap, sprint plan
- [x] Security, deployment, and testing docs

### Success Criteria
- All stakeholders align on scope and tech stack
- No unresolved blockers for Phase 1 start
- Development environment prerequisites documented

### Exit Gate
→ **Approved to begin Phase 1 development**

---

## 3. M1 — Multi-Tenant Auth Shell

**Target:** Week 4

### Deliverables
- Next.js project scaffolded and deployed to Vercel preview
- Supabase project with core migrations applied
- User registration, login, logout, password reset
- Profile management
- Tenant creation onboarding wizard
- Staff invite and acceptance flow
- Tenant switcher in dashboard layout
- Landing page and public layout
- CI passing (lint, typecheck)

### Success Criteria
| Metric | Target |
|--------|--------|
| Auth flows complete | 100% |
| RLS on profiles/tenants | Enforced |
| Onboarding time (new tenant) | < 5 minutes |
| Mobile responsive | All auth pages |

### Demo Script
1. Register new user → verify email → complete onboarding
2. Create organization with name and slug
3. Invite staff member → accept invite in second browser
4. Switch between tenants (if applicable)

### Exit Gate
→ **Begin venue and booking modules**

---

## 4. M2 — Booking Loop Live

**Target:** Week 10

### Deliverables
- Venue and resource CRUD (dashboard)
- Operating hours and blackout management
- Pricing rules engine
- Public venue discovery (list + map)
- Venue profile with slot calendar
- Slot hold and atomic booking
- Real-time availability updates
- Player my-bookings portal
- Staff quick booking screen
- Booking cancellation flow
- Promo codes (basic)

### Success Criteria
| Metric | Target |
|--------|--------|
| Double-booking rate | 0% |
| Realtime update latency | < 2 seconds |
| Slot search p95 | < 500ms |
| Sports supported | All 10 slot sports |
| E2E booking test | Passing |

### Demo Script
1. Admin creates venue with 2 badminton courts, sets hours and pricing
2. Player discovers venue on map, books peak slot
3. Second browser shows slot immediately unavailable
4. Staff creates walk-in booking on another court
5. Player cancels booking per policy

### Exit Gate
→ **Begin academy modules**

---

## 5. M3 — Academy Operations Live

**Target:** Week 15

### Deliverables
- Academy program CRUD
- Public academy listing and detail pages
- Batch creation with recurring schedules
- Coach assignment
- Student enrollment (self-serve + staff)
- Batch session calendar
- Attendance marking (coach UI)
- Attendance history per student
- Academy dashboard widgets
- All 6 academy types supported

### Success Criteria
| Metric | Target |
|--------|--------|
| Capacity enforcement | 100% accurate |
| Attendance save time | < 30 sec for 20 students |
| Enrollment flow | < 3 minutes self-serve |
| Academy types | 6/6 configured |

### Demo Script
1. Admin creates Football Academy with 2 batches
2. Coach assigned to U-10 batch
3. Parent enrolls child (or self-enrollment)
4. Coach marks attendance for today's session
5. Admin views attendance rate on dashboard

### Exit Gate
→ **Begin polish, reports, and launch prep**

---

## 6. M4 — MVP Release Candidate

**Target:** Week 19

### Deliverables
- Dashboard KPIs and Recharts analytics
- CSV export for bookings and attendance
- Membership packages (manual payment)
- In-app notifications with realtime
- Booking confirmation email
- Platform admin panel
- Sport and academy templates seeded
- Dark mode
- Full E2E test suite
- Security audit checklist complete
- Performance optimization pass
- Accessibility review (WCAG AA targets)

### Success Criteria
| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 80 mobile |
| Lighthouse Accessibility | > 90 |
| E2E test pass rate | 100% |
| Critical bugs open | 0 |
| RLS audit | All tables covered |

### Demo Script
Full platform walkthrough: onboarding → venue setup → booking → academy → reports → admin

### Exit Gate
→ **Pilot deployment with real venues**

---

## 7. M5 — Production Launch (v1.0)

**Target:** Week 24

### Deliverables
- Production Vercel deployment
- Production Supabase project
- Custom domain configured
- Privacy policy and terms pages
- Pilot venue onboarding (2–3 venues)
- User feedback incorporated
- v1.0 release tag
- Launch announcement materials

### Success Criteria
| Metric | Target |
|--------|--------|
| Pilot venues live | ≥ 2 |
| Bookings in production | ≥ 50 |
| Academy enrollments | ≥ 20 |
| Uptime (launch week) | > 99% |
| Infra cost | $0/month (free tiers) |

### Launch Checklist
- [ ] Production env vars secured
- [ ] Email confirmation enabled
- [ ] Backup strategy documented
- [ ] Support contact published
- [ ] Monitoring alerts configured (Vercel + Supabase dashboards)
- [ ] Rollback procedure tested

### Exit Gate
→ **v1.0 GA — begin v2 planning**

---

## 8. Milestone Dependencies

```
M0 ──► M1 ──► M2 ──► M3 ──► M4 ──► M5
```

No milestone should be declared complete without meeting all success criteria and exit gate requirements.

---

## 9. Related Documents

- [Development Roadmap](./development-roadmap.md)
- [Sprint Plan](./sprint-plan.md)
- [Testing Strategy](./testing-strategy.md)
- [Deployment Guide](./deployment-guide.md)
