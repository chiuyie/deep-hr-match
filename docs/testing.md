# Testing

## Automated Tests (Vitest)

Unit tests run in Node — no browser or live Supabase connection required.

```bash
npm test              # run once (CI-friendly)
npm run test:watch    # watch mode
```

**Config:** `vitest.config.ts` — Node environment, `@/` path alias.

### Test Files

| File | Coverage |
|------|----------|
| `lib/utils/profile.test.ts` | `calculateProfileCompletion`, `parseCommaList`, `formatDate`, `formatCurrency`, `statusLabel` |
| `lib/candidate/onboarding.test.ts` | `getOnboardingStep`, path guards, checklist completion |
| `lib/utils/job-form.test.ts` | `parseJobFormState`, `jobRecordToFormState`, `formStateToJobPayload`, `flattenMultilevelOptions` |
| `lib/validations/schemas.test.ts` | Zod schemas for auth, profiles, jobs |

### Writing New Unit Tests

1. Create `*.test.ts` next to the module under test
2. Import from `@/lib/...` paths
3. Use `describe` / `it` / `expect` from `vitest`
4. Run `npm test` before committing

**Good candidates for unit tests:** pure functions in `lib/utils/`, `lib/candidate/onboarding.ts`, Zod schemas.

**Avoid in unit tests:** Server Actions (need Supabase mock), React components (need different setup).

## Manual QA

Flows requiring live database, file uploads, or Stripe must be tested manually.

### Demo Data Setup

```bash
npm run create-admin
npm run seed-dummy-users
npm run seed-employer-jobs
```

| Account type | Email pattern | Password |
|--------------|---------------|----------|
| Employers | `employer-demo-1@deephrmatch.test` … `-5@` | `DemoUser123!` |
| Candidates | `candidate-demo-1@deephrmatch.test` … `-5@` | `DemoUser123!` |

Override password with `DUMMY_USER_PASSWORD` in `.env.local`.

### Auth & Portals

- [ ] Candidate sign-up creates account + profile
- [ ] Employer sign-up creates account + employer profile
- [ ] Correct portal sign-in redirects to right dashboard
- [ ] Wrong portal shows informational notice
- [ ] Admin only at `/auth/admin/sign-in`
- [ ] Protected routes redirect when unauthenticated
- [ ] Sign-up errors are meaningful (migration 006 applied)

### Candidate Flow

- [ ] Profile saves; completion % updates
- [ ] Onboarding order: profile (≥60%) → CV → matrix → ready
- [ ] CV upload succeeds
- [ ] Matrix answers save
- [ ] Mark ready → `status = ready_for_matching`

### Employer Flow

- [ ] Employer profile saves
- [ ] Job list, create, edit work
- [ ] Save Job button visible (sticky footer)
- [ ] JD upload works
- [ ] Job matrix saves
- [ ] Generate Matching returns ranked candidates
- [ ] Results show anonymous IDs and demo labels
- [ ] Stripe unlock completes with webhook
- [ ] Unlocked page shows full PII

### Admin Flow

- [ ] Dashboard metrics load
- [ ] Matrix CRUD works
- [ ] All list pages load (candidates, employers, jobs, etc.)

### Layout & UX

- [ ] Employer sticky header + sidebar on all routes
- [ ] Page titles match routes
- [ ] Dashboard content renders (not blank)
- [ ] Light/dark theme toggle

## Stripe Test Mode

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Test card: `4242 4242 4242 4242`

Verify: checkout → webhook → `payments.paid` → `unlocks` created → PII visible.

## Database Checks

| Check | Expected |
|-------|----------|
| Migration 004 | Job save with `form_data` works |
| Migration 006 | New sign-ups succeed |
| `seed.sql` | Matrix categories in admin |

## Future Test Coverage

| Layer | Status | Next steps |
|-------|--------|------------|
| Unit | Done (Vitest) | Add tests for new pure helpers |
| Integration | Not started | Mock Supabase for server actions |
| E2E | Not started | Playwright per-portal happy paths |
| CI | Not started | `npm test` + `npm run lint` on PRs |

### Suggested E2E scenarios (Playwright)

1. Candidate: sign-up → profile → CV → matrix → ready
2. Employer: sign-up → profile → job → matching → unlock
3. Admin: sign-in → matrix CRUD

### Suggested integration tests

- `generatePlaceholderMatches` with mocked Supabase client
- `classifySignUpError` edge cases
- Unlock check before PII exposure

## Pre-Release Checklist

```bash
npm test
npm run lint
npm run build
```

Then run manual QA checklist above on staging environment.
