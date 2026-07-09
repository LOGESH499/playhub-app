# Software Requirements Specification (SRS)

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Status:** Draft — Pre-Development  
**Last Updated:** 2026-07-09

---

## 1. Introduction

This document defines functional and non-functional requirements for PLAYHUB — a real-time multi-sports slot booking and academy management SaaS platform.

### 1.1 References

- [Business Requirements](./business-requirements.md)
- [Architecture](./architecture.md)
- [Database Design](./database-design.md)
- [API Design](./api-design.md)

---

## 2. System Overview

PLAYHUB is a multi-tenant web application:

- **Public layer:** Discovery, venue profiles, slot search, academy listings
- **Player portal:** Bookings, enrollments, profile, history
- **Venue dashboard:** Resource management, bookings, staff, pricing
- **Academy dashboard:** Batches, coaches, students, attendance
- **Platform admin:** Tenant management, sport templates, system config

---

## 3. Functional Requirements

### 3.1 Authentication & User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Users MUST register/login via email/password (Supabase Auth) | MUST |
| FR-AUTH-02 | Users MUST be able to reset password via email | MUST |
| FR-AUTH-03 | Users MAY sign in with magic link | SHOULD |
| FR-AUTH-04 | System MUST support OAuth (Google) when configured in Supabase | MAY |
| FR-AUTH-05 | User profile MUST include name, phone, avatar, emergency contact | MUST |
| FR-AUTH-06 | Parent/guardian profile MUST link to minor student accounts | SHOULD |

### 3.2 Multi-Tenancy & Organization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-TEN-01 | Tenant admin MUST create and configure an organization (venue group) | MUST |
| FR-TEN-02 | Tenant MUST have slug, branding (logo, colors), contact info | MUST |
| FR-TEN-03 | Tenant MUST invite staff via email with role assignment | MUST |
| FR-TEN-04 | User MUST switch active tenant context in UI | MUST |
| FR-TEN-05 | Platform super-admin MUST list/suspend tenants | MUST |

### 3.3 Venue & Resource Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-VEN-01 | Admin MUST create venues with address, geo coordinates, amenities | MUST |
| FR-VEN-02 | Admin MUST define bookable resources per sport (courts, lanes, pitches) | MUST |
| FR-VEN-03 | Resources MUST support sport type, capacity, surface, indoor/outdoor | MUST |
| FR-VEN-04 | Operating hours MUST be configurable per venue and per resource | MUST |
| FR-VEN-05 | Blackout dates and maintenance blocks MUST prevent booking | MUST |
| FR-VEN-06 | Venue MUST display on Leaflet map in discovery | MUST |

### 3.4 Slot Booking Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BOOK-01 | System MUST generate bookable slots from operating hours and duration rules | MUST |
| FR-BOOK-02 | Availability MUST update in real time across all clients | MUST |
| FR-BOOK-03 | Booking MUST atomically reserve slot (no race conditions) | MUST |
| FR-BOOK-04 | Player MUST search by sport, date, location, venue | MUST |
| FR-BOOK-05 | Player MUST filter by price range, amenities, distance | SHOULD |
| FR-BOOK-06 | Recurring booking MUST create series with conflict detection | SHOULD |
| FR-BOOK-07 | Staff MUST create/modify/cancel bookings on behalf of players | MUST |
| FR-BOOK-08 | Booking status: pending, confirmed, cancelled, completed, no-show | MUST |
| FR-BOOK-09 | Waitlist MUST be offered when slot is full (sport-dependent) | MAY |

### 3.5 Pricing & Packages

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PRICE-01 | Pricing rules MUST support peak/off-peak, weekday/weekend | MUST |
| FR-PRICE-02 | Sport-specific and resource-specific pricing MUST be supported | MUST |
| FR-PRICE-03 | Membership packages MUST grant credits or discounted rates | SHOULD |
| FR-PRICE-04 | Promo codes MUST apply percentage or fixed discount | SHOULD |
| FR-PRICE-05 | Tax/GST fields MUST be configurable per tenant | SHOULD |

### 3.6 Academy Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ACAD-01 | Admin MUST create academy programs by type (6 academy types) | MUST |
| FR-ACAD-02 | Admin MUST define batches with schedule, capacity, age group, level | MUST |
| FR-ACAD-03 | Coach MUST be assignable to one or more batches | MUST |
| FR-ACAD-04 | Student enrollment MUST check capacity and prerequisites | MUST |
| FR-ACAD-05 | Attendance MUST be marked per session (present, absent, late) | MUST |
| FR-ACAD-06 | Session plans and notes MUST be attachable to batch sessions | SHOULD |
| FR-ACAD-07 | Progress/skills tracking per student | MAY (v2) |

### 3.7 Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NOTIF-01 | In-app notifications MUST be delivered via Supabase Realtime | MUST |
| FR-NOTIF-02 | Email notifications for booking confirmation (Supabase Auth email / Edge Function) | SHOULD |
| FR-NOTIF-03 | Notification preferences per user | SHOULD |

