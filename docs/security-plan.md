# Security Plan

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Security Objectives

| Objective | Description |
|-----------|-------------|
| **Confidentiality** | Tenant data isolated; no cross-tenant leakage |
| **Integrity** | Bookings and enrollments cannot be tampered with |
| **Availability** | Resilient against abuse; graceful under load |
| **Accountability** | Audit trail for privileged actions |

---

## 2. Threat Model

### 2.1 Assets

- User credentials and sessions
- Tenant business data (venues, pricing, bookings, revenue)
- Player PII (name, phone, email, DOB)
- Academy student records and attendance
- Platform configuration and sport templates

### 2.2 Threat Actors

| Actor | Motivation | Capability |
|-------|------------|------------|
| Anonymous attacker | Scraping, abuse, slot hoarding | Low–medium |
| Malicious player | Free bookings, promo abuse | Low |
| Disgruntled staff | Data exfiltration, sabotage | Medium |
| Cross-tenant attacker | Access competitor data | Medium |
| Platform attacker | Service disruption | Medium |

### 2.3 STRIDE Analysis

| Threat | Category | Mitigation |
|--------|----------|------------|
| Cross-tenant data access | Spoofing/Tampering | RLS, tenant_id scoping |
| JWT theft | Spoofing | HttpOnly cookies, short-lived tokens |
| Booking race condition | Tampering | DB exclusion constraint, RPC locks |
| SQL injection | Tampering | Parameterized queries, Supabase client |
| XSS | Tampering | React escaping, CSP headers |
| CSRF | Spoofing | SameSite cookies, origin validation |
| Privilege escalation | Elevation | Role checks in RLS + API |
| File upload malware | Tampering | Type/size validation, Storage RLS |
| API abuse | DoS | Rate limiting in middleware |
| Data exfiltration via Realtime | Info disclosure | RLS on published tables |

---

## 3. Authentication Security

| Control | Implementation |
|---------|----------------|
| Password storage | Supabase Auth (bcrypt) — never stored in app |
| Session tokens | JWT in HttpOnly, Secure, SameSite=Lax cookies |
| Token refresh | Automatic via middleware |
| Email verification | Required in production |
| Password policy | Minimum 8 characters; Supabase dashboard config |
| Brute force protection | Supabase rate limits + app login throttle |
| Service role key | `SUPABASE_SERVICE_ROLE_KEY` — server-only env var |
| Logout | Invalidates refresh token |

### 3.1 Service Role Usage Rules

- **NEVER** expose service role key to client bundle
- Use only in: API routes, Server Actions, Edge Functions
- Prefer user-scoped client with RLS over service role
- Service role calls MUST be logged in audit_logs

---

## 4. Authorization (RBAC + RLS)

### 4.1 Defense in Depth

```
Layer 1: Next.js middleware (route access)
Layer 2: API route handler (role check)
Layer 3: PostgreSQL RLS (data access)  ← authoritative
Layer 4: Storage policies (file access)
```

### 4.2 RLS Requirements

| Table | RLS Enabled | Policy Count (min) |
|-------|:-----------:|:------------------:|
| profiles | ✓ | 3 |
| tenants | ✓ | 4 |
| tenant_members | ✓ | 4 |
| venues | ✓ | 5 |
| resources | ✓ | 4 |
| bookings | ✓ | 6 |
| academy_programs | ✓ | 4 |
| batches | ✓ | 4 |
| enrollments | ✓ | 5 |
| attendance_records | ✓ | 4 |
| notifications | ✓ | 3 |
| audit_logs | ✓ | 2 |

### 4.3 RLS Testing

- Automated tests with multiple user JWT contexts
- Manual pen test: attempt cross-tenant SELECT/UPDATE
- Verify anonymous access only to published public data

---

## 5. Input Validation

| Layer | Tool | Scope |
|-------|------|-------|
| Client forms | Zod + React Hook Form | UX validation |
| API routes | Zod parse | Request body/query |
| Database | CHECK constraints, enums | Data integrity |

### 5.1 Validation Rules

- UUIDs validated with `z.string().uuid()`
- Dates parsed and normalized to UTC
- Phone numbers: E.164 format preferred
- Text fields: max length enforced
- File uploads: whitelist MIME types (`image/jpeg`, `image/png`, `image/webp`)
- File size: max 2MB avatars, 5MB venue images

