# Deep HR Match

Candidate–job matching SaaS built around the proprietary **7^7 Matching Language** framework.

**Phase 1 MVP** — multi-portal auth, dynamic 7^7 forms, multi-section job creation, file uploads, placeholder matching engine, and Stripe-powered candidate profile unlocks.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 16** (App Router) + **React 19** + TypeScript |
| Styling | **Tailwind CSS 4** + **shadcn/ui** |
| Backend | **Supabase** (PostgreSQL, Auth, Storage, RLS) |
| Payments | **Stripe** Checkout (test mode) |
| Forms / validation | **Zod** + **React Hook Form** |

> **Note for contributors:** This project uses a newer Next.js version with breaking changes from older docs. Check `node_modules/next/dist/docs/` and `AGENTS.md` before changing framework APIs.

---

## User Roles & Portals

Three roles, three sign-in experiences:

| Role | Sign in | Sign up | Dashboard |
|------|---------|---------|-----------|
| **Candidate** | `/auth/sign-in?role=candidate` | `/auth/sign-up?role=candidate` | `/candidate` |
| **Employer** | `/auth/sign-in?role=employer` | `/auth/sign-up?role=employer` | `/employer` |
| **Admin** | `/auth/admin/sign-in` | — (bootstrap via script) | `/admin` |

- Candidates and employers share `/auth/sign-in` and `/auth/sign-up` with a `?role=` query param.
- Signing in on the wrong portal shows an informational notice (account exists, but use the correct portal).
- Admin accounts cannot sign in through the candidate/employer portals.

---

## Features

### Candidates
- Sign up, build profile, upload CV
- Complete dynamic **7^7 Matching Language** matrix form
- Guided onboarding flow (profile → CV → matrix → ready)
- Track profile completion % and matching readiness
- Wait for employer contact outside the platform after matching

### Employers
- **Employer Profile** (company + contact details)
- Unlimited free job postings via multi-section job creation form
- JD upload and job-specific 7^7 matrix form
- Free placeholder matching result generation
- View anonymous ranked candidates
- Pay to unlock selected candidate profiles (contact info + CV)

### Admin
- Dashboard metrics
- Manage 7^7 categories, questions, and options
- View candidates, employers, jobs, matches, payments, unlocks, and files
- Admin bootstrapped via `npm run create-admin`

---

## Quick Start (New Developer)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/deep-hr-match.git
cd deep-hr-match
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server scripts only) |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (`http://localhost:3000` locally) |
| `ADMIN_EMAIL` | For admin script | First admin email |
| `ADMIN_PASSWORD` | For admin script | First admin password (min 8 chars) |
| `ADMIN_NAME` | Optional | Admin display name |
| `STRIPE_SECRET_KEY` | For payments | Stripe test secret key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret |
| `SUPABASE_DB_URL` | Optional | Direct Postgres URL for migration scripts |
| `EMPLOYER_EMAIL` | Optional | Target employer for `seed-employer-jobs` |
| `DUMMY_USER_PASSWORD` | Optional | Password for `seed-dummy-users` (default: `DemoUser123!`) |

### 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run **all migrations in order** in the Supabase SQL Editor (or via `SUPABASE_DB_URL`):

| # | File | Purpose |
|---|------|---------|
| 001 | `supabase/migrations/001_schema.sql` | Core tables, enums, `handle_new_user` trigger |
| 002 | `supabase/migrations/002_rls.sql` | Row Level Security policies |
| 003 | `supabase/migrations/003_storage.sql` | Storage buckets for CV/JD files |
| 004 | `supabase/migrations/004_job_form_data.sql` | `form_data` JSONB column on `jobs` |
| 005 | `supabase/migrations/005_role_security.sql` | Role-change protection + signup metadata |
| 006 | `supabase/migrations/006_fix_signup_trigger.sql` | **Required** — fixes signup trigger + RLS for new users |

3. Run seed data for 7^7 matrix placeholders:

```sql
-- Paste contents of supabase/seed.sql in SQL Editor
```

4. **Verify signup works.** If sign-up returns *"Database error saving new user"*, migration `006` has not been applied. You can also run:

```bash
node scripts/apply-signup-fix.mjs
```

(requires `SUPABASE_DB_URL` or manual paste of `006_fix_signup_trigger.sql`)

### 4. Bootstrap admin user

```bash
npm run create-admin
```

Then sign in at `/auth/admin/sign-in` using `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 5. Seed demo data (optional)

```bash
# 5 dummy employers + 5 dummy candidates (ready_for_matching)
npm run seed-dummy-users

