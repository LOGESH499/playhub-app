# Folder Structure

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Overview

PLAYHUB uses a **single Next.js 16 monorepo** with feature-based organization inside `src/`. The App Router drives routing; domain logic is separated from UI and data access.

---

## 2. Root Directory

```
playhub/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint, typecheck, test on PR
│       └── deploy-preview.yml     # Optional preview checks
├── docs/                          # Project documentation (this folder)
├── public/
│   ├── icons/                     # PWA icons, favicons
│   ├── images/                    # Static marketing images
│   └── manifest.json              # PWA manifest (future)
├── src/
│   ├── app/                       # Next.js App Router
│   ├── components/                # Shared UI components
│   ├── features/                  # Feature modules (domain UI)
│   ├── hooks/                     # Shared React hooks
│   ├── lib/                       # Core libraries & utilities
│   ├── types/                     # Global TypeScript types
│   └── styles/                    # Global CSS, Tailwind entry
├── supabase/
│   ├── migrations/                # SQL migrations (versioned)
│   ├── functions/                 # Edge Functions (Deno)
│   ├── seed.sql                   # Dev seed data
│   └── config.toml                # Supabase local config
├── tests/
│   ├── unit/                      # Vitest unit tests
│   ├── integration/               # API integration tests
│   └── e2e/                       # Playwright E2E tests
├── .env.example                   # Environment template
├── .eslintrc.json
├── components.json                # Shadcn UI config
├── middleware.ts                  # Auth + tenant middleware
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 3. App Router (`src/app/`)

```
src/app/
├── (public)/                      # Public marketing & discovery
│   ├── layout.tsx
│   ├── page.tsx                   # Landing page
│   ├── sports/
│   │   └── [sport]/
│   │       └── page.tsx           # Sport-specific landing
│   ├── venues/
│   │   ├── page.tsx               # Venue search / map
│   │   └── [venueId]/
│   │       ├── page.tsx           # Venue profile
│   │       └── book/
│   │           └── page.tsx       # Booking flow
│   ├── academies/
│   │   ├── page.tsx
│   │   └── [academyId]/
│   │       └── page.tsx
│   ├── about/
│   ├── pricing/
│   ├── privacy/
│   └── terms/
├── (auth)/
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   └── callback/
│       └── route.ts               # OAuth / magic link callback
├── (dashboard)/                   # Authenticated tenant dashboard
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx               # Overview / KPIs
│   ├── bookings/
│   │   ├── page.tsx
│   │   └── [bookingId]/
│   │       └── page.tsx
│   ├── venues/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [venueId]/
│   │       ├── page.tsx
│   │       ├── resources/
│   │       │   └── page.tsx
│   │       ├── schedule/
│   │       │   └── page.tsx
│   │       └── pricing/
│   │           └── page.tsx
│   ├── academies/
│   │   ├── page.tsx
│   │   └── [academyId]/
│   │       ├── page.tsx
│   │       ├── batches/
│   │       │   └── page.tsx
│   │       └── attendance/
│   │           └── page.tsx
│   ├── members/
│   │   └── page.tsx
│   ├── staff/
│   │   └── page.tsx
│   ├── reports/
│   │   └── page.tsx
│   └── settings/
│       ├── page.tsx
│       ├── profile/
│       ├── organization/
│       └── billing/               # Future
├── (player)/                      # Player portal
│   ├── layout.tsx
│   ├── my-bookings/
│   │   └── page.tsx
│   ├── my-academies/
│   │   └── page.tsx
│   └── profile/
│       └── page.tsx
├── (platform)/                    # Super-admin only
│   ├── layout.tsx
│   ├── tenants/
│   │   └── page.tsx
│   ├── sports/
│   │   └── page.tsx
│   └── audit-logs/
│       └── page.tsx
├── api/
│   └── v1/
│       ├── bookings/
│       │   └── route.ts
│       ├── slots/
│       │   └── route.ts
│       ├── venues/
│       │   └── route.ts
│       ├── academies/
│       │   └── route.ts
│       └── webhooks/
│           └── route.ts
├── layout.tsx                     # Root layout
├── globals.css
├── not-found.tsx
└── error.tsx
```

---

## 4. Components (`src/components/`)

```
src/components/
├── ui/                            # Shadcn primitives (button, dialog, etc.)
├── layout/
│   ├── header.tsx
│   ├── footer.tsx
│   ├── sidebar.tsx
│   ├── mobile-nav.tsx
│   └── tenant-switcher.tsx
├── maps/
│   ├── venue-map.tsx              # Leaflet wrapper
│   └── venue-marker.tsx
├── charts/
│   ├── bookings-chart.tsx
│   ├── utilization-chart.tsx
│   └── attendance-chart.tsx
├── forms/
│   ├── form-field.tsx
│   └── phone-input.tsx
└── shared/
    ├── loading-spinner.tsx
    ├── empty-state.tsx
    ├── error-boundary.tsx
    ├── sport-icon.tsx
    └── data-table.tsx
