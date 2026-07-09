# Navigation Flow

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Route Map Overview

```
/                           Landing (public)
├── /sports/[sport]         Sport landing pages
├── /venues                 Venue discovery
│   └── /venues/[id]        Venue profile
│       └── /book           Booking flow
├── /academies              Academy discovery
│   └── /academies/[id]     Academy program page
├── /login, /register       Auth
├── /onboarding             New tenant setup
├── /invite/[token]         Staff invite acceptance
│
├── /my-bookings            Player portal
├── /my-academies           Player enrollments
├── /profile                User profile
│
├── /dashboard              Tenant dashboard home
├── /dashboard/bookings     Booking management
├── /dashboard/venues       Venue CRUD
├── /dashboard/academies    Academy management
├── /dashboard/members      Membership packages
├── /dashboard/staff        Staff management
├── /dashboard/reports      Analytics
├── /dashboard/settings     Org settings
│
└── /platform/*             Super-admin (isolated)
```

---

## 2. User Journey — Player Books a Court

```
Landing (/)
    │
    ├─► Search "badminton Mumbai"
    │       │
    │       ▼
    │   /venues?sport=badminton&city=mumbai
    │       │
    │       ├─► Map view — tap marker
    │       └─► List view — tap card
    │               │
    │               ▼
    │           /venues/[id]
    │               │
    │               ├─► Browse photos, amenities
    │               ├─► Select date
    │               ├─► Tap available slot
    │               │       │
    │               │       ├─► Not logged in? → /login?redirectTo=...
    │               │       └─► Logged in
    │               │               │
    │               │               ▼
    │               │           Checkout sheet
    │               │               │
    │               │               ├─► Apply promo (optional)
    │               │               ├─► Confirm
    │               │               ▼
    │               │           Booking confirmed
    │               │               │
    │               │               ▼
    │               │           /my-bookings
    │               │
    │               └─► Tab: Academies → /academies/[id] (alternate path)
    │
    └─► Direct link from marketing
```

---

## 3. User Journey — Venue Owner Onboarding

```
/register
    │
    ▼
Email verification
    │
    ▼
/onboarding
    │
    ├─► Step 1: Organization (name, slug, timezone)
    ├─► Step 2: First venue (address, map pin)
    ├─► Step 3: Add resources (courts, sports)
    └─► Step 4: Operating hours & pricing
            │
            ▼
    /dashboard
            │
            ├─► Publish venue (toggle is_published)
            ├─► Invite staff → email → /invite/[token]
            └─► Monitor first bookings
```

---

## 4. User Journey — Academy Enrollment

```
/academies
    │
    ▼
/academies/[id]
    │
    ├─► View batches
    ├─► Select batch with availability
    │       │
    │       ├─► Not logged in → /login
    │       └─► Logged in
    │               │
    │               ├─► Minor? → select ward profile
    │               ├─► Confirm enrollment
    │               ▼
    │           /my-academies
    │
    └─► Full batch → Join waitlist
```

---

## 5. User Journey — Coach Marks Attendance

```
/login (coach credentials)
    │
    ▼
/dashboard (tenant context auto-set)
    │
    ▼
/dashboard/academies/[id]/attendance
    │
    ├─► Select today's session
    ├─► Mark each student present/absent/late
    ├─► Add session notes
    └─► Save → notification to parents (future)
```

---

## 6. User Journey — Staff Walk-in Booking

```
/dashboard/bookings
    │
    ▼
[Quick Booking] or /dashboard/bookings/new
    │
    ├─► Search existing player OR create guest
    ├─► Select venue, date
    ├─► Tap slot on POS grid
    ├─► Select payment method (cash/UPI manual)
    └─► Confirm → booking appears on venue realtime board
```

---

## 7. Navigation Structure by Role

### 7.1 Public (Unauthenticated)

```
Header: Logo | Sports | Venues | Academies | Login | Register
Footer: About | Pricing | Privacy | Terms
```

### 7.2 Player (Authenticated, No Tenant Role)

```
Header: Logo | Explore | My Bookings | My Academies | Profile
Mobile: Bottom tabs — Home, Explore, Bookings, Academies, Profile
```

### 7.3 Tenant Staff (Dashboard)

```
Sidebar (desktop) / Drawer (mobile):
  - Dashboard
  - Bookings
  - Venues
  - Academies
  - Members
  - Staff (admin+)
  - Reports (manager+)
  - Settings (admin+)

Header: Tenant switcher | Notifications | Profile
```

### 7.4 Coach (Limited Dashboard)

```
Sidebar:
  - Dashboard (coach KPIs)
  - My Batches
  - Attendance
  - Schedule
  - Profile
```

### 7.5 Platform Admin

```
Sidebar:
  - Tenants
  - Sport Templates
  - Academy Templates
  - Audit Logs
  - System Settings
```

---

## 8. Route Protection Flow

```
Request → middleware.ts
              │
              ├─► Public route? → pass
              │
              ├─► Auth route + logged in? → redirect /dashboard
              │
              ├─► Protected route + no session? → /login?redirectTo=
              │
              ├─► Dashboard + no tenant? → /select-tenant
              │
              ├─► Platform route + not admin? → /403
              │
              └─► Pass to route handler
```

---

## 9. Deep Links & Query Parameters

| URL | Params | Purpose |
|-----|--------|---------|
| `/venues` | `sport`, `city`, `lat`, `lng`, `date` | Pre-filtered search |
| `/venues/[id]/book` | `date`, `resource_id` | Direct to slot |
| `/login` | `redirectTo` | Post-login redirect |
| `/invite/[token]` | — | Staff onboarding |
| `/academies/[id]` | `batch_id` | Highlight batch |

---

## 10. State Transitions — Booking Flow

```
Browse → Select Slot → Hold Created → Checkout → Confirmed
                  │                      │
                  └──── Hold expired ────┘ → Back to Browse
                  
Confirmed → Cancel (policy check) → Cancelled
Confirmed → Complete (auto after end_time) → Completed
Confirmed → No-show (staff action) → No Show
```

---

## 11. Tenant Context Switching

```
User clicks tenant switcher in header
    │
    ▼
Modal: list of tenants + roles
    │
    ▼
Select tenant
    │
    ▼
POST /api/v1/auth/switch-tenant
    │
    ▼
Cookie updated → navigate to /dashboard
    │
    ▼
All data queries scoped to new tenant_id
```

---

## 12. Error & Empty States Navigation

| State | Route | Action |
|-------|-------|--------|
| 404 | `/not-found` | Link to /venues |
| 403 | `/unauthorized` | Link to /dashboard or / |
| No bookings | `/my-bookings` | CTA → /venues |
| No venues (admin) | `/dashboard/venues` | CTA → Create venue |
| Session expired | any protected | Redirect /login |

---

## 13. Related Documents

- [Wireframes](./wireframes.md)
- [Authentication Flow](./authentication-flow.md)
- [User Roles](./user-roles.md)
- [Folder Structure](./folder-structure.md)
