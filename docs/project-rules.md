# PLAYHUB — Project Rules

**Version:** 1.0  
**Last Updated:** 2026-07-09  
**Status:** Active — applies to all development

---

## 1. Purpose

This document defines mandatory engineering standards for PLAYHUB. All modules, PRs, and AI-assisted development must follow these rules.

Cursor rules are also enforced via `.cursor/rules/` for persistent IDE guidance.

---

## 2. Technology Stack

### 2.1 Required

| Layer | Technology |
|-------|------------|
| Language | TypeScript (strict mode) |
| Framework | Next.js 16+ (App Router only) |
| UI | React 19, Tailwind CSS, Shadcn UI |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Icons | Lucide React |
| Deployment | Vercel (Free Tier) |

### 2.2 Forbidden

| Technology | Reason |
|------------|--------|
| Firebase | Stack constraint — use Supabase |
| Clerk | Stack constraint — use Supabase Auth |
| AWS / Azure / Google Cloud | Cost constraint |
| Paid third-party APIs | Cost constraint — use free/open alternatives |

**Approved free alternatives:** OpenStreetMap + Leaflet (maps), Supabase email (auth), Vercel Analytics.

---

## 3. Architecture Principles

### 3.1 Clean Architecture Layers

```
Presentation   →  src/app/, src/components/, src/features/*/components/
Application    →  src/features/*/actions/, src/app/api/
Domain         →  src/lib/domain/          (pure business logic)
Infrastructure →  src/lib/supabase/, src/lib/repositories/
```

### 3.2 SOLID Applied

| Principle | PLAYHUB Implementation |
|-----------|------------------------|
| **S**ingle Responsibility | One feature module per domain (booking, academy, auth) |
| **O**pen/Closed | Extend via sport templates and config, not hard forks |
| **L**iskov Substitution | Repository interfaces swappable for testing |
| **I**nterface Segregation | Small, focused hooks and server actions |
| **D**ependency Inversion | UI depends on domain types, not Supabase client directly |

### 3.3 Feature-Based Structure

```
src/features/{module}/
├── components/     # UI scoped to this feature
├── hooks/          # Client hooks (data, realtime)
├── actions/        # Server actions
└── index.ts        # Public API of the feature
```

**Rule:** Do not import across features except through `index.ts` or shared `src/lib/`.

### 3.4 Server Components First

- **Default:** Server Components for pages, layouts, and data fetching
- **Client Components:** Only when using hooks, browser APIs, or event handlers
- Mark with `"use client"` at the top of the file
- Keep client boundary as low in the tree as possible

### 3.5 No Duplicate Code

- Extract shared UI to `src/components/`
- Extract shared validation to `src/lib/validators/`
- Extract shared business logic to `src/lib/domain/`
- Extract shared data access to `src/lib/repositories/`

---

## 4. Data & Security

### 4.1 Supabase

- Browser client: `src/lib/supabase/client.ts`
- Server client: `src/lib/supabase/server.ts`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- **RLS is mandatory** on all tenant-scoped tables
- Migrations versioned in `supabase/migrations/`

### 4.2 Validation

- **Zod** for all external input (forms, API bodies, search params)
- Schemas live in `src/lib/validators/`
- Same schema used on client (React Hook Form) and server (actions/API)

### 4.3 React Hook Form

- Use for all interactive forms (login, booking, venue CRUD, etc.)
- Resolver: `zodResolver(schema)` from `@hookform/resolvers/zod`
- Server actions receive `FormData` or typed objects validated with Zod

> **Note:** Module 1 (Authentication) uses `useActionState` + server actions. New modules must use React Hook Form. Auth forms may be migrated in a polish pass without breaking behavior.

---

## 5. UI/UX Standards

### 5.1 Responsive Design

- Mobile-first Tailwind breakpoints: `sm`, `md`, `lg`, `xl`
- Test at 375px (mobile), 768px (tablet), 1280px (desktop)
- Use Shadcn `Sheet` for mobile navigation; sidebar on desktop

### 5.2 Dark Mode

- CSS variables defined in `src/app/globals.css` (`.dark` class)
- Theme provider via `next-themes` on root layout
- All new components must work in light and dark mode

### 5.3 States

Every async UI must handle:

- **Loading** — skeleton or spinner
- **Error** — user-friendly message + retry where applicable
- **Empty** — CTA to first action

### 5.4 Accessibility

- Semantic HTML and Shadcn accessible primitives
- Form labels linked to inputs
- WCAG 2.1 AA contrast targets

---

## 6. Performance

| Practice | Requirement |
|----------|-------------|
| Pagination | All list queries paginated (default 20, max 100) |
| Images | Next.js `Image` component; WebP; size limits on upload |
| Code splitting | Dynamic import for Leaflet, Recharts |
| Realtime | Subscribe only to active channels; unsubscribe on unmount |
| Caching | RSC cache / React Query per architecture doc |
| Bundle | No unnecessary client components |

---

## 7. Development Process

### 7.1 Module-by-Module Delivery

Build in this order — never generate the entire application at once:

1. Authentication ✅  
2. Database  
3. Dashboard  
4. Sports Management  
5. Venue Management  
6. Court Management  
7. Slot Management  
8. Real-Time Booking  
9. Academy Management  
10. Coach Management  
11. Membership  
12. Payment  
13. Notifications  
14. Reports  
15. Admin Panel  
16. Deployment  

### 7.2 After Every Module

- [ ] Update `TASKS.md` — mark completed items
- [ ] Update `ROADMAP.md` — progress percentage
- [ ] Update `README.md` — features and setup if changed
- [ ] Update relevant `/docs` if architecture or API changed
- [ ] Verify `npm run build` passes (Vercel deployable)
- [ ] Never remove working code — extend safely

### 7.3 Major Architecture Decisions

Document in module PR/commit or `docs/architecture.md` when:

- Adding a new external dependency
- Changing data model or RLS strategy
- Introducing a new API pattern
- Deviating from these rules (requires justification)

---

## 8. Code Quality

| Rule | Standard |
|------|----------|
| TypeScript | `strict: true`; no `any` without comment |
| Linting | ESLint + `eslint-config-next` — must pass in CI |
| Naming | kebab-case files, PascalCase components, camelCase functions |
| Imports | Use `@/` path aliases |
| Comments | Only for non-obvious business logic |
| Tests | Domain logic and validators tested; E2E for critical paths |

---

## 9. Related Documents

- [Architecture](./architecture.md)
- [Folder Structure](./folder-structure.md)
- [Security Plan](./security-plan.md)
- [ROADMAP.md](../ROADMAP.md)
- [TASKS.md](../TASKS.md)

---

## 10. Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-07-09 | 1.0 | Initial project rules established |
