# Development Guide

Guide for contributors working on Deep HR Match.

## Getting Started

1. Read the root [README](../README.md) for quick setup
2. Read [Architecture](./architecture.md) for system overview
3. Apply all [database migrations](./database.md#migrations)
4. Run `npm run dev` and `npm test`

## Project Conventions

### Framework

- **Next.js App Router** — pages in `app/`, default to Server Components
- **Server Actions** for mutations — `"use server"` in `lib/*/actions.ts`
- **Client components** only when needed (interactivity, hooks, browser APIs)
- Mark client files with `"use client"` at top

### Imports

Use `@/` path alias (maps to project root):

```typescript
import { requireRole } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
```

### Styling

- Tailwind CSS utility classes
- shadcn/ui components in `components/ui/`
- Theme: `next-themes` via `ThemeProvider` — use semantic tokens (`text-foreground`, `bg-background`)
- Branding constants in `lib/constants/branding.ts` — always display framework as **7^7**

### Validation

- Zod schemas in `lib/validations/schemas.ts`
- Parse form data with `safeParse`, throw first issue message on failure
- Coerce numbers where needed (`z.coerce.number()`)

### Database Access

| Context | Client |
|---------|--------|
| Server Components / Actions | `createClient()` from `lib/supabase/server` |
| Client Components | `createClient()` from `lib/supabase/client` |
| Scripts / Webhook | `createServiceClient()` or `@supabase/supabase-js` with service key |

Never use service role in regular Server Actions — RLS must apply.

### Authorization

Every protected action/page should call:

```typescript
const user = await requireRole("employer");  // or "candidate" | "admin"
```

Layouts enforce role at portal level (`app/employer/layout.tsx`, etc.).

## Folder Structure

```
app/                    # Routes (App Router)
  auth/                 # Sign-in/up pages
  candidate/            # Candidate portal
  employer/             # Employer portal
  admin/                # Admin portal
  api/                  # API routes (Stripe webhook only)

components/
  ui/                   # shadcn primitives — don't edit casually
  layout/               # Dashboard chrome, nav, shells
  forms/                # Matrix form, job creation form
  matching/             # Results table
  auth/                 # Auth notices

lib/
  supabase/             # Clients, middleware, env
  auth/                 # Session, actions, unlock
  candidate/            # Candidate logic + actions
  employer/             # Employer logic + actions
  admin/                # Admin actions
  matching/             # Matching engine
  stripe/               # Stripe helper
  validations/          # Zod schemas
  constants/            # Nav, branding, job form config
  utils/                # Pure helpers

types/database.ts       # Shared DB types
supabase/migrations/    # SQL migrations (ordered)
scripts/                # Bootstrap and seed scripts
docs/                   # Technical documentation
```

## Adding a New Employer Page

1. Create `app/employer/your-page/page.tsx`
2. Add metadata in `lib/constants/employer-pages.ts` (`getEmployerPageMeta`)
3. Optionally add nav item in `lib/constants/dashboard-nav.ts` (`employerNav`)
4. Page content renders inside `EmployerLayoutShell` automatically — no `DashboardShell` needed

## Adding a New Candidate Page

1. Create page under `app/candidate/`
2. If part of onboarding, update `lib/candidate/onboarding.ts` allowed paths
3. Wrap in `DashboardShell` in the page component (candidate has no shared layout shell)

## Adding a Database Migration

1. Create `supabase/migrations/00N_description.sql`
2. Document in `docs/database.md`
3. If RLS changes needed, update `docs/security.md`
4. Test on local/staging Supabase before production

## Job Form Extension

Job creation uses multi-section form data:

- Field config: `lib/constants/job-form.ts` + JSON in `lib/constants/job-form-data/`
- Parsing: `lib/utils/job-form.ts`
- Extended fields stored in `jobs.form_data` JSONB
- Legacy columns (`department`, `skills`, etc.) mapped by `formStateToJobPayload()`

Requires migration 004 (`form_data` column).

## 7^7 Matrix Content

- Seed placeholders: `supabase/seed.sql`
- Admin CRUD: `/admin/matrix` via `lib/admin/actions.ts`
- Questions have `target_role`: `candidate`, `employer`, or `both`
- Forms: `components/forms/matrix-form.tsx`

## Scripts

| When to use | Script |
|-------------|--------|
| First admin account | `npm run create-admin` |
| Local demo users | `npm run seed-dummy-users` |
| Local demo jobs | `npm run seed-employer-jobs` |
| Signup broken on remote DB | `node scripts/apply-signup-fix.mjs` |

Scripts read `.env.local` automatically (except `create-admin` uses `--env-file`).

## Code Quality

```bash
npm run lint     # ESLint (Next.js config)
npm test         # Vitest unit tests
npm run build    # Verify production build
```

### Principles

1. **Minimize scope** — smallest correct diff
2. **Match existing patterns** — read surrounding code before adding
3. **Server-first** — prefer RSC; avoid unnecessary client boundaries
4. **RLS-aware** — test as each role, not only admin
5. **No over-engineering** — no abstractions for one-off logic

## Common Pitfalls

| Pitfall | Prevention |
|---------|------------|
| Blank dashboard content | Keep page children outside client-only wrappers around `DashboardChrome` |
| Signup HTTP 500 | Apply migration 006 |
| Job save `form_data` error | Apply migration 004 |
| No match results | Ensure candidates are `ready_for_matching` |
| Unlock without PII | Verify webhook ran; check `unlocks` table |
| Exposing CV without unlock | Always use `getUnlockedCandidateDetails()` |

## Documentation

When making significant changes, update:

- Relevant file in `docs/`
- Root `README.md` if setup/commands change
- `types/database.ts` if schema changes

## Getting Help

- [Architecture](./architecture.md) — how pieces fit together
- [Server Actions](./server-actions.md) — what each action does
- [Security](./security.md) — RLS and PII rules
- [Testing](./testing.md) — how to verify changes
