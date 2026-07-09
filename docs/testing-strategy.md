# Testing Strategy

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Testing Objectives

| Objective | Description |
|-----------|-------------|
| **Correctness** | Booking and enrollment business rules enforced |
| **Security** | RLS policies prevent unauthorized access |
| **Reliability** | No double-bookings under concurrent load |
| **Regression** | Critical paths protected by automated tests |
| **Confidence** | Safe to deploy from main branch |

---

## 2. Test Pyramid

```
                    ┌───────────┐
                    │    E2E    │  ~10% — Critical user journeys
                    │ Playwright│
                   ┌┴───────────┴┐
                   │ Integration │  ~20% — API + DB + RLS
                   │  Vitest     │
                  ┌┴─────────────┴┐
                  │     Unit      │  ~70% — Domain logic, validators
                  │    Vitest     │
                  └───────────────┘
```

---

## 3. Testing Tools

| Tool | Purpose | Cost |
|------|---------|------|
| **Vitest** | Unit and integration tests | Free |
| **Playwright** | E2E browser tests | Free |
| **Testing Library** | React component tests | Free |
| **MSW** | API mocking in unit tests | Free |
| **Supabase CLI** | Local DB for integration tests | Free |
| **GitHub Actions** | CI test runner | Free |

No paid testing services (BrowserStack, etc.) in v1.

---

## 4. Unit Tests

### 4.1 Scope

| Module | Test Focus |
|--------|------------|
| `slot-generator.ts` | Slot generation from operating hours |
| `pricing-calculator.ts` | Peak/off-peak, promo, package credits |
| `conflict-detector.ts` | Overlap detection |
| `enrollment-validator.ts` | Capacity, age group, duplicate enrollment |
| `*.schema.ts` (Zod) | Valid/invalid input boundaries |
| `date.ts`, `currency.ts` | Utility functions |

### 4.2 Example Test Cases — Slot Generator

```typescript
describe('generateSlots', () => {
  it('generates 60-min slots for 6am-10pm with no gaps');
  it('respects blackout periods');
  it('marks booked slots as unavailable');
  it('marks active holds as held');
  it('handles resource-specific hours overriding venue hours');
  it('returns empty for closed days');
});
```

### 4.3 Example Test Cases — Pricing Calculator

```typescript
describe('calculatePrice', () => {
  it('applies peak pricing on weekday evenings');
  it('applies weekend pricing');
  it('applies resource-specific rule over venue-wide rule');
  it('applies promo code percentage discount');
  it('applies membership package credit');
  it('never returns negative price');
});
```

### 4.4 Coverage Targets

| Area | Target |
|------|--------|
| Domain logic (`src/lib/domain/`) | ≥ 90% |
| Validators (`src/lib/validators/`) | ≥ 95% |
| UI components | ≥ 60% (critical paths) |
| Overall project | ≥ 70% |

---

## 5. Integration Tests

### 5.1 Scope

- API route handlers (`/api/v1/*`)
- PostgreSQL RPC functions (`create_booking`, `create_enrollment`)
- RLS policy verification
- Repository layer queries

### 5.2 Test Environment

```bash
# Start local Supabase
supabase start

# Run integration tests
pnpm test:integration
```

Integration tests use local Supabase with seed data. Each test suite runs in a transaction or resets relevant tables.

### 5.3 RLS Test Pattern

```typescript
describe('bookings RLS', () => {
  it('tenant A admin can read tenant A bookings');
  it('tenant A admin cannot read tenant B bookings');
  it('player can read own bookings only');
  it('anonymous user cannot read any bookings');
  it('staff can create booking on behalf of player');
  it('coach cannot delete bookings');
});
```

### 5.4 Booking Integration Tests

| Test | Expected |
|------|----------|
| Create booking on available slot | 201, status confirmed |
| Create booking on booked slot | 409 conflict |
| Concurrent booking same slot | Exactly one succeeds |
| Create booking with valid hold | Hold deleted, booking created |
| Create booking with expired hold | 409 or new hold required |
| Cancel within policy | Status cancelled |
| Cancel outside policy | 422 with policy message |

### 5.5 Academy Integration Tests

| Test | Expected |
|------|----------|
| Enroll in batch with capacity | 201, status active |
| Enroll in full batch | 422 capacity exceeded |
| Duplicate active enrollment | 409 |
| Mark attendance bulk | All records upserted |
| Coach marks attendance for unassigned batch | 403 |

---

## 6. End-to-End Tests (Playwright)

### 6.1 Critical Paths (MUST pass before release)

| ID | Flow | Priority |
|----|------|----------|
| E2E-01 | Register → verify → login | P0 |
| E2E-02 | Onboarding → create tenant → create venue | P0 |
| E2E-03 | Player discovers venue → books slot → sees in my-bookings | P0 |
| E2E-04 | Staff quick booking for walk-in | P0 |
| E2E-05 | Real-time slot update (two browser contexts) | P1 |
| E2E-06 | Academy enrollment flow | P1 |
| E2E-07 | Coach marks attendance | P1 |
| E2E-08 | Staff invite accept flow | P1 |
| E2E-09 | Booking cancellation | P1 |
| E2E-10 | Tenant switcher | P2 |