---

## 6. API Security

| Control | Details |
|---------|---------|
| HTTPS | Enforced by Vercel |
| CORS | Same-origin default; no wildcard in production |
| Rate limiting | 10 bookings/min/user; 100 GET/min/IP |
| Error messages | Generic 500; detailed errors server-side only |
| Idempotency | Booking creation uses hold_id to prevent duplicates |

### 6.1 Security Headers (next.config.ts)

```
Content-Security-Policy
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

---

## 7. Data Protection

### 7.1 PII Handling

| Data | Classification | Retention |
|------|----------------|-----------|
| Email, phone | PII | Account lifetime + 30 days post-deletion |
| DOB | Sensitive PII | Account lifetime |
| Booking history | Business data | 2 years (configurable) |
| Attendance | Sensitive (minors) | Program duration + 1 year |

### 7.2 Data Subject Rights

- **Access:** User can view profile and booking history
- **Deletion:** Account deletion request soft-deletes profile; hard delete after 30-day grace
- **Export:** JSON export of user data (v1 SHOULD)

### 7.3 Encryption

| State | Method |
|-------|--------|
| In transit | TLS 1.2+ |
| At rest | Supabase managed encryption (AES-256) |
| Backups | Supabase encrypted backups |

---

## 8. Storage Security

```sql
-- Avatars: users can only upload to their own folder
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Venue media: tenant admins only
CREATE POLICY "venue_media_tenant_admin"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'venue-media'
  AND has_tenant_role(
    (storage.foldername(name))[1]::uuid,
    'admin'
  )
);
```

---

## 9. Realtime Security

- Realtime respects RLS — unauthenticated users only receive rows matching public policies
- Booking payloads for public channels strip `user_id` and `notes`
- Channel names use UUIDs (non-enumerable)
- Unsubscribe on page leave to reduce attack surface

---

## 10. Audit Logging

### 10.1 Logged Actions

| Action | Entity |
|--------|--------|
| create, update, delete | venues, resources, pricing_rules |
| create, cancel | bookings |
| create, update | enrollments |
| role_change | tenant_members |
| suspend, activate | tenants (platform admin) |

### 10.2 Audit Record Fields

`actor_id`, `tenant_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `ip_address`, `created_at`

### 10.3 Retention

Audit logs retained 1 year minimum; platform admin logs retained 2 years.

---

## 11. Dependency Security

| Practice | Frequency |
|----------|-----------|
| `pnpm audit` in CI | Every PR |
| Dependabot / Renovate | Weekly |
| Pin major versions | Always |
| Review new dependencies | Before merge |

---

## 12. Secrets Management

| Secret | Storage |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel env (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env (public, RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (encrypted, production only) |
| Invite tokens | Database only; crypto-random 32 bytes |

**Rules:**
- Never commit `.env.local`
- `.env.example` contains placeholder values only
- Rotate service role key if exposed

---

## 13. Incident Response

### 13.1 Severity Levels

| Level | Example | Response Time |
|-------|---------|---------------|
| P0 | Active data breach, service down | < 1 hour |
| P1 | RLS bypass discovered | < 4 hours |
| P2 | Elevated error rate | < 24 hours |
| P3 | Minor vulnerability | < 1 week |

### 13.2 Response Steps

1. Contain — disable affected feature or suspend tenant
2. Assess — determine scope of exposure
3. Notify — affected users if PII compromised
4. Fix — patch and deploy
5. Post-mortem — document in `docs/incidents/`

---

## 14. Security Checklist (Pre-Launch)

- [ ] RLS enabled on all tables
- [ ] RLS policies tested with multiple roles
- [ ] Service role key not in client bundle (verify build output)
- [ ] Email verification enabled
- [ ] CSP headers configured
- [ ] Rate limiting active on booking endpoints
- [ ] File upload restrictions enforced
- [ ] Audit logging for admin actions
- [ ] HTTPS enforced
- [ ] Privacy policy and terms published
- [ ] `pnpm audit` — no critical vulnerabilities
- [ ] Supabase dashboard: disable unused auth providers
- [ ] Supabase dashboard: review API settings

---

## 15. Related Documents

- [Authentication Flow](./authentication-flow.md)
- [User Roles](./user-roles.md)
- [Database Design](./database-design.md)
- [Deployment Guide](./deployment-guide.md)
