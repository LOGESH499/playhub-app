# PLAYHUB

**Real-Time Multi-Sports Slot Booking & Academy Management Platform**

PLAYHUB is a production-ready SaaS platform that enables sports venues, academies, and players to discover facilities, book time slots in real time, manage memberships, run coaching programs, and operate multi-sport businesses from a single dashboard.

---

## Development Progress

| Module | Status |
|--------|--------|
| 1. Authentication (foundation) | ✅ Complete |
| 2. Database | ✅ Complete |
| 3. Auth + Organizations + Roles | ✅ Complete |
| 4. Dashboard | ✅ Complete |
| 5. Sports Management | ✅ Verified |
| 6. Venue Management | ✅ Verified |
| 7. Court Management | ✅ Verified |
| 8. Slot Management | ⬜ Next (pending verification) |

See [ROADMAP.md](./ROADMAP.md) and [TASKS.md](./TASKS.md) for full module tracking.

---

## Vision

To become the default operating system for grassroots and commercial sports facilities — from a single badminton court to a multi-sport complex with academies — using only free-tier, open-source technologies.

## Supported Sports & Programs

| Category | Sports / Programs |
|----------|-------------------|
| **Court & Field Sports** | Football, Cricket, Cricket Nets, Pickleball, Badminton, Tennis, Squash, Basketball, Volleyball |
| **Aquatic** | Swimming (lanes & pool slots) |
| **Academy Programs** | Running Academy, Football Academy, Cricket Academy, Tennis Academy, Swimming Academy, Badminton Academy |

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS, Shadcn UI |
| Forms & Validation | React Hook Form, Zod |
| Data Fetching | TanStack React Query (upcoming) |
| Icons & Maps | Lucide Icons, Leaflet Maps (upcoming) |
| Charts | Recharts (upcoming) |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions) |
| Deployment | Vercel (Free Tier) |

**Constraints:** No paid APIs. No Firebase, Clerk, AWS, Azure, or Google Cloud. Everything runs on Supabase Free and Vercel Free.

