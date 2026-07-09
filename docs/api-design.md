# API Design

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. API Strategy

PLAYHUB uses a **hybrid API approach**:

| Layer | Use Case |
|-------|----------|
| **Supabase Client (direct)** | CRUD with RLS — lists, reads, simple inserts |
| **Next.js Route Handlers** (`/api/v1/*`) | Complex transactions, webhooks, server-only logic |
| **PostgreSQL RPC** | Atomic operations (booking creation, enrollment) |
| **Server Actions** | Form mutations from dashboard UI |

**Base URL:** `https://{domain}/api/v1`

**Content-Type:** `application/json`

**Authentication:** Bearer JWT (Supabase session access token) in `Authorization` header, or cookie-based session for same-origin requests.

---

## 2. Conventions

### 2.1 Response Envelope

```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

### 2.2 Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "This slot is no longer available.",
    "details": {
      "resource_id": "uuid",
      "start_time": "2026-07-10T10:00:00Z"
    }
  }
}
```

### 2.3 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (RLS / role) |
| 404 | Not found |
| 409 | Conflict (booking overlap) |
| 422 | Business rule violation |
| 500 | Server error |

### 2.4 Pagination

Query params: `?page=1&per_page=20`

Default `per_page`: 20, max: 100.

### 2.5 Filtering & Sorting

```
GET /api/v1/venues?sport=badminton&city=Mumbai&sort=name&order=asc
```

---

## 3. Authentication Endpoints

Handled primarily by Supabase Auth SDK. Custom routes:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/auth/session` | Current user + active tenant |
| POST | `/api/v1/auth/switch-tenant` | Set active tenant context |
| POST | `/api/v1/auth/accept-invite` | Accept staff invite token |

### POST `/api/v1/auth/switch-tenant`

**Request:**
```json
{ "tenant_id": "uuid" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenant_id": "uuid",
    "role": "admin"
  }
}
```

---

## 4. Venue Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/venues` | Public | List published venues |
| GET | `/api/v1/venues/:id` | Public | Venue detail |
| POST | `/api/v1/venues` | Admin+ | Create venue |
| PATCH | `/api/v1/venues/:id` | Admin+ | Update venue |
| DELETE | `/api/v1/venues/:id` | Owner | Soft delete |

### GET `/api/v1/venues`

**Query params:** `sport`, `lat`, `lng`, `radius_km`, `city`, `page`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Smash Arena",
      "slug": "smash-arena",
      "city": "Mumbai",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "sports": ["badminton", "pickleball"],
      "thumbnail_url": "https://...",
      "starting_price": 500
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 45 }
}
```

---

## 5. Resource Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/venues/:venueId/resources` | Public/Member | List resources |
| POST | `/api/v1/venues/:venueId/resources` | Admin+ | Create resource |
| PATCH | `/api/v1/resources/:id` | Admin+ | Update resource |
| DELETE | `/api/v1/resources/:id` | Admin+ | Deactivate resource |

---

## 6. Slot & Availability Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/slots` | Public | Available slots |
| POST | `/api/v1/slots/hold` | Authenticated | Create temporary hold |
| DELETE | `/api/v1/slots/hold/:id` | Authenticated | Release hold |

### GET `/api/v1/slots`

**Query params:**

| Param | Required | Description |
|-------|----------|-------------|
| venue_id | One of venue/resource | Venue filter |
| resource_id | One of venue/resource | Resource filter |
| sport | No | Sport filter |
| date | Yes | ISO date (venue TZ) |
| duration_minutes | No | Default from sport template |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "resource_id": "uuid",
      "resource_name": "Court 1",
      "slots": [
        {
          "start_time": "2026-07-10T06:00:00+05:30",
          "end_time": "2026-07-10T07:00:00+05:30",
          "status": "available",
          "price": 500,
          "currency": "INR"
        },
        {
          "start_time": "2026-07-10T07:00:00+05:30",
          "end_time": "2026-07-10T08:00:00+05:30",
          "status": "booked",
          "price": 500
        }
      ]
    }
  ]
}
```

### POST `/api/v1/slots/hold`

**Request:**
```json
{
  "resource_id": "uuid",
  "start_time": "2026-07-10T10:00:00+05:30",
  "end_time": "2026-07-10T11:00:00+05:30"
}
```

**Response:** `201` with hold object, `expires_at` = now + 10 minutes.

---

## 7. Booking Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/bookings` | Member+ | List bookings (scoped) |
| GET | `/api/v1/bookings/:id` | Owner/Staff/Player | Booking detail |
| POST | `/api/v1/bookings` | Authenticated | Create booking |
| PATCH | `/api/v1/bookings/:id` | Staff+/Player | Update (cancel) |
| POST | `/api/v1/bookings/:id/cancel` | Staff+/Player | Cancel with policy |