```

---

## 5. Features (`src/features/`)

Feature folders encapsulate domain-specific UI and hooks. Each feature MAY include:

```
src/features/booking/
├── components/
│   ├── slot-calendar.tsx
│   ├── slot-picker.tsx
│   ├── booking-card.tsx
│   └── booking-summary.tsx
├── hooks/
│   ├── use-slots.ts
│   ├── use-create-booking.ts
│   └── use-booking-realtime.ts
└── index.ts                       # Public exports
```

**Planned feature modules:**

| Folder | Purpose |
|--------|---------|
| `auth/` | Login forms, auth guards |
| `tenant/` | Org settings, staff invites |
| `venue/` | Venue CRUD, resources, hours |
| `booking/` | Slot search, calendar, checkout |
| `pricing/` | Rules, packages, promos |
| `academy/` | Programs, batches, enrollment |
| `attendance/` | Session attendance UI |
| `notifications/` | In-app notification center |
| `reports/` | Dashboard widgets |
| `platform/` | Super-admin tools |

---

## 6. Library (`src/lib/`)

```
src/lib/
├── supabase/
│   ├── client.ts                  # Browser Supabase client
│   ├── server.ts                  # Server Component client
│   ├── middleware.ts              # Session refresh helper
│   └── admin.ts                   # Service role (server only)
├── domain/
│   ├── booking/
│   │   ├── slot-generator.ts
│   │   ├── conflict-detector.ts
│   │   └── pricing-calculator.ts
│   ├── academy/
│   │   └── enrollment-validator.ts
│   └── sports/
│       └── sport-config.ts        # Sport metadata & defaults
├── repositories/
│   ├── bookings.repository.ts
│   ├── venues.repository.ts
│   ├── academies.repository.ts
│   └── users.repository.ts
├── validators/
│   ├── auth.schema.ts
│   ├── booking.schema.ts
│   ├── venue.schema.ts
│   └── academy.schema.ts
├── constants/
│   ├── sports.ts                  # Sport enums & labels
│   ├── roles.ts
│   └── routes.ts
├── utils/
│   ├── cn.ts                      # Tailwind merge
│   ├── date.ts                    # date-fns helpers
│   ├── currency.ts
│   └── geo.ts                     # Haversine distance
└── query/
    ├── query-client.ts
    └── query-keys.ts
```

---

## 7. Types (`src/types/`)

```
src/types/
├── database.types.ts              # Generated from Supabase CLI
├── api.types.ts                   # API request/response types
└── index.ts
```

---

## 8. Supabase (`supabase/`)

```
supabase/
├── migrations/
│   ├── 00001_initial_schema.sql
│   ├── 00002_rls_policies.sql
│   ├── 00003_booking_functions.sql
│   └── 00004_realtime_publication.sql
├── functions/
│   ├── send-booking-email/
│   │   └── index.ts
│   └── expire-pending-bookings/
│       └── index.ts
├── seed.sql
└── config.toml
```

---

## 9. Tests (`tests/`)

```
tests/
├── unit/
│   ├── domain/
│   │   ├── slot-generator.test.ts
│   │   └── pricing-calculator.test.ts
│   └── validators/
│       └── booking.schema.test.ts
├── integration/
│   └── api/
│       └── bookings.test.ts
├── e2e/
│   ├── booking-flow.spec.ts
│   └── academy-enrollment.spec.ts
└── fixtures/
    └── mock-data.ts
```

---

## 10. Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `slot-calendar.tsx` |
| Components | PascalCase | `SlotCalendar` |
| Hooks | camelCase, `use` prefix | `useSlots` |
| Constants | SCREAMING_SNAKE | `SPORT_TYPES` |
| DB tables | snake_case plural | `bookings` |
| API routes | kebab-case | `/api/v1/bookings` |
| Env vars | SCREAMING_SNAKE | `NEXT_PUBLIC_SUPABASE_URL` |

---

## 11. Import Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

---

## 12. Related Documents

- [Architecture](./architecture.md)
- [API Design](./api-design.md)
- [Development Roadmap](./development-roadmap.md)
