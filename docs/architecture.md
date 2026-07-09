# System Architecture

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Architecture Overview

PLAYHUB follows a **Jamstack + BaaS** architecture: a Next.js 16 server-rendered and client-hydrated frontend on Vercel, with Supabase providing database, authentication, real-time subscriptions, storage, and optional edge functions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                        │
│  Browser (Mobile/Desktop)  │  PWA (future)                               │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼───────────────────────────────────────────┐
│                    VERCEL (Next.js 16 App Router)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Server       │  │ React 19     │  │ API Routes   │  │ Middleware   │ │
│  │ Components   │  │ Client UI    │  │ Route        │  │ Auth Guard   │ │
│  │ (RSC)        │  │ Shadcn/TW    │  │ Handlers     │  │ Tenant Ctx   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│  React Query │ React Hook Form │ Zod │ Leaflet │ Recharts                 │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Supabase Auth │   │ PostgreSQL +    │   │ Supabase        │
│ (JWT/Session) │   │ RLS Policies    │   │ Realtime        │
└───────────────┘   └─────────────────┘   └─────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │ Supabase Storage│
                    │ Edge Functions  │
                    └─────────────────┘
```

---

## 2. Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| **Multi-tenant by design** | `tenant_id` on all tenant-scoped tables + RLS |
| **Security at the database** | RLS as primary authorization layer |
| **Optimistic UI** | React Query mutations with rollback on conflict |
| **Server-first data** | RSC for initial loads; client for interactivity |
| **Type safety end-to-end** | Generated Supabase types + Zod schemas |
| **Free-tier conscious** | Pagination, selective Realtime channels, image optimization |

---

## 3. Layer Breakdown

### 3.1 Presentation Layer

- **Next.js App Router** with route groups: `(public)`, `(auth)`, `(dashboard)`, `(platform)`
- **Server Components** for SEO pages (venue discovery, landing)
- **Client Components** for interactive booking calendar, maps, charts
- **Shadcn UI** for accessible component primitives
- **Tailwind CSS** for design system tokens

### 3.2 Application Layer

- **Server Actions** for mutations where appropriate (form submissions)
- **API Route Handlers** (`/app/api/v1/*`) for complex operations and webhooks
- **Middleware** (`middleware.ts`) for session refresh, route protection, tenant slug resolution
- **React Query** for client-side cache, optimistic updates, background refetch

### 3.3 Domain Layer

- `src/lib/domain/` — Pure business logic (pricing calculation, slot generation, conflict detection)
- `src/lib/validators/` — Zod schemas shared across forms and API
- No direct Supabase calls from UI components — use service modules

### 3.4 Data Access Layer

- `src/lib/supabase/` — Browser client, server client, admin client (service role — server only)
- `src/lib/repositories/` — Typed query functions per aggregate (bookings, venues, academies)
- Database functions (PostgreSQL) for atomic booking transactions

### 3.5 Infrastructure Layer

- **Vercel:** Preview deployments per PR, production on main branch
- **Supabase:** Single project for MVP; branch databases for staging (optional)
- **Environment variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only)

---

## 4. Multi-Tenancy Model

**Pattern:** Shared database, shared schema, tenant isolation via `tenant_id` + RLS.

```
Platform
 └── Tenant (Organization)
      ├── Venues
      │    └── Resources (Courts/Lanes)
      ├── Academy Programs
      │    └── Batches
      ├── Staff Memberships
      └── Bookings / Enrollments
```

**Tenant resolution:**

1. Subdomain: `{tenant}.playhub.app` (future)
2. Path-based: `/t/{tenant_slug}/...` (v1)
3. Dashboard context switcher stores `active_tenant_id` in cookie/session

---

## 5. Key Architectural Decisions

### ADR-001: Supabase over custom backend

**Decision:** Use Supabase as BaaS instead of self-hosted Node API.  
**Rationale:** Free tier, built-in Auth/Realtime/RLS, faster MVP.  
**Trade-off:** Vendor coupling mitigated by standard PostgreSQL.

### ADR-002: Row Level Security as authorization source of truth

**Decision:** Enforce permissions in PostgreSQL RLS, not only in application code.  
**Rationale:** Defense in depth; direct API access still protected.

### ADR-003: Atomic booking via PostgreSQL function

**Decision:** `create_booking()` PL/pgSQL function with `SELECT ... FOR UPDATE`.  
**Rationale:** Prevents race conditions without paid queue services.

### ADR-004: React Query over Redux

**Decision:** TanStack Query for server state.  
**Rationale:** Built for async cache; less boilerplate.

### ADR-005: Leaflet + OpenStreetMap

**Decision:** No Google Maps API.  
**Rationale:** Free tiles; meets cost constraint.

---

## 6. Module Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PLAYHUB MODULES                       │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   Core      │   Booking   │   Academy   │   Platform    │
│   Auth      │   Engine    │   Mgmt      │   Admin       │
│   Tenants   │   Pricing   │   Batches   │   Analytics   │
│   Profiles  │   Calendar  │   Attendance│   Sports CFG  │
└─────────────┴─────────────┴─────────────┴───────────────┘
```

| Module | Responsibility |
|--------|----------------|
| **Core** | Auth, tenants, users, roles, notifications |
| **Booking** | Venues, resources, slots, bookings, waitlist |
| **Academy** | Programs, batches, enrollment, attendance |
| **Platform** | Super-admin, sport templates, system settings |

---

## 7. Request Flow — Slot Booking

```
Player → Search Slots (RSC + Query)
       → Select Slot (Client)
       → POST /api/v1/bookings (Route Handler)
       → Supabase RPC create_booking()
       → PostgreSQL (lock row, insert, commit)
       → Realtime broadcast (bookings channel)
       → All clients update availability
       → React Query invalidate slot cache
```

---

## 8. Caching Strategy

| Data | Cache | TTL |
|------|-------|-----|
| Sport list / static config | ISR / static | 24h |
| Venue public profile | RSC cache | 5 min |
| Slot availability | React Query + Realtime | Live |
| User session | Supabase cookie | Session |
| Dashboard aggregates | React Query | 1 min |

---

## 9. Error Handling

- **Zod validation errors** → 400 with field-level messages
- **RLS denial** → 403 Forbidden
- **Booking conflict** → 409 Conflict with alternative slots
- **Unhandled errors** → 500, logged to Vercel, generic user message

---

## 10. Observability (Free Tier)

- Vercel Analytics (free) for Web Vitals
- Supabase Dashboard for query performance and auth logs
- Structured `console.error` in API routes (upgrade to Sentry later)
- Custom `audit_logs` table for business-critical actions

---

## 11. Scalability Path

| Stage | Users | Approach |
|-------|-------|----------|
| MVP | < 5K MAU | Supabase free, Vercel hobby |
| Growth | 5K–50K | Supabase Pro, read replicas, CDN images |
| Scale | 50K+ | Partition bookings by tenant, dedicated Realtime channels per venue |

---

## 12. Related Documents

- [Folder Structure](./folder-structure.md)
- [Database Design](./database-design.md)
- [API Design](./api-design.md)
- [Real-Time Architecture](./realtime-architecture.md)
- [Authentication Flow](./authentication-flow.md)
- [Deployment Guide](./deployment-guide.md)
