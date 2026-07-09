# User Roles & Permissions

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Role Hierarchy

PLAYHUB implements **Role-Based Access Control (RBAC)** at two levels:

1. **Platform level** — Super-admin (`profiles.is_platform_admin`)
2. **Tenant level** — Roles in `tenant_members.role`

```
Platform Super-Admin
        │
        ▼
   Tenant Owner ──────► Tenant Admin ──────► Manager
                                                    │
                              ┌─────────────────────┼─────────────────────┐
                              ▼                     ▼                     ▼
                           Staff                 Coach                  Member
                              │                     │
                              └──────────┬──────────┘
                                         ▼
                              Player (authenticated, no tenant role)
```

---

## 2. Tenant Roles

### 2.1 Role Definitions

| Role | Description | Typical User |
|------|-------------|--------------|
| **owner** | Full control including billing, deletion, ownership transfer | Venue proprietor |
| **admin** | Full operational control except tenant deletion | Operations head |
| **manager** | Venue and academy management, reports, staff scheduling | Facility manager |
| **staff** | Front-desk booking, walk-ins, basic cancellations | Reception |
| **coach** | Academy batches, attendance, session notes | Sports coach |
| **member** | Tenant-affiliated player with possible member pricing | Club member |

### 2.2 Platform Role

| Role | Description |
|------|-------------|
| **platform_admin** | Cross-tenant access for support, sport templates, tenant suspension |

---

## 3. Permission Matrix — Venue & Booking

| Permission | Owner | Admin | Manager | Staff | Coach | Member | Player |
|------------|:-----:|:-----:|:-------:|:-----:|:-----:|:------:|:------:|
| View published venues | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/edit venues | ✓ | ✓ | ✓ | — | — | — | — |
| Manage resources | ✓ | ✓ | ✓ | — | — | — | — |
| Set operating hours | ✓ | ✓ | ✓ | — | — | — | — |
| Set pricing rules | ✓ | ✓ | ✓ | — | — | — | — |
| View all bookings | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Create booking (self) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create booking (on behalf) | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Cancel any booking | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Cancel own booking | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Override blackout | ✓ | ✓ | — | — | — | — | — |
| Manage packages/promos | ✓ | ✓ | ✓ | — | — | — | — |
| View revenue reports | ✓ | ✓ | ✓ | — | — | — | — |
| Export booking CSV | ✓ | ✓ | ✓ | — | — | — | — |

---

## 4. Permission Matrix — Academy

| Permission | Owner | Admin | Manager | Staff | Coach | Member | Player |
|------------|:-----:|:-----:|:-------:|:-----:|:-----:|:------:|:------:|
| Create academy program | ✓ | ✓ | ✓ | — | — | — | — |
| Create/edit batches | ✓ | ✓ | ✓ | — | — | — | — |
| Assign coaches | ✓ | ✓ | ✓ | — | — | — | — |
| Enroll students | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Self-enroll in batch | — | — | — | — | — | ✓ | ✓ |
| Mark attendance | ✓ | ✓ | ✓ | — | ✓ | — | — |
| View own attendance | — | — | — | — | — | ✓ | ✓ |
| View batch roster | ✓ | ✓ | ✓ | ✓ | ✓* | — | — |
| Academy reports | ✓ | ✓ | ✓ | — | — | — | — |

*Coach sees only assigned batches.

---

## 5. Permission Matrix — Tenant Administration

| Permission | Owner | Admin | Manager | Staff | Coach | Member | Player |
|------------|:-----:|:-----:|:-------:|:-----:|:-----:|:------:|:------:|
| Edit organization settings | ✓ | ✓ | — | — | — | — | — |
| Invite staff | ✓ | ✓ | — | — | — | — | — |
| Remove staff | ✓ | ✓ | — | — | — | — | — |
| Change member roles | ✓ | ✓ | — | — | — | — | — |
| Delete tenant | ✓ | — | — | — | — | — | — |
| Transfer ownership | ✓ | — | — | — | — | — | — |
| View audit logs | ✓ | ✓ | — | — | — | — | — |

---

## 6. Permission Matrix — Platform

| Permission | Platform Admin | All Others |
|------------|:--------------:|:----------:|
| List all tenants | ✓ | — |
| Suspend/activate tenant | ✓ | — |
| Manage sport templates | ✓ | — |
| View cross-tenant audit logs | ✓ | — |
| Impersonate user | — | — (never in v1) |

---

## 7. RLS Policy Mapping

Roles are enforced in PostgreSQL via `tenant_members` joins:

```sql
-- Helper: get user's role in tenant
CREATE OR REPLACE FUNCTION get_user_tenant_role(p_tenant_id UUID)
RETURNS tenant_role AS $$
  SELECT role FROM tenant_members
  WHERE tenant_id = p_tenant_id
    AND user_id = auth.uid()
    AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check minimum role
CREATE OR REPLACE FUNCTION has_tenant_role(
  p_tenant_id UUID,
  p_min_role tenant_role
) RETURNS BOOLEAN AS $$
  SELECT CASE get_user_tenant_role(p_tenant_id)
    WHEN 'owner' THEN true
    WHEN 'admin' THEN p_min_role NOT IN ('owner')
    WHEN 'manager' THEN p_min_role IN ('manager','staff','coach','member')
    WHEN 'staff' THEN p_min_role IN ('staff','coach','member')
    WHEN 'coach' THEN p_min_role IN ('coach','member')
    WHEN 'member' THEN p_min_role = 'member'
    ELSE false
  END;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## 8. UI Role Gating

Navigation items and actions are gated client-side for UX and server-side for security:

```typescript
// Client-side — hide unavailable actions
const canManageVenues = ['owner', 'admin', 'manager'].includes(role);

// Server-side — RLS + API route role check (authoritative)
if (!hasTenantRole(tenantId, 'manager')) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Rule:** Client gating is never sufficient alone.

---

## 9. Multi-Role Scenarios

| Scenario | Behavior |
|----------|----------|
| User is coach at Tenant A, player globally | Dashboard shows Tenant A coach tools; public booking as player |
| User is owner of Tenant A, staff at Tenant B | Tenant switcher changes role context |
| Platform admin who is also venue owner | Platform routes check `is_platform_admin`; tenant routes use tenant role |

---

## 10. Default Role Assignment

| Action | Default Role |
|--------|--------------|
| Create new tenant | `owner` |
| Accept staff invite | Role from invite |
| Self-register player | No tenant role (player only) |
| Purchase membership package | `member` (optional auto-assign) |

---

## 11. Role Escalation Prevention

- Only `owner` can assign `owner` or `admin` roles
- `admin` cannot remove `owner`
- Users cannot modify their own role
- All role changes logged in `audit_logs`

---

## 12. Related Documents

- [Authentication Flow](./authentication-flow.md)
- [Security Plan](./security-plan.md)
- [Database Tables](./database-tables.md)
