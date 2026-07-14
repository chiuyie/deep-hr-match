# Architecture

## System Overview

Deep HR Match is a **Next.js 16 App Router** application backed by **Supabase** (PostgreSQL, Auth, Storage) with **Stripe** for payments. Business logic runs primarily as **React Server Components** and **Server Actions** — there is no separate REST API layer except the Stripe webhook.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Public   │  │Candidate │  │ Employer │  │ Admin           │ │
│  │ Landing  │  │ Portal   │  │ Portal   │  │ Portal          │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────┘ │
│         │              │              │              │          │
│         └──────────────┴──────────────┴──────────────┘          │
│                            │                                    │
│              Server Actions + RSC (lib/*)                       │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐                 │
│         ▼                  ▼                  ▼                 │
│   Supabase Auth    Supabase Postgres    Supabase Storage        │
│                            │                                    │
│                    Stripe Webhook (unlocks)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (email/password) |
| Files | Supabase Storage (private buckets) |
| Payments | Stripe Checkout (test mode) |
| Validation | Zod + React Hook Form |
| Unit tests | Vitest |

> Check `node_modules/next/dist/docs/` and `AGENTS.md` before changing Next.js APIs — this project uses a newer Next.js with breaking changes.

## Portals & Routes

### Public

| Route | File | Notes |
|-------|------|-------|
| `/` | `app/page.tsx` | Marketing landing page |

### Authentication

| Route | File | Notes |
|-------|------|-------|
| `/auth/sign-in?role=candidate` | `app/auth/sign-in/page.tsx` | Candidate portal |
| `/auth/sign-in?role=employer` | `app/auth/sign-in/page.tsx` | Employer portal |
| `/auth/sign-up?role=candidate` | `app/auth/sign-up/page.tsx` | Candidate registration |
| `/auth/sign-up?role=employer` | `app/auth/sign-up/page.tsx` | Employer registration |
| `/auth/admin/sign-in` | `app/auth/admin/sign-in/page.tsx` | Admin only |

### Candidate Portal

| Route | Purpose |
|-------|---------|
| `/candidate` | Dashboard (after onboarding) |
| `/candidate/profile` | Profile form — onboarding step 1 |
| `/candidate/cv` | CV upload — step 2 |
| `/candidate/matrix` | 7^7 matrix — step 3 |
| `/candidate/status` | Readiness checklist |

**Layout:** `app/candidate/layout.tsx` enforces onboarding order. Pages wrap content in per-page `DashboardShell`.

### Employer Portal

| Route | Purpose |
|-------|---------|
| `/employer` | Dashboard |
| `/employer/company` | Employer profile |
| `/employer/jobs` | Job list |
| `/employer/jobs/new` | Create job |
| `/employer/jobs/[id]` | Edit job |
| `/employer/jobs/[id]/jd` | JD upload |
| `/employer/jobs/[id]/matrix` | Job 7^7 form |
| `/employer/jobs/[id]/matching` | Match results |
| `/employer/jobs/[id]/unlocked` | Unlocked candidates (per job) |
| `/employer/unlocked` | All unlocked candidates |

**Layout:** `app/employer/layout.tsx` wraps all routes in `EmployerLayoutShell` (shared header + sidebar).

### Admin Portal

| Route | Purpose |
|-------|---------|
| `/admin` | Metrics dashboard |
| `/admin/candidates` | All candidates |
| `/admin/employers` | All employers |
| `/admin/jobs` | All jobs |
| `/admin/matching` | All match results |
| `/admin/matrix` | 7^7 CRUD |
| `/admin/payments` | Payment records |
| `/admin/unlocks` | Unlock records |
| `/admin/files` | CV/JD file metadata |

**Layout:** No shared layout file — each page uses `DashboardShell` directly.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stripe/webhook` | POST | Stripe `checkout.session.completed` handler |

## Layout Component Hierarchy

```
app/layout.tsx
├── ThemeProvider, Toaster
│
├── Public pages → PublicNav + PublicFooter
│
└── Dashboard portals
    └── DashboardChrome (server component)
        ├── DashboardHeader (client) — logo, collapse, title, theme
        ├── DashboardSidebar (client) — role nav from dashboard-nav.ts
        └── <main> scrollable content
            └── {children}

EmployerLayoutShell (client)
└── reads pathname → getEmployerPageMeta() → DashboardChrome props

DashboardShell
└── thin wrapper → DashboardChrome (candidate + admin pages)
```

### Key layout files

| File | Role |
|------|------|
| `components/layout/dashboard-chrome.tsx` | Server-side dashboard frame |
| `components/layout/dashboard-header.tsx` | Unified header row |
| `components/layout/dashboard-sidebar.tsx` | Role-based navigation |
| `components/layout/employer-layout-shell.tsx` | Employer route metadata + chrome |
| `components/layout/dashboard-shell.tsx` | Per-page wrapper (candidate/admin) |
| `lib/constants/dashboard-nav.ts` | Sidebar items per role |
| `lib/constants/employer-pages.ts` | Employer page titles/descriptions |

**Important:** `DashboardChrome` must remain a server component. Trapping page content inside unnecessary client boundaries caused a prior blank-dashboard bug on employer pages.

## Core User Flows

### Candidate onboarding

```
Sign up → Profile (≥60% completion) → CV upload → 7^7 matrix → Mark ready
                                                              ↓
                                              status = ready_for_matching
```

Enforced in `app/candidate/layout.tsx` via `lib/candidate/onboarding.ts`.

### Employer job lifecycle

```
Employer profile → New job → (optional) JD upload → Job 7^7 form
    → Generate matching → View anonymous results → Stripe unlock → Full PII
```

### Admin bootstrap

```
npm run create-admin → /auth/admin/sign-in → /admin
```

## Middleware

`middleware.ts` delegates to `lib/supabase/middleware.ts`:

1. Refreshes Supabase session cookies on every matched request
2. Sets `x-pathname` header (used by candidate onboarding layout)
3. Redirects unauthenticated users away from `/candidate`, `/employer`, `/admin`

Middleware does **not** enforce role matching — that happens in layouts/pages via `requireRole()`.

## Module Layout (`lib/`)

| Module | Responsibility |
|--------|----------------|
| `lib/supabase/` | Browser client, server client, service client, middleware, env |
| `lib/auth/` | Session helpers, sign-in/up actions, unlock checks |
| `lib/candidate/` | Profile, CV, matrix actions, onboarding logic |
| `lib/employer/` | Profile, jobs, JD, matrix, matching, unlock actions |
| `lib/admin/` | Matrix CRUD actions |
| `lib/matching/` | Placeholder matching engine |
| `lib/stripe/` | Stripe client, app URL helper |
| `lib/validations/` | Zod schemas |
| `lib/constants/` | Branding, nav, job form config, employer pages |
| `lib/utils/` | Profile completion, job form parsing |
