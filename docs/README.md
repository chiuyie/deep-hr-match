# Deep HR Match — Technical Documentation

This folder contains technical reference for developers and collaborators. For quick onboarding, start with the root [README](../README.md), then read the docs below in order.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System overview, portals, layout components, data flow |
| [Database](./database.md) | Schema, enums, relationships, migrations, seed data |
| [Authentication](./authentication.md) | Sign-up/sign-in, sessions, middleware, DB triggers |
| [Security](./security.md) | RLS policies, PII protection, role model |
| [Server Actions](./server-actions.md) | All server actions by module (candidate, employer, admin, auth) |
| [Job Lifecycle](./job-lifecycle.md) | Posted job rules, match snapshots, refresh, unlocks |
| [Matching Engine Integration](./matching-engine-integration.md) | External matching service + shared DB contract |
| [Storage](./storage.md) | Supabase Storage buckets, paths, signed URLs |
| [Matching Engine](./matching-engine.md) | Phase 1 placeholder, trigger, snapshot helpers |
| [7^7 Matching Language](./matrix-matching-language.md) | Form structure, word matching rules, seeding |
| [Payments](./payments.md) | Stripe Checkout, webhooks, unlock flow |
| [Deployment](./deployment.md) | Environment variables, Supabase, Vercel, migrations |
| [Testing](./testing.md) | Vitest unit tests, manual QA, demo data |
| [Development Guide](./development-guide.md) | Conventions, folder structure, scripts, contributing |

## Quick Links

- **Run locally:** `npm install` → configure `.env.local` → apply migrations → `npm run dev`
- **Run tests:** `npm test`
- **Seed 7^7 form:** `npm run seed-matrix-77` (or minimal set in `supabase/seed.sql`)
- **Bootstrap admin:** `npm run create-admin`

## Phase 1 Scope

Deep HR Match Phase 1 MVP delivers:

- Three portals: candidate, employer, admin
- 7^7 Matching Language forms (dynamic matrix)
- Multi-section job creation with `form_data` JSONB
- Placeholder matching engine (final algorithm in **separate repo** — same DB)
- Stripe-powered candidate profile unlocks
- Row Level Security on all data
