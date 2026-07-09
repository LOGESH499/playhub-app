# Authentication Flow

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Overview

PLAYHUB uses **Supabase Auth** for identity management with JWT-based sessions. Authorization (what users can do) is layered on top via `tenant_members.role` and PostgreSQL Row Level Security.

**Identity provider:** Supabase Auth (free tier)  
**Session transport:** HTTP-only cookies via `@supabase/ssr`  
**Token type:** JWT access token + refresh token

---

## 2. Supported Auth Methods (v1)

| Method | Priority | Notes |
|--------|----------|-------|
| Email + Password | MUST | Primary method |
| Magic Link | SHOULD | Passwordless email login |
| Google OAuth | MAY | Enable in Supabase dashboard |
| Phone OTP | Out of scope v1 | Requires paid SMS |

---

## 3. Registration Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  User    │────►│ /register   │────►│ Supabase Auth│────►│ Email       │
│          │     │ Form (Zod)  │     │ signUp()     │     │ Verification│
└──────────┘     └─────────────┘     └──────────────┘     └──────┬──────┘
                                                                    │
                     ┌─────────────┐     ┌──────────────┐            │
                     │ /dashboard  │◄────│ Create       │◄───────────┘
                     │ or /onboard │     │ profiles row │
                     └─────────────┘     └──────────────┘
```

### 3.1 Steps

1. User submits email, password, full name, phone (optional)
2. Client validates with Zod (`auth.schema.ts`)
3. `supabase.auth.signUp()` creates `auth.users` record
4. Database trigger `on_auth_user_created` inserts `profiles` row
5. Supabase sends verification email (if email confirmation enabled)
6. User clicks verification link → redirected to `/auth/callback`
7. Session established → redirect based on context:
   - Has tenant membership → `/dashboard`
   - New user → `/onboarding` (create or join tenant)

### 3.2 Profile Creation Trigger

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Login Flow

```
User → /login → signInWithPassword()
              → Supabase validates credentials
              → JWT issued
              → @supabase/ssr sets cookies
              → middleware.ts refreshes session on subsequent requests
              → Redirect to intended URL or /dashboard
```

### 4.1 Magic Link Flow

```
User → enter email → signInWithOtp({ email })
     → Email with link → /auth/callback?token_hash=...
     → verifyOtp() → session created
```

### 4.2 OAuth Flow (Google)

```
User → signInWithOAuth({ provider: 'google' })
     → Google consent → /auth/callback
     → Supabase exchanges code → session
     → Profile created/updated via trigger
```

---

## 5. Session Management

### 5.1 Cookie-Based SSR Sessions

Next.js middleware runs on every matched route:

1. Read session from cookies via `createServerClient`
2. Call `supabase.auth.getUser()` to validate JWT
3. Refresh token if near expiry
4. Pass user to Server Components via session helper

### 5.2 Session Lifecycle

| Event | Behavior |
|-------|----------|
| Login | Access token (1h default) + refresh token stored in cookies |
| Request | Middleware auto-refreshes |
| Logout | `signOut()` clears cookies + invalidate refresh token |
| Password change | All sessions invalidated (Supabase setting) |

### 5.3 Client Session Access

```typescript
// Browser client — React Query hooks, client components
const { data: { user } } = await supabase.auth.getUser();
```

---

## 6. Route Protection

### 6.1 Middleware Route Matrix (implemented)

| Route | Auth | Additional checks |
|-------|------|-------------------|
| `/`, `/login`, `/register`, etc. | Public | Logged-in users redirected via `getPostLoginRedirect()` |
| `/verify-email` | Public / session optional | Resend requires session |
| `/auth/callback` | Public | Exchanges code/token for session |
| `/dashboard`, `/profile`, `/organizations`, `/onboarding`, `/invite/*` | Required | Email must be verified |
| `/platform` | Required | `profiles.is_platform_admin` only |

### 6.2 Post-login redirect logic

```typescript
// src/lib/constants/routes.ts
getPostLoginRedirect(isPlatformAdmin, hasOrganization)
// super_admin     → /platform
// no organization → /onboarding
// otherwise       → /dashboard
```

### 6.3 Active tenant cookie

- Cookie name: `playhub_tenant_id` (httpOnly, 1-year max-age)
- Set on: organization create, tenant switch, invite accept
- Cleared on: sign out

---

## 7. App Roles (Module 3)

Database `tenant_role` values map to user-facing app roles:

| App role | Source |
|----------|--------|
| Super Admin | `profiles.is_platform_admin = true` |
| Venue Admin | `tenant_members.role` ∈ owner, admin, manager, staff |
| Coach | `tenant_members.role = coach` |
| Customer | `tenant_members.role = member` or no membership |

Resolved server-side via `getAuthContext()` → `resolveAppRole()`.

---

## 8. Multi-Tenant Auth Context

A user may belong to multiple tenants. Active tenant is stored in:

- **Cookie:** `playhub_tenant_id` (httpOnly, secure)
- **Validated on switch:** User must have active `tenant_members` row

### 8.1 Tenant Switch Flow

```
User → Tenant Switcher (dashboard header)
     → switchTenantAction({ tenantId })
     → Verify membership in getAuthContext()
     → Set playhub_tenant_id cookie
     → revalidatePath + router.refresh()
```

### 8.2 RLS Integration

PostgreSQL policies use helper functions:

```sql
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    ''
  )::UUID;
$$ LANGUAGE sql STABLE;
```

Tenant ID is set via Supabase `set_config` in RPC calls or passed through custom claims (future).

**v1 approach:** RLS policies join `tenant_members` on `auth.uid()` rather than JWT custom claims.

---

## 9. Staff Invite Flow

```
Admin → POST /api/v1/tenant/invites { email, role }
      → Insert tenant_invites with secure token
      → Email invite link: /invite/{token}
Invitee → /invite/{token}
        → If no account → register first
        → POST /api/v1/auth/accept-invite { token }
        → Create tenant_members row
        → Set active tenant cookie
        → Redirect /dashboard
```

---

## 9. Password Reset Flow

```
User → /forgot-password → resetPasswordForEmail(email)
     → Email with link → /auth/callback?type=recovery
     → User sets new password → updateUser({ password })
     → Redirect /login
```

---

## 10. Guardian / Minor Flow

```
Parent registers → adds ward via profile settings
               → guardian_links created
               → Parent can enroll ward in academy
               → Parent can book on behalf of ward (booked_by field)
```

Minor accounts: `date_of_birth` checked; if under 18, certain actions require linked guardian.

---

## 11. Security Considerations

| Control | Implementation |
|---------|----------------|
| Password policy | Min 8 chars (Supabase config) |
| Email verification | Enabled in production |
| CSRF | SameSite cookies + origin check on API |
| Session fixation | New session on login |
| Brute force | Supabase rate limits + app-level on /login |
| Service role key | Server-only; never in client bundle |

---

## 12. Auth State Diagram

```
                    ┌─────────────┐
                    │ Anonymous   │
                    └──────┬──────┘
                           │ register/login
                    ┌──────▼──────┐
                    │Authenticated│
                    │ (no tenant) │
                    └──────┬──────┘
                           │ onboarding / invite
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼───┐ ┌──────▼──────┐
       │ Tenant      │ │Player │ │ Platform    │
       │ Staff/Admin │ │Portal │ │ Super-Admin │
       └─────────────┘ └───────┘ └─────────────┘
```

---

## 13. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server only
```

---

## 14. Related Documents

- [User Roles](./user-roles.md)
- [Security Plan](./security-plan.md)
- [API Design](./api-design.md)
- [Architecture](./architecture.md)