### 3.8 Reporting & Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REP-01 | Venue dashboard MUST show bookings by sport, revenue (recorded), utilization | MUST |
| FR-REP-02 | Academy dashboard MUST show enrollment, attendance rate | MUST |
| FR-REP-03 | Charts via Recharts: trends, pie by sport, heatmap by hour | SHOULD |
| FR-REP-04 | CSV export for bookings and attendance | SHOULD |

### 3.9 Media & Storage

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-MEDIA-01 | Venue/academy images MUST upload to Supabase Storage | MUST |
| FR-MEDIA-02 | Avatar uploads with size limits (max 2MB) | MUST |
| FR-MEDIA-03 | RLS MUST restrict storage access by tenant | MUST |

### 3.10 Supported Sports (Data Model)

The system MUST support these sport enums:

**Slot Sports:** `football`, `cricket`, `cricket_nets`, `pickleball`, `badminton`, `tennis`, `squash`, `basketball`, `volleyball`, `swimming`

**Academy Types:** `running_academy`, `football_academy`, `cricket_academy`, `tennis_academy`, `swimming_academy`, `badminton_academy`

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | Initial page load (LCP) | < 2.5s on 4G |
| NFR-PERF-02 | Slot search response | < 500ms p95 |
| NFR-PERF-03 | Real-time availability propagation | < 2s |
| NFR-PERF-04 | Concurrent booking handling | 50 simultaneous per venue |

### 4.2 Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCALE-01 | Schema MUST support 1,000+ tenants without redesign |
| NFR-SCALE-02 | Horizontal scaling via Vercel serverless and Supabase connection pooler |
| NFR-SCALE-03 | Pagination REQUIRED on all list endpoints |

### 4.3 Availability & Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-AVAIL-01 | Uptime (free tier best effort) | 99.5% |
| NFR-AVAIL-02 | Graceful degradation if Realtime disconnects | MUST |
| NFR-AVAIL-03 | Idempotent booking API | MUST |

### 4.4 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | All data access via RLS policies |
| NFR-SEC-02 | HTTPS only |
| NFR-SEC-03 | CSRF protection on mutations |
| NFR-SEC-04 | Input validation via Zod on client and server |
| NFR-SEC-05 | Audit log for admin actions |

See [Security Plan](./security-plan.md) for full details.

### 4.5 Usability

| ID | Requirement |
|----|-------------|
| NFR-UX-01 | Mobile-first responsive design |
| NFR-UX-02 | WCAG 2.1 AA contrast targets |
| NFR-UX-03 | Keyboard navigable forms |
| NFR-UX-04 | Loading and error states on all async operations |

### 4.6 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-MAINT-01 | TypeScript strict mode |
| NFR-MAINT-02 | Shared Zod schemas between API and forms |
| NFR-MAINT-03 | Conventional commits and PR-based workflow |
| NFR-MAINT-04 | Environment-based configuration (.env) |

### 4.7 Compatibility

| ID | Requirement |
|----|-------------|
| NFR-COMPAT-01 | Chrome, Firefox, Safari, Edge (last 2 versions) |
| NFR-COMPAT-02 | iOS Safari 15+, Android Chrome 100+ |

---

## 5. External Interfaces

| Interface | Technology | Purpose |
|-----------|------------|---------|
| Supabase Auth | JWT | Authentication |
| Supabase PostgreSQL | SQL + RLS | Primary datastore |
| Supabase Realtime | WebSocket | Live updates |
| Supabase Storage | S3-compatible | File uploads |
| Supabase Edge Functions | Deno | Webhooks, batch jobs |
| OpenStreetMap / Leaflet | Free tiles | Maps (no Google Maps API) |
| Vercel | Hosting | Next.js deployment |

---

## 6. Data Requirements

- All primary keys: UUID v4
- Timestamps: `timestamptz` UTC
- Soft delete via `deleted_at` where applicable
- Full schema: [Database Tables](./database-tables.md)

---

## 7. State Machines

### 7.1 Booking Status

```
pending → confirmed → completed
         ↘ cancelled
confirmed → no_show
```

### 7.2 Enrollment Status

```
pending → active → completed
         ↘ cancelled / suspended
```

---

## 8. Traceability Matrix (Sample)

| Business Rule | Software Requirement |
|---------------|---------------------|
| BR-BOOK-01 | FR-BOOK-03, NFR-SEC-01 |
| BR-ACAD-02 | FR-ACAD-04 |
| BR-TEN-01 | FR-TEN-01, NFR-SEC-01 |

---

## 9. Open Questions

| # | Question | Owner |
|---|----------|-------|
| OQ-01 | Payment gateway for v2 — Razorpay vs Stripe India? | Product |
| OQ-02 | SMS OTP via free tier workaround? | Engineering |
| OQ-03 | Multi-language (Hindi) in v1? | Product |