### POST `/api/v1/bookings`

**Request:**
```json
{
  "resource_id": "uuid",
  "start_time": "2026-07-10T10:00:00+05:30",
  "end_time": "2026-07-10T11:00:00+05:30",
  "hold_id": "uuid",
  "promo_code": "SUMMER10",
  "notes": "Need extra shuttles",
  "payment_method": "pay_at_venue"
}
```

**Server flow:**
1. Validate Zod schema
2. Call `supabase.rpc('create_booking', params)`
3. On success → create notification, return booking
4. On conflict → `409 BOOKING_CONFLICT`

**Response:** `201`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "confirmed",
    "amount": 450,
    "currency": "INR",
    "venue": { "name": "Smash Arena" },
    "resource": { "name": "Court 1" }
  }
}
```

### POST `/api/v1/bookings/recurring`

**Request:**
```json
{
  "resource_id": "uuid",
  "start_time": "2026-07-10T10:00:00+05:30",
  "end_time": "2026-07-10T11:00:00+05:30",
  "recurrence": {
    "frequency": "weekly",
    "days_of_week": [1, 3, 5],
    "until": "2026-08-10"
  }
}
```

**Response:** List of created bookings + conflicts array.

---

## 8. Academy Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/academies` | Public | List programs |
| GET | `/api/v1/academies/:id` | Public | Program detail |
| POST | `/api/v1/academies` | Admin+ | Create program |
| GET | `/api/v1/academies/:id/batches` | Public | List batches |
| POST | `/api/v1/batches` | Admin+ | Create batch |
| POST | `/api/v1/batches/:id/enroll` | Auth | Enroll student |
| GET | `/api/v1/batches/:id/sessions` | Coach+ | List sessions |
| POST | `/api/v1/sessions/:id/attendance` | Coach+ | Bulk mark attendance |

### POST `/api/v1/sessions/:id/attendance`

**Request:**
```json
{
  "records": [
    { "student_id": "uuid", "status": "present" },
    { "student_id": "uuid", "status": "absent", "notes": "Informed" }
  ]
}
```

---

## 9. Pricing & Packages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/pricing-rules` | Admin+ | List rules |
| POST | `/api/v1/pricing-rules` | Admin+ | Create rule |
| GET | `/api/v1/packages` | Public/Member | List packages |
| POST | `/api/v1/packages/:id/purchase` | Auth | Record purchase (manual pay v1) |

---

## 10. Staff & Tenant Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/tenant/members` | Admin+ | List staff |
| POST | `/api/v1/tenant/invites` | Admin+ | Send invite |
| DELETE | `/api/v1/tenant/members/:id` | Owner | Remove member |
| PATCH | `/api/v1/tenant/settings` | Owner | Update org settings |

---

## 11. Platform Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/platform/tenants` | Platform Admin | All tenants |
| PATCH | `/api/v1/platform/tenants/:id` | Platform Admin | Suspend/activate |
| GET | `/api/v1/platform/audit-logs` | Platform Admin | System audit |

---

## 12. PostgreSQL RPC Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `create_booking` | resource_id, start, end, user_id, hold_id?, promo? | booking row | Atomic create |
| `cancel_booking` | booking_id, reason, actor_id | booking row | Policy-aware cancel |
| `create_enrollment` | batch_id, student_id, enrolled_by | enrollment | Capacity check |
| `mark_attendance_bulk` | session_id, records jsonb, coach_id | int | Bulk upsert |
| `expire_slot_holds` | — | int | Cron — delete expired |
| `get_available_slots` | resource_id, date, duration | slot[] | Computed availability |

---

## 13. Webhooks (Future / Edge Functions)

| Event | Trigger |
|-------|---------|
| `booking.created` | After confirmed booking |
| `booking.cancelled` | After cancellation |
| `enrollment.created` | New academy enrollment |

v1: Internal notifications only; external webhooks documented for v2.

---

## 14. Rate Limiting

Vercel + middleware-based rate limiting (in-memory / KV future):

| Endpoint | Limit |
|----------|-------|
| POST `/bookings` | 10/min per user |
| POST `/slots/hold` | 20/min per user |
| Public GET | 100/min per IP |

---

## 15. Versioning

- Current version: `v1`
- Breaking changes → `v2` prefix
- Deprecation notice: minimum 90 days in response header `X-API-Deprecated`

---

## 16. Related Documents

- [Authentication Flow](./authentication-flow.md)
- [Real-Time Architecture](./realtime-architecture.md)
- [Database Tables](./database-tables.md)
- [Security Plan](./security-plan.md)
