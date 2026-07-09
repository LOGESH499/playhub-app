# Real-Time Architecture

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Overview

PLAYHUB uses **Supabase Realtime** (PostgreSQL logical replication over WebSockets) to deliver live slot availability, booking updates, and in-app notifications without paid messaging services.

**Primary use cases:**

1. Slot availability changes when another user books
2. Slot hold expiration visibility
3. In-app notification delivery
4. Dashboard booking feed (staff view)
5. Academy attendance live updates (coach tablet view)

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Slot Calendar│  │ Booking Feed │  │ Notification Bell      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           │                                      │
│              ┌────────────▼────────────┐                        │
│              │  useRealtimeSubscription │  (React hooks)        │
│              │  + React Query invalidate│                        │
│              └────────────┬────────────┘                        │
└───────────────────────────┼─────────────────────────────────────┘
                            │ WebSocket (wss://)
┌───────────────────────────▼─────────────────────────────────────┐
│                    SUPABASE REALTIME                               │
│  Channels: venue:{id} | user:{id} | resource:{id}                 │
│  Events: INSERT | UPDATE | DELETE on published tables             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Logical Replication
┌───────────────────────────▼─────────────────────────────────────┐
│                    PostgreSQL                                      │
│  bookings | slot_holds | notifications | attendance_records       │
└───────────────────────────────────────────────────────────────────┘
```

---

## 3. Published Tables

| Table | Events | Channel Scope |
|-------|--------|---------------|
| `bookings` | INSERT, UPDATE | `venue:{venue_id}` |
| `slot_holds` | INSERT, DELETE | `resource:{resource_id}` |
| `notifications` | INSERT | `user:{user_id}` |
| `attendance_records` | INSERT, UPDATE | `batch:{batch_id}` |

### 3.1 Enable Realtime (Migration)

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE slot_holds;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
```

---

## 4. Channel Design

### 4.1 Naming Convention

```
venue:{venue_uuid}       — All booking changes at a venue
resource:{resource_uuid} — Holds + availability for one court
user:{user_uuid}         — Personal notifications
batch:{batch_uuid}       — Academy session updates
tenant:{tenant_uuid}     — Staff dashboard aggregate (filtered client-side)
```

### 4.2 Subscription Rules

| Screen | Channels Subscribed | Unsubscribe On |
|--------|---------------------|----------------|
| Venue booking page | `venue:{id}`, `resource:{id}` × N | Leave page |
| Player my-bookings | None (polling/React Query) | — |
| Staff booking board | `venue:{id}` | Switch venue |
| Notification bell | `user:{id}` | Logout |
| Coach attendance | `batch:{id}` | Leave session |

**Free tier optimization:** Subscribe only to channels needed for the current view. Never subscribe globally.

---

## 5. Client Implementation Pattern

### 5.1 Hook: `useBookingRealtime`

```typescript
// Pseudocode — implementation in development phase
function useBookingRealtime(venueId: string, date: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`venue:${venueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `venue_id=eq.${venueId}`,
      }, (payload) => {
        queryClient.invalidateQueries({
          queryKey: ['slots', venueId, date],
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [venueId, date]);
}
```

### 5.2 Optimistic Updates

For booking creation:

1. **Optimistic:** Mark slot as `pending` in local cache
2. **Mutation:** POST `/api/v1/bookings`
3. **Success:** Confirm slot as `booked`
4. **Failure (409):** Rollback + show conflict message
5. **Realtime:** Other clients receive INSERT event → invalidate

---

## 6. Slot Availability Sync

### 6.1 Problem

Slots are computed, not stored. Realtime events signal **cache invalidation**, not slot payloads.

### 6.2 Flow

```
User A books slot
  → create_booking() commits
  → Realtime: bookings INSERT on venue channel
  → User B's client receives event
  → React Query refetches GET /api/v1/slots?venue_id=...&date=...
  → UI updates slot from available → booked
```

### 6.3 Slot Holds

```
User A starts checkout
  → POST /api/v1/slots/hold
  → Realtime: slot_holds INSERT
  → Other users see slot as "held" (optional UX — yellow state)
  → Hold expires (10 min) or converts to booking
  → Realtime: slot_holds DELETE
  → Slot returns to available or booked
```

### 6.4 Hold Expiration Job

Supabase Edge Function or `pg_cron` (if available):

```
expire_slot_holds() — runs every minute
  → DELETE FROM slot_holds WHERE expires_at < now()
  → Each DELETE triggers Realtime
```

---

## 7. Conflict Resolution UX

When two users attempt the same slot simultaneously:

| Scenario | Resolution |
|----------|------------|
| Both POST booking | DB exclusion constraint → one succeeds, one gets 409 |
| Hold + Booking | Booking waits for hold expiry or uses hold_id to convert |
| Staff override | Staff role can cancel conflicting pending booking |

**User messaging:**

> "This slot was just booked by another player. Here are similar available slots."

---

## 8. Notifications Realtime

```
Server creates notification row
  → INSERT into notifications
  → Realtime on user:{user_id} channel
  → Client appends to notification list
  → Badge count increments
```

No push notifications in v1 (no paid FCM/APNs). PWA push is a v2 consideration.

---

## 9. Connection Management

### 9.1 Reconnection

Supabase client auto-reconnects WebSocket. On reconnect:

1. Re-subscribe to active channels
2. Invalidate all active slot queries (stale data refresh)

### 9.2 Degraded Mode

If WebSocket fails:

- Show subtle "Reconnecting..." indicator
- Fall back to React Query `refetchInterval: 30000` for slot views
- Booking mutations still work via REST/RPC

### 9.3 Presence (Future)

Supabase Presence for "3 people viewing this venue" — optional, not v1.

---

## 10. Security

| Concern | Mitigation |
|---------|------------|
| Unauthorized channel access | RLS on tables — Realtime respects RLS |
| Data leakage via filters | Client filters are additive; RLS is authoritative |
| Channel enumeration | UUIDs are non-guessable |

Realtime subscriptions require authenticated Supabase client with valid JWT. Anonymous users on public venue pages receive only published venue booking events (no PII in payloads).

### 10.1 Payload Sanitization

Booking realtime payloads for public channels exclude:

- `user_id` (show only "booked" status)
- `notes`, `phone`

Staff channels (authenticated, role-checked) receive full payloads.

---

## 11. Performance & Free Tier Limits

| Limit | Supabase Free | Mitigation |
|-------|---------------|------------|
| Concurrent connections | 200 | Unsubscribe aggressively |
| Messages/month | 2M | Invalidate vs. full payload broadcast |
| Database replication | Included | Only publish necessary tables |

---

## 12. Testing Realtime

1. **Local:** `supabase start` + two browser tabs
2. **Integration:** Supabase client subscription in Playwright (challenging — use polling fallback in tests)
3. **Manual QA:** Book slot in Tab A, verify Tab B updates within 2 seconds

---

## 13. Related Documents

- [Architecture](./architecture.md)
- [API Design](./api-design.md)
- [Database Design](./database-design.md)
- [Authentication Flow](./authentication-flow.md)
