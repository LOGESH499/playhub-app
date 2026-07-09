# Entity Relationship Diagram

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. High-Level ERD

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│ auth.users   │1────1│    profiles      │*─────*│tenant_members│
└──────────────┘       └────────┬─────────┘       └──────┬───────┘
                                │                        │
                    ┌───────────┼───────────┐              │
                    │           │         │              │
              ┌─────▼─────┐     │    ┌────▼────┐   ┌─────▼─────┐
              │guardian_  │     │    │bookings │   │  tenants  │
              │links      │     │    └────┬────┘   └─────┬─────┘
              └───────────┘     │         │              │
                                │         │         ┌────┴────────────────┐
                           ┌────▼────┐    │         │                     │
                           │notifi-  │    │    ┌────▼────┐          ┌─────▼─────┐
                           │cations  │    │    │ venues  │          │  academy  │
                           └─────────┘    │    └────┬────┘          │ programs  │
                                          │         │               └─────┬─────┘
                                          │    ┌────▼────┐                    │
                                          └───►│resources│◄───────────────────┤
                                               └────┬────┘                    │
                                                    │                  ┌──────▼──────┐
                                               ┌────▼────┐             │   batches   │
                                               │slot_    │             └──────┬──────┘
                                               │holds    │                    │
                                               └─────────┘         ┌──────────┼──────────┐
                                                                   │          │          │
                                                            ┌──────▼──┐ ┌─────▼────┐ ┌───▼────────┐
                                                            │batch_   │ │enroll-   │ │batch_      │
                                                            │coaches  │ │ments     │ │sessions    │
                                                            └─────────┘ └──────────┘ └─────┬──────┘
                                                                                          │
                                                                                    ┌─────▼──────┐
                                                                                    │attendance_ │
                                                                                    │records     │
                                                                                    └────────────┘
```

---

## 2. Tenancy & Identity Relationships

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : extends
    PROFILES ||--o{ TENANT_MEMBERS : has
    TENANTS ||--o{ TENANT_MEMBERS : includes
    PROFILES ||--o{ GUARDIAN_LINKS : guardian
    PROFILES ||--o{ GUARDIAN_LINKS : ward
    TENANTS ||--o{ TENANT_INVITES : sends

    AUTH_USERS {
        uuid id PK
        string email
    }

    PROFILES {
        uuid id PK
        string full_name
        string phone
        boolean is_platform_admin
    }

    TENANTS {
        uuid id PK
        string name
        string slug UK
        string timezone
        string status
    }

    TENANT_MEMBERS {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        tenant_role role
        string status
    }
```

---

## 3. Venue & Booking Relationships

```mermaid
erDiagram
    TENANTS ||--o{ VENUES : owns
    VENUES ||--o{ RESOURCES : contains
    VENUES ||--o{ OPERATING_HOURS : defines
    RESOURCES ||--o{ OPERATING_HOURS : overrides
    VENUES ||--o{ BLACKOUT_PERIODS : blocks
    RESOURCES ||--o{ BLACKOUT_PERIODS : blocks
    RESOURCES ||--o{ BOOKINGS : reserved_by
    RESOURCES ||--o{ SLOT_HOLDS : temporarily_held
    PROFILES ||--o{ BOOKINGS : books
    TENANTS ||--o{ PRICING_RULES : sets
    VENUES ||--o{ PRICING_RULES : scopes
    RESOURCES ||--o{ PRICING_RULES : scopes

    VENUES {
        uuid id PK
        uuid tenant_id FK
        string name
        decimal latitude
        decimal longitude
        boolean is_published
    }

    RESOURCES {
        uuid id PK
        uuid venue_id FK
        sport_type sport_type
        string name
        boolean is_active
    }

    BOOKINGS {
        uuid id PK
        uuid resource_id FK
        uuid user_id FK
        timestamptz start_time
        timestamptz end_time
        booking_status status
        decimal amount
    }

    SLOT_HOLDS {
        uuid id PK
        uuid resource_id FK
        timestamptz expires_at
    }
```

---

## 4. Academy Relationships

```mermaid
erDiagram
    TENANTS ||--o{ ACADEMY_PROGRAMS : offers
    VENUES ||--o{ ACADEMY_PROGRAMS : hosts
    ACADEMY_PROGRAMS ||--o{ BATCHES : contains
    BATCHES ||--o{ BATCH_COACHES : staffed_by
    PROFILES ||--o{ BATCH_COACHES : coaches
    BATCHES ||--o{ ENROLLMENTS : enrolls
    PROFILES ||--o{ ENROLLMENTS : student
    BATCHES ||--o{ BATCH_SESSIONS : schedules
    BATCH_SESSIONS ||--o{ ATTENDANCE_RECORDS : tracks
    PROFILES ||--o{ ATTENDANCE_RECORDS : student

    ACADEMY_PROGRAMS {
        uuid id PK
        academy_type academy_type
        string name
    }

    BATCHES {
        uuid id PK
        uuid program_id FK
        int capacity
        jsonb schedule
    }

    ENROLLMENTS {
        uuid id PK
        uuid batch_id FK
        uuid student_id FK
        enrollment_status status
    }

    ATTENDANCE_RECORDS {
        uuid id PK
        uuid session_id FK
        uuid student_id FK
        string status
    }
```

---

## 5. Commerce Relationships

```mermaid
erDiagram
    TENANTS ||--o{ MEMBERSHIP_PACKAGES : sells
    PROFILES ||--o{ USER_PACKAGES : purchases
    MEMBERSHIP_PACKAGES ||--o{ USER_PACKAGES : instance_of
    TENANTS ||--o{ PROMO_CODES : issues

    MEMBERSHIP_PACKAGES {
        uuid id PK
        int credits
        decimal price
    }

    USER_PACKAGES {
        uuid id PK
        int credits_remaining
        timestamptz expires_at
    }
```

---

## 6. Cardinality Reference

| Parent | Child | Relationship | Notes |
|--------|-------|--------------|-------|
| tenants | venues | 1:N | |
| venues | resources | 1:N | |
| resources | bookings | 1:N | Overlap prevented by constraint |
| profiles | bookings | 1:N | As player |
| academy_programs | batches | 1:N | |
| batches | enrollments | 1:N | Capacity limited |
| batches | batch_sessions | 1:N | |
| batch_sessions | attendance_records | 1:N | One per student per session |
| profiles | tenant_members | N:M | Via junction table |
| profiles | batch_coaches | N:M | Via junction table |

---

## 7. Key Foreign Key Graph

```
tenants (root)
  ├── venues
  │     ├── resources
  │     │     ├── bookings
  │     │     ├── slot_holds
  │     │     └── waitlist_entries
  │     ├── operating_hours
  │     ├── blackout_periods
  │     └── academy_programs
  │           └── batches
  │                 ├── batch_coaches
  │                 ├── enrollments
  │                 └── batch_sessions
  │                       └── attendance_records
  ├── tenant_members
  ├── pricing_rules
  ├── membership_packages
  │     └── user_packages
  └── promo_codes

profiles (global)
  ├── tenant_members
  ├── bookings (as user_id)
  ├── enrollments (as student_id)
  ├── notifications
  └── audit_logs (as actor_id)
```

---

## 8. Denormalization Notes

| Field | Table | Reason |
|-------|-------|--------|
| `sport_type` | bookings | Avoid join for sport-filtered reports |
| `tenant_id` | bookings, enrollments, etc. | RLS performance — filter without joins |
| `email` | profiles | Display without auth.users join |

---

## 9. Related Documents

- [Database Tables](./database-tables.md)
- [Database Design](./database-design.md)
- [API Design](./api-design.md)