**Engineering standards:** See [Project Rules](./docs/project-rules.md) and `.cursor/rules/`.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- [Supabase](https://supabase.com) project (free tier)

### Setup

```bash
git clone <repository-url>
cd playhub
npm install
cp .env.example .env.local
```

Add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Apply migrations and seed data:

```bash
# Local (requires Docker + Supabase CLI)
supabase start
supabase db reset          # runs all migrations + seed.sql

# Remote
supabase link --project-ref your-project-ref
supabase db push
npm run db:seed            # optional demo venues
```

Regenerate TypeScript types after schema changes:

```bash
npm run supabase:types
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run supabase:types` | Generate DB types from local Supabase |
| `npm run db:push` | Push migrations to linked Supabase project |
| `npm run db:reset` | Reset local DB (migrations + seed) |
| `npm run db:seed` | Run seed.sql on linked project |
| `supabase db execute -f scripts/verify-modules-5-7.sql` | Verify Modules 5–7 schema after push |

## Current Features

### Module 1 — Authentication
- Email/password, magic link, password reset
- Protected routes, profile management

### Module 2 — Database
- 26-table multi-tenant PostgreSQL schema
- Row Level Security on all tables
- Atomic `create_booking()` RPC
- Sport & academy templates seeded
- See [DATABASE.md](./DATABASE.md) for full reference

### Module 3 — Auth, Organizations & Roles
- React Hook Form + Zod on all auth forms
- Multi-tenant context: organizations, tenant switcher, invite acceptance
- Roles: Super Admin, Venue Admin, Coach, Customer
- Platform admin area (`/platform`), enhanced middleware
- Email verification gate + resend verification

### Module 4 — Dashboard
- Enterprise shell: collapsible sidebar, command palette (⌘K), breadcrumbs
- Dark/light/system theme with semantic OKLCH design tokens (Geist)
- KPI statistics, Recharts analytics, recent activity, calendar
- Role-aware navigation and data queries
- Sonner toast notifications

### Module 5 — Sports Management
- Sports CRUD with categories, icons, images, booking rules
- Grid/list views, search, filters, pagination
- Venue assignment and default pricing sync
- Soft delete, archive, enable/disable, audit logs

### Module 6 — Venue Management
- Venue CRUD with status, address, and OpenStreetMap + Leaflet geo picker
- Amenities, gallery (Supabase Storage), working hours, holidays, blackouts
- Pricing rules per venue, search/filters, grid/list views
- Server actions, audit logs, RLS

### Module 7 — Court & Resource Management
- Court CRUD for all 11 resource types (turf, ground, nets, lanes, track, etc.)
- Capacity, surface, dimensions, equipment, photos (Supabase Storage)
- Availability hours, maintenance mode, blackouts, booking rules, pricing
- Search/filters, grid/list views, audit logs, RLS

### Module 8 — Slot Management

- Slot templates with daily/weekly/monthly recurrence and peak windows
- Slot generator (bulk + manual), calendar views (day/week/month/timeline/list)
- Availability engine: available, booked, blocked, maintenance, holiday, peak/off-peak
- Dynamic pricing via `pricing_rules` integration (peak, weekend, holiday, member)
- Bulk create/edit/delete/block/unblock/duplicate; maintenance & holiday blocks
- Conflict detection via `validate_slot_window` RPC + `slots_no_overlap` constraint
- Supabase Realtime on `slots` for multi-user sync
- Routes: `/slots`, `/slots/new`, `/slots/[id]/edit`, `/slots/templates`

After `supabase db push`, run:

```bash
supabase db execute -f scripts/verify-module-8.sql
```

### Enterprise UI System

Premium SaaS design layer (Linear / Stripe / Vercel inspired):

- **Design tokens** — OKLCH semantic colors, sidebar tokens, shadows, Geist typography
- **Shell** — Collapsible sidebar, command menu, breadcrumbs, sticky blurred topbar
- **Components** — Shadcn primitives, TanStack DataTable, Recharts, Sonner, cmdk
- **Pages** — Unified `PageHeader`, card hover states, polished auth & platform layouts
- **Modules styled** — Dashboard, Sports, Venues, Courts, Slots (no business logic changes)

### Modules 5–7 — Migration verification

Migrations `00014`–`00016` are idempotent and repair-safe after partial failures. After `supabase db push`, run:

```bash
supabase db execute -f scripts/verify-modules-5-7.sql
```

This checks tables, RLS policies, indexes, constraints, foreign keys, `court-media` storage, and realtime baseline.

## Documentation

| Resource | Description |
|----------|-------------|
| [DATABASE.md](./DATABASE.md) | Schema, ERD, migrations, RLS, setup |
| [Project Rules](./docs/project-rules.md) | **Mandatory** engineering standards |
| [ROADMAP.md](./ROADMAP.md) | Module-by-module delivery plan |
| [TASKS.md](./TASKS.md) | Detailed task checklists |
| [/docs](./docs/README.md) | Architecture & planning docs |

## Project Structure

```
playhub/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Shared UI (Shadcn-style)
│   ├── features/auth/         # Authentication
│   ├── features/dashboard/    # Dashboard shell & widgets
│   ├── features/organization/ # Tenants, roles, onboarding
│   ├── features/sports/       # Sports catalog
│   ├── features/venues/       # Venue management
│   ├── features/courts/       # Court & resource management
│   ├── features/slots/        # Slot management
│   └── lib/                   # Supabase, validators, auth helpers
├── src/components/ui/         # Shadcn UI primitives
├── supabase/migrations/       # 18 SQL migrations
├── supabase/seed.sql     # Sports + demo venues
├── DATABASE.md           # Database reference & ERD
├── docs/                 # Planning documentation
├── TASKS.md
└── ROADMAP.md
```

## Deploy on Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`)
4. Deploy

The app builds successfully without Supabase env vars (dashboard shows a configuration notice).

## License

TBD — to be defined before public release.
