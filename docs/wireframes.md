# Wireframes

**Product:** PLAYHUB  
**Version:** 0.1.0  
**Last Updated:** 2026-07-09

---

## 1. Design Principles

- **Mobile-first** — Primary viewport 375px; progressive enhancement to desktop
- **Sport-contextual** — Sport icon/color theming per context
- **Action-oriented** — Primary CTA always visible (Book, Enroll, Mark Attendance)
- **Real-time feedback** — Slot states: available, held, booked, selected
- **Shadcn UI patterns** — Cards, sheets (mobile), dialogs, data tables (desktop)

**Color semantics:**

| State | Color |
|-------|-------|
| Available | Green |
| Selected | Primary brand |
| Held | Amber |
| Booked | Gray/muted |
| Peak pricing | Orange badge |

---

## 2. Landing Page

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo PLAYHUB]          Sports ▾  Venues  Academies  [Login]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     Book Courts. Join Academies. Play More.                  │
│     ─────────────────────────────────────                    │
│     Real-time slot booking for 10+ sports                    │
│                                                             │
│     [🔍 Search sport, city, venue...        ] [Search]      │
│                                                             │
│     ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│     │🏸 Badmi│ │🎾 Tennis│ │🏏 Cricket│ │⚽ Football│        │
│     └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│                                                             │
│     ── Popular Venues Near You ──                            │
│     ┌──────────────────┐ ┌──────────────────┐             │
│     │ [img] Smash Arena │ │ [img] Aqua Sports │             │
│     │ Badminton • 2km   │ │ Swimming • 5km    │             │
│     │ From ₹500/hr      │ │ From ₹300/hr      │             │
│     │ [Book Now]        │ │ [Book Now]        │             │
│     └──────────────────┘ └──────────────────┘             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Footer: About | Privacy | Terms | Contact                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Venue Discovery (Map + List)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back    Find Venues                    [List | Map]       │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Sport ▾] [Date ▾] [Time ▾] [Price ▾] [More ▾]  │
├──────────────────────────┬──────────────────────────────────┤
│                          │  ┌────────────────────────────┐ │
│                          │  │ Smash Arena                │ │
│      [ LEAFLET MAP ]     │  │ ⭐ 4.5 • 2.1 km            │ │
│                          │  │ Badminton, Pickleball      │ │
│    📍 📍                 │  │ From ₹500 • 4 courts       │ │
│         📍               │  │ [View & Book]              │ │
│                          │  └────────────────────────────┘ │
│                          │  ┌────────────────────────────┐ │
│                          │  │ Green Field FC             │ │
│                          │  │ Football • 3.5 km          │ │
│                          │  │ [View & Book]              │ │
│                          │  └────────────────────────────┘ │
└──────────────────────────┴──────────────────────────────────┘
```

---

## 4. Venue Profile & Booking

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back                                         [Share] [♡]  │
├─────────────────────────────────────────────────────────────┤
│ [━━━━━━━━ Hero Image Gallery ━━━━━━━━]                      │
│ Smash Arena Badminton Club                                   │
│ 📍 Andheri West, Mumbai  •  📞 +91 98765 43210              │
│ Badminton • Pickleball  •  🅿️ Parking  •  🚿 Showers        │
├─────────────────────────────────────────────────────────────┤
│ [Book Slots] [Academies] [About] [Reviews*]                  │
├─────────────────────────────────────────────────────────────┤
│ Select Date:  [<]  Thu, 10 Jul 2026  [>]                    │
│                                                             │
│ Court 1 (Badminton)                                          │
│ ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐           │
│ │06-07 ││07-08 ││08-09 ││09-10 ││10-11 ││11-12 │           │
│ │ ₹400 ││ ₹400 ││ ₹600 ││ ₹600 ││ BOOK ││ BOOK │           │
│ │  ✓   ││  ✓   ││ peak ││ peak ││  ✗   ││  ✗   │           │
│ └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘           │
│                                                             │
│ Court 2 (Badminton)                                          │
│ ┌──────┐┌──────┐┌──────┐ ...                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Selected: Court 1 • 07:00–08:00 • ₹400     [Book ₹400 →]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Booking Checkout

```
┌─────────────────────────────────────────────────────────────┐
│ Confirm Booking                                              │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Smash Arena — Court 1                                   │ │
│ │ Thu, 10 Jul • 07:00 – 08:00                             │ │
│ │ Badminton • 60 min                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Promo code: [____________] [Apply]                          │
│                                                             │
│ Subtotal                              ₹400                  │
│ Discount (SUMMER10)                    -₹40                 │
│ ─────────────────────────────────────────────               │
│ Total                                 ₹360                  │
│                                                             │
│ Payment:  (•) Pay at venue   ( ) UPI* (coming soon)       │
│                                                             │
│ Notes: [________________________________]                   │
│                                                             │
│              [Confirm Booking]                               │
│                                                             │
│ ⏱ Slot held for 9:42                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Player Dashboard — My Bookings

