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

**Never commit** `.env.local` or expose service role / Stripe secret keys client-side.

## Supabase Setup

### 1. Create project

Create a new Supabase project and note URL + keys from Project Settings → API.

### 2. Apply migrations

Run each file in order in **SQL Editor**:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_storage.sql
supabase/migrations/004_job_form_data.sql
supabase/migrations/005_role_security.sql
supabase/migrations/006_fix_signup_trigger.sql   ← required for signup
```

Or use direct Postgres:

```bash
# Set SUPABASE_DB_URL in .env.local, then:
node scripts/apply-signup-fix.mjs   # applies 006 specifically
```

### 3. Seed matrix data

Paste contents of `supabase/seed.sql` into SQL Editor.

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

npm run create-admin
npm run seed-dummy-users    # optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

Apply all migrations on production database (same order as local).

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
| `npm run dev` | Dev server (webpack) |
| `npm run dev:turbo` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run create-admin` | Bootstrap admin |
| `npm run seed-dummy-users` | Demo employers + candidates |
| `npm run seed-employer-jobs` | Demo jobs |

## Scripts (Standalone)

| Script | Purpose |
|--------|---------|
| `scripts/create-admin.mjs` | Auth user + admin role |
| `scripts/seed-dummy-users.mjs` | 5 employers + 5 candidates |
| `scripts/seed-employer-jobs.mjs` | 5 jobs for an employer |
| `scripts/apply-signup-fix.mjs` | Apply migration 006 |
| `scripts/extract-job-form-data.mjs` | One-off form data utility |

## Deployment Checklist

- [ ] All 6 migrations applied on target database
- [ ] `supabase/seed.sql` run (matrix content)
- [ ] Environment variables set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches production domain
- [ ] Supabase Auth redirect URLs configured
- [ ] Admin account bootstrapped
- [ ] Stripe webhook endpoint registered
- [ ] `npm run build` succeeds locally
- [ ] `npm test` passes
- [ ] Sign-up and sign-in tested on production

## Troubleshooting

See root [README](../README.md#troubleshooting) and [Authentication](./authentication.md#troubleshooting).
