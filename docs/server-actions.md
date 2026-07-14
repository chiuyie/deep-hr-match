# Server Actions

Deep HR Match uses **Next.js Server Actions** (`"use server"`) instead of a REST API. All actions live under `lib/*/actions.ts` and are invoked from forms or client components.

## Auth Actions

**File:** `lib/auth/actions.ts`

| Action | Parameters | Behavior |
|--------|------------|----------|
| `signUp` | `FormData` (email, password, name, role, portalRole) | Register user, provision profile, redirect |
| `signIn` | `FormData` (email, password, role?) | Portal sign-in with role validation |
| `signInAsAdmin` | `FormData` (email, password) | Admin-only sign-in |
| `signOut` | — | Sign out → `/` |
| `signOutToPortalSignIn` | `portalRole` | Sign out → portal sign-in |

## Candidate Actions

**File:** `lib/candidate/actions.ts`

| Action | Parameters | Behavior |
|--------|------------|----------|
| `saveCandidateProfile` | `FormData`, `submit?: boolean` | Validate with `candidateProfileSchema`, update profile, compute `completion_percentage`, set status. On submit: redirect to CV step if ≥60% |
| `uploadCandidateCV` | `FormData` (file) | Upload to `candidate-cvs` bucket at `{candidateId}/{timestamp}-{filename}`, insert `candidate_cv_files` |
| `saveCandidateMatrixAnswers` | `FormData` | Upsert `candidate_matrix_answers` per question |
| `markCandidateReady` | — | Validates onboarding checklist (profile ≥60%, CV, matrix), sets `status = ready_for_matching` |

### Onboarding prerequisites (`markCandidateReady`)

1. `completion_percentage >= 60`
2. At least one `candidate_cv_files` row
3. At least one `candidate_matrix_answers` row

## Employer Actions

**File:** `lib/employer/actions.ts`

| Action | Parameters | Behavior |
|--------|------------|----------|
| `saveEmployerProfile` | `FormData` | Validate with `employerProfileSchema`, update `employer_profiles` |
| `saveJob` | `FormData`, `jobId?` | Parse job form state, validate, map to DB columns + `form_data` JSONB. Create or update `jobs` |
| `uploadJobJD` | `FormData` (file), `jobId` | Upload to `job-jds` bucket at `{jobId}/{timestamp}-{filename}`, insert `job_jd_files` |
| `saveJobMatrixAnswers` | `FormData`, `jobId` | Upsert `job_matrix_answers` |
| `generateMatchingResults` | `jobId` | Lifecycle guards, then `triggerMatchRun()` — inline placeholder or external service. See [Matching Engine Integration](./matching-engine-integration.md) |
| `createUnlockCheckout` | `jobId`, `candidateIds[]` | Creates `payments` row, Stripe Checkout session, redirects to Stripe |

### Job form pipeline

```
FormData → parseJobFormState() → jobSchema validation
         → formStateToJobPayload() → { title, description, form_data, legacy columns }
         → INSERT/UPDATE jobs
```

**Files:** `lib/utils/job-form.ts`, `lib/validations/schemas.ts`

### Unlock checkout

1. Insert `payments` (`status: pending`, `amount = 4900 × candidate count`)
2. Create Stripe Checkout with metadata: `payment_id`, `employer_id`, `job_id`, `candidate_ids`
3. Redirect to Stripe URL
4. On success → webhook creates `unlocks` — see [Payments](./payments.md)

## Admin Actions

**File:** `lib/admin/actions.ts`

| Action | Parameters | Behavior |
|--------|------------|----------|
| `saveMatrixCategory` | `FormData`, `categoryId?` | Create/update `matrix_categories` |
| `deleteMatrixCategory` | `categoryId` | Delete category |
| `saveMatrixQuestion` | `FormData`, `questionId?` | Create/update `matrix_questions` |
| `saveMatrixOption` | `FormData`, `optionId?` | Create/update `matrix_options` |
| `toggleMatrixItem` | `type`, `id`, `isActive` | Toggle `is_active` on category/question/option |

All admin actions call `requireRole("admin")`.

## Unlock Helpers

**File:** `lib/auth/unlock.ts` (not server actions — called from pages)

| Function | Purpose |
|----------|---------|
| `hasCandidateUnlock(employerId, jobId, candidateId)` | Boolean unlock check |
| `getUnlockedCandidateIds(employerId, jobId)` | List unlocked candidate IDs |
| `getUnlockedCandidateDetails(...)` | Full profile + CV signed URL + match result (throws if not unlocked) |

## Validation Schemas

**File:** `lib/validations/schemas.ts`

| Schema | Used by |
|--------|---------|
| `signUpSchema` | `signUp` |
| `signInSchema` | `signIn`, `signInAsAdmin` |
| `candidateProfileSchema` | `saveCandidateProfile` |
| `employerProfileSchema` | `saveEmployerProfile` |
| `jobSchema` | `saveJob` (minimum: title required) |
| `matrixCategorySchema` | Admin matrix CRUD |
| `matrixQuestionSchema` | Admin matrix CRUD |
| `matrixOptionSchema` | Admin matrix CRUD |

## Error Handling Pattern

Server actions typically:

1. Call `requireRole()` for authorization
2. Validate input with Zod `safeParse`
3. Throw `new Error(message)` on validation/DB failure
4. Use `redirect()` for navigation outcomes (sign-in/up, onboarding steps)

Forms surface errors via URL query params (`?error=...`) or thrown errors caught by Next.js error boundaries.

## API Route (Non-Action)

| Route | Handler |
|-------|---------|
| `POST /api/stripe/webhook` | `app/api/stripe/webhook/route.ts` |

This is the only HTTP API endpoint. Everything else is Server Actions.