```
┌─────────────────────────────────────────────────────────────┐
│ [☰]  PLAYHUB                    [🔔 2]  [Avatar ▾]          │
├─────────────────────────────────────────────────────────────┤
│ My Bookings                                                  │
│ [Upcoming] [Past] [Cancelled]                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏸 Smash Arena — Court 1                                │ │
│ │ Today, 07:00 – 08:00                                    │ │
│ │ Status: Confirmed  •  ₹360  •  Pay at venue             │ │
│ │ [Get Directions]  [Cancel]  [Add to Calendar*]            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏊 Aqua Sports — Lane 3                                 │ │
│ │ Sat, 12 Jul • 06:00 – 06:30                             │ │
│ │ Status: Confirmed                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Tenant Dashboard — Overview

```
┌──────────┬──────────────────────────────────────────────────┐
│ PLAYHUB  │  Smash Arena ▾          [🔔] [Avatar ▾]          │
│──────────│──────────────────────────────────────────────────│
│ Dashboard│  Good morning, Raj!                               │
│ Bookings │                                                   │
│ Venues   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ Academies│  │Today's  │ │Week     │ │Utiliza- │ │Active   ││
│ Members  │  │Bookings │ │Revenue  │ │tion     │ │Academy  ││
│ Staff    │  │   24    │ │ ₹18,400 │ │  78%    │ │Students ││
│ Reports  │  │         │ │         │ │         │ │   156  ││
│ Settings │  └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│          │                                                   │
│          │  ┌──────────────────────┐ ┌───────────────────┐ │
│          │  │ Bookings Chart       │ │ Sport Breakdown   │ │
│          │  │ [RECHARTS LINE]      │ │ [RECHARTS PIE]    │ │
│          │  └──────────────────────┘ └───────────────────┘ │
│          │                                                   │
│          │  ── Recent Bookings ──                            │
│          │  │ Time  │ Court  │ Player    │ Status │ Amount │ │
│          │  │ 07:00 │ Crt 1  │ Arjun S.  │ ✓      │ ₹400  │ │
│          │  │ 08:00 │ Crt 2  │ Walk-in   │ ✓      │ ₹500  │ │
└──────────┴──────────────────────────────────────────────────┘
```

---

## 8. Staff Quick Booking (POS Style)

```
┌─────────────────────────────────────────────────────────────┐
│ Quick Booking                           [Walk-in Mode: ON]  │
├─────────────────────────────────────────────────────────────┤
│ Player: [Search name/phone___________] or [+ Guest]         │
│ Venue:  [Smash Arena ▾]   Date: [Today ▾]                   │
├─────────────────────────────────────────────────────────────┤
│ ┌ Court 1 ─────────────────────────────────────────────┐   │
│ │ [06][07][08][09][10][11][12][13][14][15][16][17][18]  │   │
│ └──────────────────────────────────────────────────────┘   │
│ ┌ Court 2 ─────────────────────────────────────────────┐   │
│ │ [06][07][08][09][10][11][12][13][14][15][16][17][18]  │   │
│ └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Selected: Court 1 • 10:00-11:00 • ₹600 (Peak)              │
│ Payment: [Cash ▾]  [Book & Print*]  [Book]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Academy Program Page (Public)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Green Field FC Academy                                     │
├─────────────────────────────────────────────────────────────┤
│ [━━━━━━ Hero Image ━━━━━━]                                  │
│ Football Academy • Est. 2018                                 │
│ 📍 Green Field, Powai                                         │
│ Ages 6–18 • All levels                                       │
├─────────────────────────────────────────────────────────────┤
│ About the Program                                            │
│ Lorem ipsum dolor sit amet...                                │
│                                                             │
│ ── Open Batches ──                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ U-10 Morning Batch                                      │ │
│ │ Mon, Wed, Fri • 07:00–08:30 • Coach: Priya              │ │
│ │ 8/20 spots • ₹3,000/month                               │ │
│ │ [Enroll Now]                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ U-14 Evening Batch                                      │ │
│ │ Tue, Thu, Sat • 17:00–18:30 • Full                      │ │
│ │ [Join Waitlist]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Coach Attendance Screen

```
┌─────────────────────────────────────────────────────────────┐
│ ← U-10 Morning Batch                                         │
│ Session: Mon, 7 Jul 2026 • 07:00–08:30                      │
├─────────────────────────────────────────────────────────────┤
│ [Mark All Present]              Attendance: 6/8              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [✓] Rahul Sharma        age 9    [Present ▾]            │ │
│ │ [✓] Aisha Patel         age 10   [Present ▾]            │ │
│ │ [ ] Vikram Singh        age 9    [Absent  ▾]            │ │
│ │ [✓] Meera Joshi         age 8    [Late    ▾]            │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Session notes: [________________________________]            │
│                                                             │
│                    [Save Attendance]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Onboarding Wizard (New Tenant)

```
┌─────────────────────────────────────────────────────────────┐
│ Setup Your Organization                    Step 2 of 4      │
│ ●━━━━●━━━━○━━━━○                                            │
├─────────────────────────────────────────────────────────────┤
│ Add Your First Venue                                         │
│                                                             │
│ Venue name:    [________________________]                   │
│ Address:       [________________________]                   │
│ City:          [________________________]                   │
│ Pin on map:    [ Mini Leaflet Map — draggable pin ]         │
│                                                             │
│ Sports offered:                                              │
│ [✓] Badminton  [✓] Pickleball  [ ] Tennis  [ ] ...         │
│                                                             │
│              [Back]              [Continue →]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Mobile Navigation (Bottom Tab)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    (Screen content)                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [🏠 Home]  [🔍 Explore]  [📅 Bookings]  [🎓 Academy]  [👤] │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Component Mapping (Shadcn UI)

| Wireframe Element | Component |
|-------------------|-----------|
| Sport chips | `Badge` + custom `SportIcon` |
| Slot grid | Custom `SlotPicker` + `Button` variants |
| Venue cards | `Card`, `CardHeader`, `CardContent` |
| Filters | `Select`, `Popover`, `Calendar` |
| Dashboard sidebar | `Sheet` (mobile), fixed sidebar (desktop) |
| Data tables | `DataTable` (TanStack Table) |
| Charts | Recharts in `Card` |
| Booking sheet | `Sheet` (bottom on mobile) |

---

## 14. Related Documents

- [Navigation Flow](./navigation-flow.md)
- [Feature List](./feature-list.md)
- [Software Requirements](./software-requirements.md)
