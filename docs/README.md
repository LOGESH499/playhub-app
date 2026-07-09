# PLAYHUB Documentation Index

Welcome to the PLAYHUB technical and product documentation. This folder contains all planning artifacts required before application development begins.

## How to Read This Documentation

1. **Product & Business** — Start with [Business Requirements](./business-requirements.md) and [Feature List](./feature-list.md).
2. **Engineering** — Read [Project Rules](./project-rules.md), [Software Requirements](./software-requirements.md), [Architecture](./architecture.md), and [Folder Structure](./folder-structure.md).
3. **Data Layer** — Review [Database Design](./database-design.md), [Database Tables](./database-tables.md), and [Entity Relationship Diagram](./entity-relationship-diagram.md).
4. **APIs & Integration** — See [API Design](./api-design.md), [Authentication Flow](./authentication-flow.md), and [Real-Time Architecture](./realtime-architecture.md).
5. **UX** — Consult [Wireframes](./wireframes.md) and [Navigation Flow](./navigation-flow.md).
6. **Delivery** — Follow [Development Roadmap](./development-roadmap.md), [Milestones](./milestones.md), and [Sprint Plan](./sprint-plan.md).
7. **Operations** — Use [Security Plan](./security-plan.md), [Deployment Guide](./deployment-guide.md), and [Testing Strategy](./testing-strategy.md).

## Document Conventions

- **MUST** — Mandatory requirement
- **SHOULD** — Strong recommendation
- **MAY** — Optional enhancement
- Version numbers refer to stack targets at project inception (Next.js 16, React 19)
- All timestamps and IDs use UTC unless stated otherwise
- Currency defaults to INR for Indian market; schema supports multi-currency extension

## Glossary

| Term | Definition |
|------|------------|
| **Venue** | A physical sports facility (single or multi-sport) |
| **Court / Lane / Pitch** | Bookable resource unit within a venue |
| **Slot** | A time-bounded reservation window on a resource |
| **Academy** | Coaching program with batches, coaches, and enrolled students |
| **Tenant** | Organization that owns one or more venues (multi-tenant SaaS) |
| **Player** | End user who books slots or enrolls in academies |
| **Staff** | Venue operators, coaches, and front-desk personnel |

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-07-09 | 0.1.1 | Project rules documented |
| 2026-07-09 | 0.1.0 | Initial documentation release |
