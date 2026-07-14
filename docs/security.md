# Security

## Security Model

Deep HR Match enforces security at three layers:

1. **Middleware** — session presence for protected routes
2. **Server-side role checks** — `requireRole()` in layouts and actions
3. **Row Level Security (RLS)** — PostgreSQL policies on every table

There is no client-side-only authorization — all sensitive operations go through Server Actions with Supabase clients that respect RLS.

## Role Model

| Role | Capabilities |
|------|-------------|
| `candidate` | Own profile, CV, matrix answers; cannot see employer data |
| `employer` | Own profile, jobs, JDs, job matrix; anonymous match results; unlock for PII |
| `admin` | Full read/write on all tables; matrix CRUD |

Roles are set at signup via `user_metadata.role` and stored in `public.users.role`. Non-admins **cannot** change their own role (migration 005).

## PII Protection

Candidate personally identifiable information is hidden from employers until a valid **unlock** exists.

### What employers see before unlock

- Anonymous ID: `CAND-<uuid-prefix>` via `anonymizeCandidateId()`
- Match scores and placeholder summaries
- No name, email, phone, or CV download

### What employers see after unlock

- Full `candidate_profiles` row
- CV file with signed download URL (1-hour expiry)
- Match result details

**Unlock check:** `lib/auth/unlock.ts` → `hasCandidateUnlock()`, `getUnlockedCandidateDetails()`

### Signed URLs

CV downloads use Supabase Storage signed URLs:

```typescript
supabase.storage.from("candidate-cvs").createSignedUrl(file_path, 3600)
```

## RLS Helper Functions

Defined in `supabase/migrations/002_rls.sql`:

| Function | Purpose |
|----------|---------|
| `get_user_role()` | Current session user's role |
| `get_user_id()` | Current session user's `users.id` |
| `get_candidate_profile_id()` | Candidate profile for current user |
| `get_employer_profile_id()` | Employer profile for current user |
| `is_admin()` | Whether current user is admin |
| `has_unlock(job_id, candidate_id)` | Unlock record exists for employer + job + candidate |

All helpers are `SECURITY DEFINER STABLE` — they run with elevated privileges to resolve IDs safely.

## Table Policies Summary

### `users`

| Operation | Who |
|-----------|-----|
| SELECT | Own record or admin |
| UPDATE | Own record or admin (role locked for non-admin per 005) |
| INSERT | Signup trigger + `auth_user_id = auth.uid()` (006) |

### `candidate_profiles`

| Operation | Who |
|-----------|-----|
| ALL | Candidate owns own profile, or admin |
| SELECT (employer) | `ready_for_matching` candidates appearing in `match_results` for employer's jobs |

Employers never get blanket SELECT on all candidates — only matched, ready candidates.

### `employer_profiles` / `jobs`

| Operation | Who |
|-----------|-----|
| ALL | Employer owns own records, or admin |

### Matrix content (`matrix_categories`, `matrix_questions`, `matrix_options`)

| Operation | Who |
|-----------|-----|
| SELECT | Authenticated users (active items), or admin (all) |
| ALL (write) | Admin only |

### `candidate_matrix_answers`

| Operation | Who |
|-----------|-----|
| ALL | Candidate owns, or admin |

### `job_matrix_answers`

| Operation | Who |
|-----------|-----|
| ALL | Employer owns via job ownership, or admin |

### `candidate_cv_files`

| Operation | Who |
|-----------|-----|
| ALL | Candidate owns, or admin |
| SELECT (employer) | Employer with `has_unlock()` for related match |

### `job_jd_files`

| Operation | Who |
|-----------|-----|
| ALL | Employer owns via job, or admin |

### `match_results`

| Operation | Who |
|-----------|-----|
| SELECT | Employer for own jobs, or admin |
| INSERT | Employer for own jobs, or admin |
| ALL (admin) | Admin |

### `payments` / `unlocks`

| Operation | Who |
|-----------|-----|
| ALL / SELECT | Employer owns, or admin |
| INSERT unlocks | Employer or admin (webhook uses service role) |

### `activity_logs`

| Operation | Who |
|-----------|-----|
| SELECT / INSERT | Own user or admin |
| ALL | Admin |

## Storage Security

Private buckets — no public access. See [Storage](./storage.md).

- CV bucket: folder = `candidate_profile_id`
- JD bucket: folder = `job_id` (must belong to employer)

## Stripe Webhook Security

`app/api/stripe/webhook/route.ts`:

1. Requires `stripe-signature` header
2. Verifies with `STRIPE_WEBHOOK_SECRET`
3. Uses **service role** client to write `payments` and `unlocks` (bypasses RLS intentionally)

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` to the client.

## Service Role Usage

The service role key is used only in:

- `scripts/create-admin.mjs`
- `scripts/seed-*.mjs`
- `scripts/apply-signup-fix.mjs`
- `lib/auth/actions.ts` — signup fallback provisioning
- `app/api/stripe/webhook/route.ts` — unlock creation

## Environment Variable Safety

| Variable | Exposure |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client-safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** |
| `STRIPE_SECRET_KEY` | **Server only** |
| `STRIPE_WEBHOOK_SECRET` | **Server only** |

`lib/supabase/env.ts` rejects placeholder values in development.

## Security Checklist for Contributors

- [ ] Never query candidate PII in employer pages without unlock check
- [ ] Use `createClient()` (cookie session) in Server Actions, not service role
- [ ] Use service role only for webhook and bootstrap scripts
- [ ] Do not bypass `requireRole()` in protected routes
- [ ] Test RLS by signing in as each role, not only as admin
- [ ] Keep migration 006 applied on all environments
