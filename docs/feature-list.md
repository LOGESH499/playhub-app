# Feature List

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Feature Summary

| Module | Features | v1 | v2 |
|--------|----------|:--:|:--:|
| Core & Auth | 12 | 10 | 2 |
| Venue Management | 14 | 12 | 2 |
| Slot Booking | 16 | 14 | 2 |
| Pricing & Commerce | 10 | 7 | 3 |
| Academy Management | 14 | 12 | 2 |
| Dashboard & Reports | 10 | 8 | 2 |
| Platform Admin | 6 | 5 | 1 |
| Notifications | 5 | 3 | 2 |
| **Total** | **87** | **71** | **16** |

---

## 2. Core & Authentication

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| F-AUTH-01 | Email/password registration | MUST | v1 |
| F-AUTH-02 | Email verification | MUST | v1 |
| F-AUTH-03 | Login / logout | MUST | v1 |
| F-AUTH-04 | Password reset | MUST | v1 |
| F-AUTH-05 | User profile (name, phone, avatar) | MUST | v1 |
| F-AUTH-06 | Magic link login | SHOULD | v1 |
| F-AUTH-07 | Google OAuth | MAY | v1 |
| F-AUTH-08 | Guardian-minor account linking | SHOULD | v1 |
| F-AUTH-09 | Multi-tenant membership | MUST | v1 |
| F-AUTH-10 | Tenant context switcher | MUST | v1 |
| F-AUTH-11 | Staff invite via email | MUST | v1 |
| F-AUTH-12 | Two-factor authentication | MAY | v2 |

---

## 3. Venue Management

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| F-VEN-01 | Create/edit/delete venues | MUST | v1 |
| F-VEN-02 | Venue slug and SEO-friendly URLs | MUST | v1 |
| F-VEN-03 | Address with geo coordinates | MUST | v1 |
| F-VEN-04 | Leaflet map on venue profile | MUST | v1 |
| F-VEN-05 | Image gallery (Supabase Storage) | MUST | v1 |
| F-VEN-06 | Amenities tags (parking, showers, etc.) | MUST | v1 |
| F-VEN-07 | Publish/unpublish venue | MUST | v1 |
| F-VEN-08 | Resource (court/lane/pitch) CRUD | MUST | v1 |
| F-VEN-09 | Sport type per resource | MUST | v1 |
| F-VEN-10 | Operating hours (venue + resource level) | MUST | v1 |
| F-VEN-11 | Blackout periods / maintenance | MUST | v1 |
| F-VEN-12 | Multi-sport venue support | MUST | v1 |
| F-VEN-13 | Venue search with filters | MUST | v1 |
| F-VEN-14 | Distance-based sorting (geo) | SHOULD | v2 |

---

## 4. Slot Booking Engine

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| F-BOOK-01 | Dynamic slot generation from hours | MUST | v1 |
| F-BOOK-02 | Real-time availability display | MUST | v1 |
| F-BOOK-03 | Slot selection and checkout | MUST | v1 |
| F-BOOK-04 | Temporary slot hold (10 min) | MUST | v1 |
| F-BOOK-05 | Atomic booking (no double-book) | MUST | v1 |
| F-BOOK-06 | Booking confirmation screen | MUST | v1 |
| F-BOOK-07 | Player booking history | MUST | v1 |
| F-BOOK-08 | Booking cancellation (policy-aware) | MUST | v1 |
| F-BOOK-09 | Staff walk-in / phone booking | MUST | v1 |
| F-BOOK-10 | Book on behalf of another player | MUST | v1 |
| F-BOOK-11 | Booking status lifecycle | MUST | v1 |
| F-BOOK-12 | Recurring weekly bookings | SHOULD | v1 |
| F-BOOK-13 | Waitlist for full slots | MAY | v1 |
| F-BOOK-14 | No-show marking by staff | SHOULD | v1 |
| F-BOOK-15 | Sport-specific slot durations | MUST | v1 |
| F-BOOK-16 | iCal export | MAY | v2 |

### Supported Slot Sports

Football, Cricket, Cricket Nets, Pickleball, Badminton, Tennis, Squash, Basketball, Volleyball, Swimming

---

## 5. Pricing & Commerce

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| F-PRICE-01 | Peak/off-peak pricing rules | MUST | v1 |
| F-PRICE-02 | Weekday/weekend pricing | MUST | v1 |
| F-PRICE-03 | Per-sport and per-resource pricing | MUST | v1 |
| F-PRICE-04 | Promo codes | SHOULD | v1 |
| F-PRICE-05 | Membership packages (credits) | SHOULD | v1 |
| F-PRICE-06 | Manual payment recording (pay at venue) | MUST | v1 |
| F-PRICE-07 | Price display on slot grid | MUST | v1 |
| F-PRICE-08 | GST/tax line item | SHOULD | v2 |
| F-PRICE-09 | Online payment gateway | MUST | v2 |
| F-PRICE-10 | Invoice generation PDF | MAY | v2 |