### 6.2 E2E Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 6.3 E2E Test Data

- Use `supabase/seed.sql` for deterministic test users and venues
- Test accounts:
  - `owner@test.playhub` — tenant owner
  - `staff@test.playhub` — front desk
  - `coach@test.playhub` — academy coach
  - `player@test.playhub` — end user

### 6.4 Realtime E2E Strategy

Realtime tests are inherently flaky. Strategy:

1. Primary: verify booking succeeds and page refetches show updated state
2. Secondary: use `waitForResponse` on slot API after action in second context
3. Fallback: mark as manual QA if flaky > 10%

---

## 7. Component Tests

### 7.1 Scope

Test critical interactive components in isolation:

- `SlotPicker` — renders slots, handles selection, shows states
- `BookingCard` — displays correct status badges
- `AttendanceList` — toggle present/absent
- `TenantSwitcher` — lists tenants, calls switch handler
- Form components — validation messages display

### 7.2 Tools

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

---

## 8. Performance Testing

### 8.1 Approach (Free)

| Test | Tool | Target |
|------|------|--------|
| Lighthouse CI | GitHub Action | Perf > 80, A11y > 90 |
| Slot API load | `k6` local script | p95 < 500ms at 50 VUs |
| Concurrent bookings | Integration test with `Promise.all` | 0 conflicts |

### 8.2 k6 Script (Local)

```javascript
// tests/load/slots.js
import http from 'k6/http';
import { check } from 'k6';

export const options = { vus: 50, duration: '30s' };

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/v1/slots?venue_id=...&date=2026-07-10`);
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

Run manually before major releases — not in every CI run.

---

## 9. Security Testing

| Test | Method | Frequency |
|------|--------|-----------|
| RLS cross-tenant access | Integration tests | Every PR |
| Service role not in bundle | Build artifact grep | Every PR |
| `pnpm audit` | CI | Every PR |
| OWASP top 10 checklist | Manual | Pre-launch |
| Auth flow bypass | Manual pen test | Pre-launch |

### 9.1 RLS Test Matrix

Automated tests for each table with contexts:
- `anon` (no JWT)
- `player` (authenticated, no tenant role)
- `staff`, `admin`, `owner` (tenant roles)
- `platform_admin`
- `other_tenant_admin` (cross-tenant attempt — must fail)

---

## 10. CI Pipeline Integration

```yaml
# .github/workflows/ci.yml (test jobs)
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:unit --coverage

  integration:
    runs-on: ubuntu-latest
    services:
      # Use supabase start in script
    steps:
      - run: supabase start
      - run: pnpm test:integration

  e2e:
    runs-on: ubuntu-latest
    steps:
      - run: supabase start
      - run: pnpm build
      - run: pnpm test:e2e
```

**PR requirements:** unit + integration MUST pass. E2E runs on main merge or nightly if too slow for PRs.

---

## 11. Manual QA Checklists

### 11.1 Pre-Release Smoke Test (15 min)

- [ ] Landing page loads
- [ ] Login/logout works
- [ ] Create booking as player
- [ ] Dashboard loads with correct KPIs
- [ ] Staff booking works
- [ ] Mobile responsive check (375px viewport)
- [ ] Dark mode toggle works

### 11.2 Sport Coverage Check

Verify slot booking UI renders correctly for each sport:
- [ ] Football (pitch)
- [ ] Cricket (ground)
- [ ] Cricket Nets (net bay)
- [ ] Pickleball, Badminton, Tennis, Squash (courts)
- [ ] Basketball, Volleyball (courts)
- [ ] Swimming (lanes)

### 11.3 Academy Coverage Check

- [ ] Running Academy enrollment
- [ ] Football Academy enrollment
- [ ] Cricket Academy enrollment
- [ ] Tennis Academy enrollment
- [ ] Swimming Academy enrollment
- [ ] Badminton Academy enrollment

---

## 12. Bug Severity Classification

| Severity | Definition | SLA |
|----------|------------|-----|
| **S0 — Critical** | Data breach, double-booking in production, auth bypass | Fix immediately |
| **S1 — High** | Core flow broken (cannot book, cannot login) | Fix within 24h |
| **S2 — Medium** | Feature degraded, workaround exists | Fix within 1 week |
| **S3 — Low** | Cosmetic, minor UX | Backlog |

---

## 13. Test Data Management

| Environment | Data Source |
|-------------|-------------|
| Local | `supabase db reset` + `seed.sql` |
| CI | Fresh Supabase local per run |
| Staging | Anonymized copy or seed |
| Production | No test data — real users only |

**Rule:** Never use production credentials in tests. Never run destructive tests against production.

---

## 14. Definition of Test Done

A feature is test-complete when:

- [ ] Unit tests for domain logic
- [ ] Zod schema tests for new inputs
- [ ] Integration tests for API endpoints and RLS
- [ ] E2E test if user-facing critical path
- [ ] Manual QA checklist item added if not automatable
- [ ] No regression in existing test suite

---

## 15. Related Documents

- [Software Requirements](./software-requirements.md)
- [Security Plan](./security-plan.md)
- [Deployment Guide](./deployment-guide.md)
- [Milestones](./milestones.md)
- [Sprint Plan](./sprint-plan.md)
