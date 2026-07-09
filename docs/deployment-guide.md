# Deployment Guide

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Overview

PLAYHUB deploys to **Vercel (Free/Hobby tier)** for the Next.js frontend and API routes, with **Supabase (Free tier)** for database, auth, storage, realtime, and edge functions.

**Total infrastructure cost at launch:** $0/month

---

## 2. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS+ | Runtime |
| pnpm | 9+ | Package manager |
| Supabase CLI | Latest | Migrations, local dev |
| Git | 2.x | Version control |
| Vercel CLI | Latest (optional) | CLI deploys |

### Accounts Required

- [GitHub](https://github.com) — Source repository (free)
- [Vercel](https://vercel.com) — Hosting (free hobby)
- [Supabase](https://supabase.com) — Backend (free tier)

---

## 3. Environment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Development   │     │     Staging     │     │   Production    │
│                 │     │                 │     │                 │
│ localhost:3000  │     │ *.vercel.app    │     │ playhub.app     │
│ supabase local  │     │ Supabase proj 2 │     │ Supabase proj 1 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Recommendation:** Use separate Supabase projects for production and staging. Local development uses Supabase CLI (`supabase start`).

---

## 4. Supabase Setup

### 4.1 Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Name: `playhub-production` (or `playhub-staging`)
4. Set strong database password — store in password manager
5. Region: closest to primary users (e.g., `ap-south-1` Mumbai if available, else `ap-southeast-1`)

### 4.2 Configure Auth

1. **Authentication → Providers → Email:** Enable
2. **Email confirmation:** Enable for production
3. **Site URL:** `https://your-domain.vercel.app`
4. **Redirect URLs:**
   - `https://your-domain.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (dev)
5. **Google OAuth (optional):** Configure with Google Cloud free OAuth credentials

### 4.3 Apply Migrations

```bash
# Link to remote project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push

# Seed sport templates (dev/staging)
supabase db execute -f supabase/seed.sql
```

### 4.4 Enable Realtime

Verify in Supabase Dashboard → Database → Replication that these tables are published:
- `bookings`
- `slot_holds`
- `notifications`
- `attendance_records`

### 4.5 Create Storage Buckets

In Supabase Dashboard → Storage:

| Bucket | Public | Max file size |
|--------|--------|---------------|
| `avatars` | Yes | 2 MB |
| `venue-media` | Yes | 5 MB |
| `academy-media` | Yes | 5 MB |

Apply storage RLS policies per [Security Plan](./security-plan.md).

### 4.6 Connection Pooling

For Vercel serverless, use the **Transaction pooler** connection string:

```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Set in Supabase Dashboard → Settings → Database → Connection Pooling.

---

## 5. Vercel Setup

### 5.1 Import Project

1. Push code to GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import `playhub` repository
4. Framework preset: **Next.js**
5. Root directory: `./`
6. Build command: `pnpm build`
7. Install command: `pnpm install`

### 5.2 Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Environments | Secret |
|----------|--------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **Yes** |
| `NEXT_PUBLIC_APP_URL` | All | No |

```env
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...  # Server only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5.3 Deploy

```bash
# Automatic: push to main branch triggers production deploy
git push origin main

# Manual via CLI
pnpm dlx vercel --prod
```

### 5.4 Custom Domain (Optional)

1. Vercel → Project → Settings → Domains
2. Add `playhub.app` (or your domain)
3. Configure DNS records as instructed by Vercel
4. Update Supabase Auth redirect URLs

---

## 6. Local Development Setup

```bash
# Clone repository
git clone <repo-url>
cd playhub

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local
# Fill in Supabase URL and anon key

# Start local Supabase (Docker required)
supabase start

# Apply migrations locally
supabase db reset

# Generate TypeScript types
pnpm supabase:types

# Start Next.js dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local Supabase Credentials

After `supabase start`, the CLI prints local URL and keys. Use these in `.env.local` for local development.

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
```

### 7.2 Deployment Flow

```
PR opened → Vercel Preview Deploy + CI checks
PR merged to main → Vercel Production Deploy
```

### 7.3 Database Migrations in CI

Migrations are **not** auto-applied on deploy. Manual process:

```bash
# After merging migration files
supabase link --project-ref <prod-ref>
supabase db push
```

For staging, apply to staging project first, verify, then production.

---

## 8. Edge Functions Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy send-booking-email

# Set secrets for edge functions
supabase secrets set RESEND_API_KEY=xxx  # Only if using free email API in future
```

**v1 Note:** Booking emails may use Supabase built-in email or a minimal Edge Function with Supabase's SMTP settings.

---

## 9. Free Tier Limits & Monitoring

### 9.1 Supabase Free Tier

| Resource | Limit | Monitor |
|----------|-------|---------|
| Database | 500 MB | Dashboard → Database |
| Auth MAU | 50,000 | Dashboard → Auth |
| Storage | 1 GB | Dashboard → Storage |
| Realtime | 2M messages/mo | Dashboard → Realtime |
| Edge Functions | 500K invocations | Dashboard → Functions |
| Bandwidth | 5 GB (egress) | Dashboard → Settings |

### 9.2 Vercel Free Tier

| Resource | Limit |
|----------|-------|
| Bandwidth | 100 GB/month |
| Serverless executions | 100K/month (Hobby) |
| Build minutes | 6,000/month |
| Preview deployments | Unlimited |

### 9.3 Alerts

- Weekly manual review of Supabase and Vercel dashboards
- Set calendar reminder at 80% of any limit
- Document upgrade path in [Architecture](./architecture.md)

---

## 10. Production Checklist

### Pre-Deploy
- [ ] All migrations applied to production Supabase
- [ ] Sport templates seeded
- [ ] Storage buckets created with RLS
- [ ] Realtime publication enabled
- [ ] Environment variables set in Vercel
- [ ] Supabase Auth site URL and redirects configured
- [ ] Email confirmation enabled

### Post-Deploy
- [ ] Smoke test: register → onboard → create venue → book slot
- [ ] Verify HTTPS on all routes
- [ ] Check Vercel Analytics for errors
- [ ] Verify Realtime works in production
- [ ] Test staff invite flow end-to-end
- [ ] Confirm service role key not exposed in client JS bundle

### Rollback Procedure
1. Vercel → Deployments → select previous deployment → **Promote to Production**
2. If migration issue: restore Supabase from backup (Dashboard → Database → Backups)
3. Communicate downtime if applicable

---

## 11. Backup & Recovery

| Data | Method | Frequency |
|------|--------|-----------|
| PostgreSQL | Supabase automatic daily backups (free: 7 days) | Daily |
| Storage | Supabase bucket replication (manual export) | Weekly |
| Code | GitHub repository | Every commit |

**Recovery RTO:** < 4 hours (manual restore from Supabase backup)  
**Recovery RPO:** < 24 hours (daily backup)

---

## 12. Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Auth redirect loop | Mismatched Site URL | Align Supabase Auth URLs with Vercel domain |
| RLS permission denied | Missing tenant_members row | Check user membership and policies |
| Realtime not updating | Table not in publication | Add to `supabase_realtime` publication |
| 500 on API routes | Missing service role key | Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel |
| Slow slot queries | Missing indexes | Apply index migration |
| CORS errors | Wrong APP_URL | Set `NEXT_PUBLIC_APP_URL` correctly |

---

## 13. Related Documents

- [Architecture](./architecture.md)
- [Security Plan](./security-plan.md)
- [Testing Strategy](./testing-strategy.md)
- [Database Design](./database-design.md)