---

## 6. Academy Management

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| F-ACAD-01 | Academy program CRUD | MUST | v1 |
| F-ACAD-02 | Academy public listing page | MUST | v1 |
| F-ACAD-03 | Batch creation with schedule | MUST | v1 |
| F-ACAD-04 | Age group and skill level | MUST | v1 |
| F-ACAD-05 | Coach assignment to batches | MUST | v1 |
| F-ACAD-06 | Student enrollment (self + staff) | MUST | v1 |
| F-ACAD-07 | Batch capacity enforcement | MUST | v1 |
| F-ACAD-08 | Batch session calendar | MUST | v1 |
| F-ACAD-09 | Attendance marking (bulk) | MUST | v1 |
| F-ACAD-10 | Attendance history per student | MUST | v1 |
| F-ACAD-11 | Session notes | SHOULD | v1 |
| F-ACAD-12 | Enrollment waitlist | MAY | v2 |
| F-ACAD-13 | Student progress tracking | MAY | v2 |
| F-ACAD-14 | Certificate generation | MAY | v2 |

### Supported Academy Types

Running Academy, Football Academy, Cricket Academy, Tennis Academy, Swimming Academy, Badminton Academy

---

## 7. Dashboard & Reports

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| F-DASH-01 | KPI overview cards | MUST | v1 |
| F-DASH-02 | Bookings trend chart (Recharts) | MUST | v1 |
| F-DASH-03 | Sport utilization pie chart | SHOULD | v1 |
| F-DASH-04 | Revenue summary (recorded payments) | MUST | v1 |
| F-DASH-05 | Academy enrollment stats | MUST | v1 |
| F-DASH-06 | Attendance rate chart | SHOULD | v1 |
| F-DASH-07 | Booking data table with filters | MUST | v1 |
| F-DASH-08 | CSV export | SHOULD | v1 |
| F-DASH-09 | Date range filter on reports | MUST | v1 |
| F-DASH-10 | Custom report builder | MAY | v2 |

---

## 8. Platform Administration

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| F-PLAT-01 | Tenant list and search | MUST | v1 |
| F-PLAT-02 | Suspend/activate tenant | MUST | v1 |
| F-PLAT-03 | Sport template management | MUST | v1 |
| F-PLAT-04 | Academy template management | MUST | v1 |
| F-PLAT-05 | Platform audit log viewer | SHOULD | v1 |
| F-PLAT-06 | Usage metrics dashboard | MAY | v2 |

---

## 9. Notifications

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| F-NOTIF-01 | In-app notification center | MUST | v1 |
| F-NOTIF-02 | Real-time notification delivery | MUST | v1 |
| F-NOTIF-03 | Booking confirmation email | SHOULD | v1 |
| F-NOTIF-04 | Notification preferences | SHOULD | v2 |
| F-NOTIF-05 | Push notifications (PWA) | MAY | v2 |

---

## 10. Cross-Cutting Features

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| F-X-01 | Mobile-responsive UI | MUST | v1 |
| F-X-02 | Dark mode | SHOULD | v1 |
| F-X-03 | Loading skeletons | MUST | v1 |
| F-X-04 | Error boundaries | MUST | v1 |
| F-X-05 | SEO meta tags on public pages | MUST | v1 |
| F-X-06 | Audit logging | MUST | v1 |
| F-X-07 | PWA manifest | MAY | v2 |
| F-X-08 | Internationalization (i18n) | MAY | v2 |

---

## 11. Feature Dependencies

```
Auth & Profiles
    └── Tenants & Roles
            ├── Venue Management
            │       └── Resources & Hours
            │               └── Pricing Rules
            │                       └── Slot Booking
            │                               └── Realtime
            └── Academy Programs
                    └── Batches
                            ├── Enrollment
                            └── Attendance
```

---

## 12. Out of Scope (Explicit)

- Native mobile apps
- Live scoring / tournament brackets
- Equipment rental inventory
- Social features (player matching, chat)
- Video coaching / live streams
- Paid third-party integrations
- Multi-language content management

---

## 13. Related Documents

- [Business Requirements](./business-requirements.md)
- [Software Requirements](./software-requirements.md)
- [Development Roadmap](./development-roadmap.md)
- [Sprint Plan](./sprint-plan.md)
