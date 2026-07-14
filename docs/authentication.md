# Authentication

Deep HR Match uses **Supabase Auth** (email/password) with application roles stored in `public.users.role`.

## Portals

| Role | Sign in | Sign up | Post-auth redirect |
|------|---------|---------|-------------------|
| Candidate | `/auth/sign-in?role=candidate` | `/auth/sign-up?role=candidate` | `/candidate` or onboarding step |
| Employer | `/auth/sign-in?role=employer` | `/auth/sign-up?role=employer` | `/employer` |
| Admin | `/auth/admin/sign-in` | — (script only) | `/admin` |

Candidates and employers share the same auth pages; `?role=` selects the portal context.

## Sign Up

**File:** `lib/auth/actions.ts` → `signUp()`

### Flow

1. Parse and validate `FormData` with `signUpSchema` (`lib/validations/schemas.ts`)
2. Call `supabase.auth.signUp()` with:
   ```typescript
   options: { data: { name, role } }  // role = 'candidate' | 'employer'
   ```
3. DB trigger `handle_new_user()` (migration 006) creates:
   - `public.users` row with correct role
   - `employer_profiles` or `candidate_profiles`
4. Fallback `provisionNewUser()` via service role if trigger/profile incomplete
5. Redirect:
   - Candidate → `/candidate/profile?welcome=1`
   - Employer → `/employer`
   - Email confirmation required → sign-in with `?error=confirm-email`

### Error classification

`classifySignUpError()` maps Supabase errors to user-facing codes:

| Code | Meaning |
|------|---------|
| `email-exists` | Account already registered |
| `weak-password` | Password too short |
| `database-setup` | HTTP 500 / trigger failure — migration 006 not applied |
| `signup-disabled` | Signup disabled in Supabase |
| `signup-failed` | Generic failure |

## Sign In

**File:** `lib/auth/actions.ts` → `signIn()`

### Flow

1. Validate with `signInSchema`
2. `supabase.auth.signInWithPassword({ email, password })`
3. Load `public.users` row for `auth_user_id`
4. Role checks:
   - **Admin** signing in on candidate/employer portal → sign out, redirect to `/auth/admin/sign-in?error=use-admin-portal`
   - **Wrong portal** (e.g. employer account on candidate portal) → redirect with `?error=wrong-role&account=<role>` (informational notice, session kept)
   - **Correct portal** → `getDashboardPath(role)`

### Admin sign-in

`signInAsAdmin()` — same password auth but requires `users.role = 'admin'`, otherwise sign-out + error.

## Sign Out

| Action | Redirect |
|--------|----------|
| `signOut()` | `/` |
| `signOutToPortalSignIn(portalRole)` | `/auth/sign-in?role=...` |

## Session Management

**File:** `lib/auth/session.ts`

| Function | Purpose |
|----------|---------|
| `getAuthUser()` | Supabase auth user from cookies |
| `getCurrentUser()` | `public.users` row for current session |
| `requireAuth()` | Redirect to `/auth/sign-in` if unauthenticated |
| `requireRole(role)` | Redirect to correct dashboard if wrong role |
| `getDashboardPath(role)` | `/candidate`, `/employer`, or `/admin` |
| `ensureCandidateProfile(userId)` | Lazy-create candidate profile if missing |
| `ensureEmployerProfile(userId)` | Lazy-create employer profile if missing |
| `anonymizeCandidateId(id)` | `CAND-<first8chars>` for employer UI |

### Supabase clients

| Client | File | Use |
|--------|------|-----|
| Browser | `lib/supabase/client.ts` | Client components |
| Server (cookie) | `lib/supabase/server.ts` → `createClient()` | Server components, actions (RLS-aware) |
| Service role | `lib/supabase/server.ts` → `createServiceClient()` | Admin scripts, webhook, signup fallback |

## Middleware

**Files:** `middleware.ts`, `lib/supabase/middleware.ts`

Runs on all routes except static assets.

1. **Session refresh** — updates Supabase auth cookies via `@supabase/ssr`
2. **`x-pathname` header** — set for candidate onboarding layout guard
3. **Route protection** — unauthenticated access to protected prefixes redirects to sign-in:

| Prefix | Redirect |
|--------|----------|
| `/admin` | `/auth/admin/sign-in` |
| `/employer` | `/auth/sign-in?role=employer` |
| `/candidate` | `/auth/sign-in?role=candidate` |

Middleware does **not** verify role — pages use `requireRole()` for that.

## Database Provisioning

### Trigger: `handle_new_user()`

Defined in `006_fix_signup_trigger.sql` (supersedes `001` and `005` versions).

```sql
-- Reads from auth.users INSERT:
v_name  := raw_user_meta_data->>'name'
v_role  := 'employer' if metadata role = 'employer', else 'candidate'

INSERT INTO users (auth_user_id, email, name, role)
INSERT INTO employer_profiles OR candidate_profiles
```

### Required INSERT policies (006)

Without these, signup returns HTTP 500:

- `users` — `auth_user_id = auth.uid()`
- `candidate_profiles` — user owns parent `users` row
- `employer_profiles` — user owns parent `users` row

### Role escalation protection (005)

Non-admins cannot change their own `users.role` on UPDATE.

## Admin Bootstrap

Admins are **not** created via sign-up UI.

```bash
npm run create-admin
```

**Script:** `scripts/create-admin.mjs`

1. Creates/updates Supabase Auth user (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
2. Sets `public.users.role = 'admin'`

## Environment

Auth requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (scripts + fallback provisioning)

See [Deployment](./deployment.md) for full variable list.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Database error saving new user" | Apply migration `006_fix_signup_trigger.sql` |
| Wrong portal after sign-in | Use correct `?role=` URL; account role is fixed at signup |
| Admin can't sign in on employer portal | Expected — use `/auth/admin/sign-in` |
| Blank profile after signup | Check trigger ran; run `ensureEmployerProfile` / `ensureCandidateProfile` paths |