# 5 dummy jobs for first employer (or EMPLOYER_EMAIL in .env.local)
npm run seed-employer-jobs
```

**Demo accounts** (after `seed-dummy-users`):

| Type | Emails | Password |
|------|--------|----------|
| Employers | `employer-demo-1@deephrmatch.test` … `employer-demo-5@deephrmatch.test` | `DemoUser123!` |
| Candidates | `candidate-demo-1@deephrmatch.test` … `candidate-demo-5@deephrmatch.test` | `DemoUser123!` |

Scripts are idempotent — existing accounts get profile updates, not duplicates.

### 6. Stripe setup (test mode)

1. Create a Stripe account and get test API keys
2. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env.local`
3. Forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Use `npm run dev:turbo` for Turbopack (default `dev` uses webpack for stability).

---

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (webpack) |
| `npm run dev:turbo` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests once (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run create-admin` | Create/update bootstrap admin user |
| `npm run seed-dummy-users` | Seed 5 demo employers + 5 demo candidates |
| `npm run seed-employer-jobs` | Seed 5 demo jobs for an employer account |

---

## Testing

### Automated tests (Vitest)

Unit tests run with **Vitest** — no browser or Supabase connection required.

```bash
npm test              # run once (CI-friendly)
npm run test:watch    # re-run on file changes
```

| Test file | What it covers |
|-----------|----------------|
| `lib/utils/profile.test.ts` | Profile completion %, comma lists, formatting helpers |
| `lib/candidate/onboarding.test.ts` | Onboarding step order, path guards, checklist completion |
| `lib/utils/job-form.test.ts` | Job form parsing, legacy column mapping, `form_data` payload |
| `lib/validations/schemas.test.ts` | Zod schemas for sign-up, profiles, jobs |

Config: `vitest.config.ts` (Node environment, `@/` path alias).

**Not yet covered:** integration tests (Supabase/Auth actions), E2E tests (Playwright), CI workflow.

### Manual QA & demo data

Use seed scripts and the checklist below for flows that need a live database, Stripe, or file uploads.

| Purpose | How to get it |
|---------|----------------|
| Unit tests | `npm test` |
| Admin | `npm run create-admin` → sign in at `/auth/admin/sign-in` |
| Demo employers (×5) | `npm run seed-dummy-users` → `employer-demo-1@deephrmatch.test` … `-5@` |
| Demo candidates (×5) | `npm run seed-dummy-users` → `candidate-demo-1@deephrmatch.test` … `-5@` |
| Demo jobs (×5) | `npm run seed-employer-jobs` (optionally set `EMPLOYER_EMAIL`) |
| Shared demo password | `DemoUser123!` (override with `DUMMY_USER_PASSWORD`) |

Seed scripts are idempotent — safe to re-run; they update existing records instead of duplicating.

### Manual QA checklist

#### Auth & portals

- [ ] Candidate sign-up at `/auth/sign-up?role=candidate` creates account + profile
- [ ] Employer sign-up at `/auth/sign-up?role=employer` creates account + employer profile
- [ ] Sign-in on correct portal redirects to the right dashboard
- [ ] Sign-in on wrong portal shows informational notice (not a hard error)
- [ ] Admin can only sign in at `/auth/admin/sign-in`
- [ ] Unauthenticated access to `/candidate`, `/employer`, `/admin` redirects to sign-in
- [ ] Sign-up failure shows useful error (e.g. email exists, database setup) — requires migration 006

#### Candidate flow

- [ ] Profile form saves and updates completion %
- [ ] Onboarding enforces order: profile (≥60%) → CV → matrix → ready
- [ ] CV upload works (Supabase Storage bucket from migration 003)
- [ ] 7^7 matrix answers save
- [ ] Marking ready sets `status = ready_for_matching`
- [ ] Dashboard and status page reflect current step

#### Employer flow

- [ ] Employer profile saves at `/employer/company`
- [ ] Job list shows jobs at `/employer/jobs`
- [ ] New job form saves (all sections; sticky Save button visible)
- [ ] Edit job loads existing data at `/employer/jobs/[id]`
- [ ] JD upload works at `/employer/jobs/[id]/jd`
- [ ] Job 7^7 matrix saves at `/employer/jobs/[id]/matrix`
- [ ] Generate Matching returns ranked anonymous candidates (needs `ready_for_matching` candidates)
- [ ] Matching results show placeholder/demo labels
- [ ] Unlock checkout opens Stripe (test mode) and completes with webhook forwarded
- [ ] Unlocked candidates show full PII at `/employer/jobs/[id]/unlocked`

#### Admin flow

- [ ] Dashboard metrics load
- [ ] Matrix CRUD (categories, questions, options)
- [ ] Lists: candidates, employers, jobs, matches, payments, unlocks, files

#### Layout & UX

- [ ] Employer pages show sticky header + sidebar on all routes
- [ ] Page titles match route (via `employer-pages.ts`)
- [ ] Candidate/admin dashboard chrome renders content (not blank main area)
- [ ] Light/dark theme toggle works on public and dashboard pages

### Stripe test mode

Unlock payments must be tested with Stripe test keys and a local webhook forwarder:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use [Stripe test cards](https://docs.stripe.com/testing#cards) (e.g. `4242 4242 4242 4242`). Verify:

- [ ] Checkout session created from matching results table
- [ ] Webhook marks payment as paid
- [ ] Unlock record created; candidate PII visible to employer

### Database / migration checks

| Check | Expected |
|-------|----------|
| Migration 004 applied | Job save accepts `form_data` JSONB |
| Migration 006 applied | New sign-ups succeed without HTTP 500 |
| `supabase/seed.sql` applied | 7^7 matrix categories/questions exist in admin |

### Scripts useful for test setup

```bash
npm test                      # Unit tests (Vitest)
npm run create-admin          # Admin account
npm run seed-dummy-users      # 5 employers + 5 candidates (ready_for_matching)
npm run seed-employer-jobs    # 5 jobs for an employer
node scripts/apply-signup-fix.mjs   # Apply migration 006 if sign-up fails
```

### Future test coverage

| Layer | Status | Suggested next steps |
|-------|--------|----------------------|
| Unit | **Done** (Vitest) | Add tests as new pure helpers/schemas are added |
| Integration | Not started | Auth actions, matching engine, unlock checks with mocked Supabase |
| E2E | Not started | Playwright happy paths per portal |
| CI | Not started | Run `npm test` + `npm run lint` on pull requests |

---

## Project Structure

```
app/
  page.tsx                    # Marketing landing page
  auth/
    sign-in/                  # Candidate & employer sign-in (?role=)
    sign-up/                  # Candidate & employer sign-up (?role=)
    admin/sign-in/            # Admin-only sign-in
  candidate/                  # Candidate portal
    profile/                  # Profile form (onboarding step 1)
    cv/                       # CV upload (step 2)
    matrix/                   # 7^7 form (step 3)
    status/                   # Readiness checklist
  employer/                   # Employer portal (shared layout shell)
    company/                  # Employer profile
    jobs/                     # Job list, create, edit, JD, matrix, matching, unlocks
    unlocked/                 # All unlocked candidates
  admin/                      # Admin portal
  api/stripe/webhook/         # Stripe webhook handler

components/
  ui/                         # shadcn/ui primitives
  layout/
    dashboard-chrome.tsx      # Shared dashboard frame (header + sidebar + scroll area)
    dashboard-header.tsx      # Unified header (logo, collapse, title)
    dashboard-sidebar.tsx     # Role-based side navigation
    employer-layout-shell.tsx # Employer route titles + chrome wrapper
    dashboard-shell.tsx       # Per-page shell (candidate + admin pages)
  forms/
    job-creation/             # Multi-section employer job form
    matrix-form.tsx           # 7^7 matrix form (candidate + job)
  matching/
    matching-results-table.tsx
  auth/                       # Wrong-portal notice, Supabase setup notice

lib/
  supabase/                   # Browser client, server client, middleware, env helpers
  auth/                       # Session, actions (sign-in/up), unlock checks
  candidate/                  # Profile/CV/matrix actions, onboarding flow
  employer/                   # Profile, job, matrix, matching, unlock actions
  admin/                      # Admin CRUD actions
  matching/engine.ts          # Placeholder matching engine
  stripe/                     # Stripe client + app URL helper
  validations/schemas.ts      # Zod schemas
  constants/
    branding.ts               # 7^7 framework naming
    dashboard-nav.ts          # Sidebar nav items per role
    employer-pages.ts         # Employer page titles/descriptions
    job-form.ts               # Job creation form field config
  utils/                      # Profile completion, job form parsing
  utils/profile.test.ts       # Vitest — profile helpers
  utils/job-form.test.ts      # Vitest — job form parsing
  candidate/onboarding.test.ts
  validations/schemas.test.ts

scripts/
  create-admin.mjs            # Bootstrap admin auth + role
  seed-dummy-users.mjs        # Demo employers + candidates
  seed-employer-jobs.mjs      # Demo jobs for an employer
  apply-signup-fix.mjs        # Apply migration 006 to remote DB

supabase/
  migrations/                 # 001–006 (run in order)
  seed.sql                    # Placeholder 7^7 categories/questions/options

types/database.ts             # Shared TypeScript types
vitest.config.ts              # Vitest config (@ path alias)
```

---

## Architecture Notes

### Dashboard layout

- **Employer portal** uses a shared `EmployerLayoutShell` in `app/employer/layout.tsx`. All employer pages inherit sticky header + sidebar; page titles come from `lib/constants/employer-pages.ts`.
- **Candidate** and **admin** pages still use per-page `DashboardShell` wrapping `DashboardChrome`.
- `DashboardChrome` is a **server component** — page content must not be trapped inside unnecessary client boundaries (this caused a prior blank-dashboard bug).

### Candidate onboarding

Enforced in `app/candidate/layout.tsx`:

```
profile (≥60% completion) → CV upload → 7^7 matrix → ready_for_matching
```

Candidates are redirected to the current required step until the checklist is complete.

### Auth provisioning

On sign-up, Supabase Auth fires `handle_new_user()` which:

1. Inserts a row into `public.users` with role from `user_metadata.role` (`employer` or `candidate`)
2. Creates `employer_profiles` or `candidate_profiles` automatically

Migration **006** is critical — without it, the trigger fails under RLS and signup returns HTTP 500.

### Job creation

Employers use a multi-section form (`components/forms/job-creation/`) with:

- Step nav: Employer Profile → Post a Job
- Section nav: job identification, requirements, compensation, benefits, preferred background
- `form_data` JSONB on `jobs` (migration 004) stores extended form fields

### Matching engine (Phase 1)

Final algorithm is **not confirmed**. Current implementation:

- Structure in `lib/matching/engine.ts`
- Placeholder/demo scores labeled in UI
- `is_placeholder: true` on all match results
- Only candidates with `status = 'ready_for_matching'` are included

```typescript
// TODO: Replace placeholder scoring logic after Deep HR Match matching algorithm is finalized.
```

---

## Employer Job Flow

```
Employer Profile → New Job → (optional) JD Upload → 7^7 Job Form → Generate Matching → Unlock Candidates
```

| Route | Purpose |
|-------|---------|
| `/employer/company` | Employer profile |
| `/employer/jobs` | Job list |
| `/employer/jobs/new` | Create job |
| `/employer/jobs/[id]` | Edit job |
| `/employer/jobs/[id]/jd` | Upload job description file |
| `/employer/jobs/[id]/matrix` | Job 7^7 form |
| `/employer/jobs/[id]/matching` | Ranked anonymous candidates |
| `/employer/jobs/[id]/unlocked` | Unlocked candidates for a job |

---

## Security

- Row Level Security on all tables
- Role-based route protection via middleware + server-side `requireRole()`
- Users cannot escalate their own role (migration 005)
- Candidate PII (name, email, phone, CV) hidden from employers until a valid unlock record exists
- Signed URLs for CV access
- Stripe webhook signature verification

---

## Payment Model

| Action | Cost |
|--------|------|
| Job posting | Free |
| Matching generation | Free |
| Unlock candidate profile | **$49.00 USD** each (test mode; configurable in `lib/matching/engine.ts`) |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Sign-up fails with "Database error saving new user" | Migration 006 not applied | Run `006_fix_signup_trigger.sql` or `node scripts/apply-signup-fix.mjs` |
| Job save fails on `form_data` column | Migration 004 not applied | Run `004_job_form_data.sql` |
| Employer dashboard blank (header/sidebar only) | Client boundary swallowing children | Ensure page content renders inside server `DashboardChrome` |
| No candidates in matching results | No `ready_for_matching` candidates | Run `npm run seed-dummy-users` or complete candidate onboarding |
| Stripe unlock not completing | Webhook not forwarded | Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` |

---

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.example`
4. Apply all Supabase migrations on the production database
5. Run `npm run create-admin` against production env (or set admin manually)
6. Set Stripe webhook endpoint to `https://your-domain.com/api/stripe/webhook`

---

## Current State (Jul 2026)

Recent work completed:

- **Auth:** Signup trigger fix (006), portal-specific sign-in/sign-up, wrong-portal UX
- **Dashboard:** Unified header/sidebar alignment, server-side chrome rendering
- **Employer portal:** Shared layout shell, "Employer Profile" naming, job form UX fixes
- **Seeding:** Demo users and jobs scripts for local/staging testing
- **Testing:** Vitest unit tests for profile, onboarding, job-form, and Zod schemas

**Pending on remote DB if not yet run:** migrations 004 and 006.
**Pending for test automation:** integration tests, E2E (Playwright), CI workflow.

---

## License

Private — Deep HR Match MVP
