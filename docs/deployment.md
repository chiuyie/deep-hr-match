# Deployment

## Prerequisites

- Node.js 20+
- Supabase project ([supabase.com](https://supabase.com))
- Stripe account (test or live mode)
- Vercel account (recommended) or self-hosted Node

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role (server/scripts only) |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` locally; production URL in prod |
| `STRIPE_SECRET_KEY` | For payments | `sk_test_...` or live key |
| `STRIPE_WEBHOOK_SECRET` | For payments | From Stripe dashboard or `stripe listen` |
| `ADMIN_EMAIL` | For bootstrap | Admin account email |
| `ADMIN_PASSWORD` | For bootstrap | Min 8 characters |
| `ADMIN_NAME` | Optional | Display name (default: Platform Admin) |
| `SUPABASE_DB_URL` | Optional | Direct Postgres for migration scripts |
| `EMPLOYER_EMAIL` | Optional | Target for `seed-employer-jobs` |
| `DUMMY_USER_PASSWORD` | Optional | Demo user password (default: `DemoUser123!`) |
| `MATCHING_ENGINE_URL` | Optional | External matching service base URL; unset = inline placeholder |
| `MATCHING_ENGINE_API_KEY` | Optional | Bearer token for `POST /runs` on external service |

**Never commit** `.env.local` or expose service role / Stripe secret keys client-side.

## Supabase Setup

### 1. Create project

Create a new Supabase project and note URL + keys from Project Settings → API.

### 2. Apply migrations

Run **every** numbered file in order in the Supabase **SQL Editor** (or via `SUPABASE_DB_URL`):

| # | File | Purpose |
|---|------|---------|
| 001 | `001_schema.sql` | Core tables, enums, `handle_new_user` trigger |
| 002 | `002_rls.sql` | Row Level Security policies |
| 003 | `003_storage.sql` | Storage buckets for CV/JD files |
| 004 | `004_job_form_data.sql` | `jobs.form_data` JSONB |
| 005 | `005_role_security.sql` | Role-change protection + signup metadata |
| 006 | `006_fix_signup_trigger.sql` | **Required for signup** — hardened trigger + INSERT policies |
| 007 | `007_form_fields.sql` | Dynamic `form_fields` table |
| 008 | `008_form_field_disclosure.sql` | Employer disclosure modes on form fields |
| 009 | `009_matrix_word_description_sublevels.sql` | Matrix word/description sublevels |
| 010 | `010_anonymous_match_disclosure.sql` | Anonymous match disclosure flags |
| 011 | `011_platform_disclosure.sql` | Platform disclosure items |
| 012 | `012_unlocked_matrix_answers_read.sql` | Unlocked matrix answer RLS |
| 013 | `013_candidate_languages_jsonb.sql` | Candidate languages JSONB |
| 014 | `014_matrix_answer_column.sql` | Matrix answer column shape |
| 015 | `015_form_field_options.sql` | Select options on form fields |
| 016 | `016_form_sections.sql` | Form section titles |
| 017 | `017_form_field_type_date.sql` | Date field type |
| 018 | `018_employer_match_results_write.sql` | Employer match-results write policy |

> **Do not** use `APPLY_DISCLOSURE_NOW.sql` on new environments — it is a deprecated emergency paste of migrations 008/011/012.

Signup-only hotfix (if 001–005 already applied but signup fails):

```bash
# Set SUPABASE_DB_URL in .env.local, then:
node scripts/apply-signup-fix.mjs   # applies 006 specifically
```

### 3. Seed matrix + form fields

1. Paste contents of `supabase/seed.sql` into SQL Editor (7^7 matrix placeholders).
2. Sync dynamic form fields (candidate 6-page profile, job filters, etc.):

```bash
npm run sync-form-fields
```

The app can also seed missing fields on first boot via `ensureFormFieldsReady()` when `SUPABASE_SERVICE_ROLE_KEY` is set, but running the script after migrations is more reliable for production.

### 4. Verify signup

Create a test employer at `/auth/sign-up?role=employer`. If you get "Database error saving new user", migration 006 is missing.

### 5. Auth settings (Supabase Dashboard)

- Enable email provider
- Configure site URL: `http://localhost:3000` (dev) or production URL
- Add redirect URLs for your domains
- Email confirmation: optional for dev (disable for faster testing)

## Local Development

```bash
git clone <repo>
cd deep-hr-match
npm install
cp .env.example .env.local
# fill in .env.local

# After all migrations + seed.sql:
npm run sync-form-fields
npm run create-admin
npm run reseed-complete-demo-data   # preferred demo (filters + scoring)
# or: npm run seed-dummy-users      # lighter demo users only
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### OneDrive / Windows note

This repo includes workarounds for OneDrive-synced folders (cache locks, corrupted `.next`). If `next dev` fails with `EBUSY` or odd type errors:

```bash
npm run clean
npm run dev:clean
```

Prefer cloning outside OneDrive (e.g. `C:\dev\deep-hr-match`) for daily work.

### Stripe local webhooks

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Update `STRIPE_WEBHOOK_SECRET` with the secret from CLI output.

## Production: Vercel

### 1. Import project

Push to GitHub → Import in Vercel → select `deep-hr-match`.

### 2. Environment variables

Add all variables from `.env.example` in Vercel Project Settings → Environment Variables.

Use production Supabase URL/keys and live Stripe keys for production environment.

### 3. Build settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build command | `npm run build` |
| Output | Default (`.next`) |

### 4. Supabase production

1. Apply migrations **001 → 018** on the production database (same order as local).
2. Run `supabase/seed.sql` (matrix).
3. Run `npm run sync-form-fields` against production env (service role required).

### 5. Bootstrap admin

Run locally against production env:

```bash
# Temporarily point .env.local to production Supabase
npm run create-admin
```

Or promote a user manually in SQL Editor:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### 6. Stripe production webhook

1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://your-domain.com/api/stripe/webhook`
3. Event: `checkout.session.completed`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel

### 7. Supabase Auth URLs

Update in Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://your-domain.com`
- Redirect URLs: include production domain

## npm Scripts Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack by default) |
| `npm run dev:webpack` | Dev server with webpack (more stable on OneDrive) |
| `npm run dev:clean` | Clean `.next` then start dev |
| `npm run clean` | Remove `.next` cache only |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run create-admin` | Bootstrap admin |
| `npm run sync-form-fields` | Seed/sync `form_fields` + sections (post-migration) |
| `npm run reseed-complete-demo-data` | **Canonical demo** — users, jobs, filters, match snapshots |
| `npm run seed-dummy-users` | Lighter demo: 5 employers + 5 candidates |
| `npm run seed-employer-jobs` | Demo jobs for an employer |
| `npm run seed-matrix-77` | Placeholder 7^7 matrix content |
| `npm run generate-geo` | Regenerate world countries constants |

## Scripts inventory

| Script | npm alias | When to use | Prod-safe? |
|--------|-----------|-------------|------------|
| `scripts/create-admin.mjs` | `create-admin` | First admin account | Yes (bootstrap) |
| `scripts/sync-form-fields.mjs` | `sync-form-fields` | After fresh migrations / missing profile pages | Yes |
| `scripts/reseed-complete-demo-data.mjs` | `reseed-complete-demo-data` | Full demo with hard filters + scoring | Staging/demo only |
| `scripts/seed-dummy-users.mjs` | `seed-dummy-users` | Quick demo users | Staging/demo only |
| `scripts/seed-employer-jobs.mjs` | `seed-employer-jobs` | Demo jobs for one employer | Staging/demo only |
| `scripts/seed-matrix-77-placeholder.mjs` | `seed-matrix-77` | Matrix seed if `seed.sql` not used | Staging/demo |
| `scripts/cleanup-jobs-without-matrix.mjs` | `cleanup-jobs-without-matrix` | Remove jobs missing matrix | Careful |
| `scripts/generate-world-countries.mjs` | `generate-geo` | Codegen geo constants | Dev only |
| `scripts/dev.mjs` / `clean-next.mjs` | `dev*` / `clean` | Local Next.js | Local |
| `scripts/apply-signup-fix.mjs` | — | Apply migration 006 only | Yes (hotfix) |
| `scripts/apply-disclosure-migrations.mjs` | — | Legacy disclosure apply helper | Prefer 008/011/012 |
| `scripts/backfill-unlocks.mjs` | — | Backfill unlocks from paid payments | Careful |
| `scripts/create-dummy-unlock.mjs` | — | One paid dummy unlock for QA | Staging only |
| `scripts/extract-job-form-data.mjs` | — | One-off form data utility | Dev only |
| `scripts/seed-employer-match-demo.mjs` | — | **Legacy** — fake scores, skips filters | Avoid for filter QA |

**Demo password** (after reseed / seed-dummy-users): `DemoUser123!` (override with `DUMMY_USER_PASSWORD`).

## Deployment Checklist

- [ ] Migrations **001 → 018** applied on target database
- [ ] `supabase/seed.sql` run (matrix content)
- [ ] `npm run sync-form-fields` run against target env
- [ ] Environment variables set in Vercel (including `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] `NEXT_PUBLIC_APP_URL` matches production domain
- [ ] Supabase Auth redirect URLs configured
- [ ] Admin account bootstrapped
- [ ] Stripe webhook endpoint registered (`checkout.session.completed`)
- [ ] `npm run build` succeeds locally
- [ ] `npm test` passes
- [ ] Sign-up and sign-in tested on production
- [ ] Candidate profile shows **6** wizard pages (Matching details + Role requirements)
- [ ] Employer job post creates a match snapshot (placeholder engine)
- [ ] Matching filters exclude non-matching candidates

## Troubleshooting

See root [README](../README.md#troubleshooting) and [Authentication](./authentication.md#troubleshooting).
