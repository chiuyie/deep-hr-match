# Deep HR Match

AI-ready candidate-job matching SaaS built around the proprietary **7×7 Matching Language** framework.

Phase 1 MVP — platform flows, dynamic 7×7 forms, file uploads, placeholder matching engine, and Stripe-powered candidate profile unlocks.

## Tech Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (PostgreSQL, Auth, Storage, RLS)
- **Stripe** Checkout (test mode)
- **Zod** + **React Hook Form**

## Features

### Candidates
- Sign up, build profile, upload CV
- Complete dynamic 7×7 Matching Language form
- Track profile completion and matching readiness
- Wait for employer contact outside the platform

### Employers
- Company profile and unlimited free job postings
- JD upload and job-specific 7×7 form
- Free placeholder matching result generation
- View anonymous ranked candidates
- Pay to unlock selected candidate profiles (contact info + CV)

### Admin
- Dashboard metrics
- Manage 7×7 categories, questions, and options
- View candidates, employers, jobs, matches, payments, unlocks, and files
- Admin role assigned manually in database

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/deep-hr-match.git
cd deep-hr-match
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_storage.sql`
3. Run seed data: `supabase/seed.sql`
4. Copy `.env.example` to `.env.local` and fill in Supabase keys

### 3. Stripe setup (test mode)

1. Create a Stripe account and get test API keys
2. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env.local`
3. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Assign admin role

After signing up, promote a user to admin in Supabase SQL Editor:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Project Structure

```
app/
  page.tsx              # Landing page
  auth/                 # Sign in / sign up
  candidate/            # Candidate module
  employer/             # Employer module
  admin/                # Admin module
  api/stripe/webhook/   # Stripe webhook handler
components/
  ui/                   # shadcn/ui
  layout/               # Nav, sidebar, dashboard shell
  forms/                # Matrix form
  matching/             # Matching results table
lib/
  supabase/             # Client, server, middleware
  auth/                 # Session, unlock checks, actions
  validations/          # Zod schemas
  matching/             # Placeholder matching engine
  stripe/               # Stripe client
  candidate/            # Candidate actions
  employer/             # Employer actions
  admin/                # Admin actions
types/                  # TypeScript types
supabase/
  migrations/           # Schema, RLS, storage
  seed.sql              # Placeholder 7×7 content
```

## Matching Engine (Phase 1)

The final matching algorithm is **not confirmed**. Phase 1 implements:

- Matching engine structure in `lib/matching/engine.ts`
- Placeholder/demo scores labeled clearly in UI
- `is_placeholder` flag on all match results
- TODO comment for future algorithm integration

```typescript
// TODO: Replace placeholder scoring logic after Deep HR Match matching algorithm is finalized.
```

## Security

- Row Level Security on all tables
- Role-based route protection via server-side session checks
- Candidate PII (name, email, phone, CV) never sent to employers without valid unlock record
- Signed URLs for CV access
- Stripe webhook signature verification

## Payment Model

- Job posting: **Free**
- Matching generation: **Free**
- Unlock candidate profile: **$49.00 USD each** (test mode, configurable in `lib/matching/engine.ts`)

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables from `.env.example`
4. Set Stripe webhook endpoint to `https://your-domain.com/api/stripe/webhook`

## License

Private — Deep HR Match MVP
