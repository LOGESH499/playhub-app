# Business Requirements Document (BRD)

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Status:** Draft — Pre-Development  
**Last Updated:** 2026-07-09

---

## 1. Executive Summary

PLAYHUB addresses the fragmentation in sports facility operations: venues use spreadsheets, WhatsApp, and disconnected tools for bookings, payments tracking, and academy management. PLAYHUB unifies real-time slot booking, academy lifecycle management, and multi-sport operations into one SaaS platform built entirely on free-tier infrastructure.

### 1.1 Business Objectives

| ID | Objective | Success Metric |
|----|-----------|----------------|
| BO-01 | Reduce double-bookings to near zero | < 0.1% slot conflict rate |
| BO-02 | Increase venue utilization | +15% booked hours within 6 months |
| BO-03 | Digitize academy operations | 100% batch attendance tracked digitally |
| BO-04 | Enable self-serve discovery | 40% of bookings without staff intervention |
| BO-05 | Operate at zero infra cost at launch | $0/month on Vercel + Supabase free tiers |

### 1.2 Scope

**In Scope**

- Multi-sport slot booking (11 sports + 6 academy types)
- Multi-tenant venue and academy management
- Real-time availability updates
- Role-based access for owners, staff, coaches, and players
- Memberships, packages, and recurring bookings
- Basic reporting and analytics
- Mobile-responsive web application (PWA-ready)

**Out of Scope (v1)**

- Native iOS/Android apps
- Payment gateway integration (manual/offline payment recording in v1)
- Third-party calendar sync (Google/Outlook)
- AI-based demand forecasting
- Hardware turnstile/RFID integration

---

## 2. Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| Platform Owner | SaaS growth, tenant onboarding, platform reliability |
| Venue Owner / Tenant Admin | Revenue, utilization, staff efficiency |
| Academy Director | Batch management, coach assignment, student progress |
| Front-Desk Staff | Quick bookings, walk-ins, cancellations |
| Coach | Attendance, session plans, student roster |
| Player / Parent | Easy discovery, booking, academy enrollment |
| Auditor / Accountant | Exportable reports (future phase) |

---

## 3. User Personas

### 3.1 Raj — Venue Owner (Tenant Admin)

- Owns a 4-court badminton + 2 pickleball facility
- Needs pricing rules, peak/off-peak rates, and staff accounts
- Pain: Double bookings and manual ledger reconciliation

### 3.2 Priya — Academy Coach

- Runs a weekend football academy with 3 age groups
- Needs attendance, batch schedules, and communication with parents
- Pain: WhatsApp chaos and missed session updates

### 3.3 Arjun — Casual Player

- Books badminton courts 2–3 times per week
- Wants instant availability, map-based venue discovery, and booking history
- Pain: Calling venues and uncertain slot status

### 3.4 Meera — Front-Desk Staff

- Handles walk-ins and phone bookings
- Needs a fast POS-style booking screen with override permissions
- Pain: Slow systems and no real-time sync across counters

---

## 4. Business Rules

### 4.1 Booking Rules

| Rule ID | Description |
|---------|-------------|
| BR-BOOK-01 | A slot cannot be double-booked on the same resource |
| BR-BOOK-02 | Cancellations follow venue-defined policy (hours before, refund %) |
| BR-BOOK-03 | Peak and off-peak pricing MUST be configurable per venue/sport |
| BR-BOOK-04 | Recurring bookings reserve slots up to a configurable horizon (default 4 weeks) |
| BR-BOOK-05 | Walk-in bookings by staff MAY bypass online payment requirement |
| BR-BOOK-06 | Slot hold timeout for unpaid online bookings: 10 minutes (configurable) |

### 4.2 Academy Rules

| Rule ID | Description |
|---------|-------------|
| BR-ACAD-01 | A student MAY enroll in multiple academy batches |
| BR-ACAD-02 | Batch capacity MUST be enforced at enrollment |
| BR-ACAD-03 | Attendance is recorded per session per student |
| BR-ACAD-04 | Academy types: Running, Football, Cricket, Tennis, Swimming, Badminton |
| BR-ACAD-05 | Coach assignment MAY span multiple batches |

### 4.3 Multi-Tenancy Rules

| Rule ID | Description |
|---------|-------------|
| BR-TEN-01 | Each tenant's data MUST be isolated (row-level security) |
| BR-TEN-02 | A user MAY belong to multiple tenants with different roles |
| BR-TEN-03 | Platform super-admin MAY access tenant data for support (audited) |

### 4.4 Sport-Specific Rules

| Sport | Resource Unit | Default Slot Duration |
|-------|---------------|----------------------|
| Football | Pitch (full/half) | 60–90 min |
| Cricket | Ground / Net Bay | 60–120 min |
| Cricket Nets | Net Lane | 30–60 min |
| Pickleball | Court | 60 min |
| Badminton | Court | 60 min |
| Tennis | Court | 60–90 min |
| Squash | Court | 45–60 min |
| Basketball | Court (full/half) | 60 min |
| Volleyball | Court | 60 min |
| Swimming | Lane | 30–60 min |

---

## 5. Revenue Model (Business — Not Technical v1)

| Stream | Description |
|--------|-------------|
| SaaS Subscription | Monthly fee per venue (tiered by courts count) — future |
| Transaction Fee | % on online payments — future when payment gateway added |
| Premium Features | Advanced analytics, white-label — future |

**v1 Note:** Payment recording is manual; revenue features are documented for roadmap alignment only.

---

## 6. Compliance & Legal Considerations

- GDPR-style data export and deletion for user accounts (SHOULD in v1)
- Minor enrollment requires parent/guardian linkage for academies
- Terms of service and privacy policy pages (MUST before public launch)
- Photo consent for academy promotional use (MAY — configurable waiver)

---

## 7. Assumptions

1. Primary market: India (IST timezone, INR currency display)
2. Users access via mobile browsers predominantly
3. Venues have reliable internet for real-time sync
4. Supabase free tier limits are acceptable for MVP (500MB DB, 50K MAU auth)
5. No SMS/email paid services in v1 — use Supabase Auth email only

---

## 8. Constraints

- Zero paid third-party services at launch
- Must deploy on Vercel Free + Supabase Free
- No vendor lock-in to proprietary BaaS beyond Supabase open stack

---

## 9. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase free tier limits | High at scale | Connection pooling, query optimization, upgrade path documented |
| Real-time latency | Medium | Optimistic UI, conflict resolution UX |
| Multi-sport complexity | Medium | Sport templates and configurable resource metadata |
| No payment gateway in v1 | Medium | Clear "pay at venue" workflow, manual confirmation |

---

## 10. Acceptance Criteria (Business)

1. A venue owner can onboard, add courts, set pricing, and accept bookings without developer help
2. A player can search, view real-time availability, and book a slot end-to-end
3. An academy director can create batches, enroll students, and mark attendance
4. No cross-tenant data leakage in any user flow
5. Platform runs entirely on documented free-tier services
