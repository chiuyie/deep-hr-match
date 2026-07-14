# Matching Engine

Phase 1 uses a **placeholder matching engine**. The final Deep HR Match algorithm is not yet implemented.

**File:** `lib/matching/engine.ts`

## Status

| Aspect | Phase 1 |
|--------|---------|
| Algorithm | Placeholder / demo scores |
| `is_placeholder` flag | Always `true` |
| UI labeling | `[DEMO]` prefixes on summaries |
| Job matrix answers | Fetched but **not used** in scoring |
| Candidate filter | `status = 'ready_for_matching'` only |

```typescript
// TODO: Replace placeholder scoring logic after Deep HR Match matching algorithm is finalized.
```

## Entry Point

```typescript
generatePlaceholderMatches(supabase, { jobId, employerId })
```

**Triggered by:** `generateMatchingResults()` server action from `/employer/jobs/[id]/matching`

## Algorithm Flow

1. **Validate job** — must exist and belong to `employerId`
2. **Load job matrix answers** — stored for future use, not scored yet
3. **Query candidates** — all `candidate_profiles` where `status = 'ready_for_matching'`
4. **Clear previous results** — `DELETE FROM match_results WHERE job_id = ?`
5. **Generate scores** — one placeholder score per candidate
6. **Sort** — by `overall_score` descending
7. **Assign ranks** — `ranking_position` 1, 2, 3, ...
8. **Insert** — batch insert into `match_results` with `is_placeholder: true`

Returns `{ count, results }`.

## Placeholder Scoring

`generatePlaceholderScore(index)`:

- Base score: `95 - index * 7 + random(0..4)`
- Clamped to range `[45, 98]`
- Sub-scores derived as offsets from overall (matrix -3, profile -5, etc.)
- Fixed demo `strengths` and `gaps` arrays with `[DEMO]` prefix

Scores are **not deterministic** across runs due to random jitter.

## Match Result Schema

| Field | Type | Description |
|-------|------|-------------|
| `overall_score` | NUMERIC(5,2) | Primary ranking score |
| `matrix_score` | NUMERIC | Sub-score placeholder |
| `profile_score` | NUMERIC | Sub-score placeholder |
| `skills_score` | NUMERIC | Sub-score placeholder |
| `experience_score` | NUMERIC | Sub-score placeholder |
| `education_score` | NUMERIC | Sub-score placeholder |
| `match_summary` | TEXT | Demo summary string |
| `strengths` | TEXT[] | Demo strengths |
| `gaps` | TEXT[] | Demo gaps |
| `ranking_position` | INTEGER | 1-based rank |
| `is_placeholder` | BOOLEAN | Always true in Phase 1 |
| `generated_at` | TIMESTAMPTZ | Generation timestamp |

Unique constraint: `(job_id, candidate_id)`.

## Employer Display

**Page:** `app/employer/jobs/[id]/matching/page.tsx`

- Loads `match_results` for job ordered by `ranking_position`
- Anonymizes candidates via `anonymizeCandidateId()` → `CAND-XXXXXXXX`
- Does not expose name/email/phone until unlock

**Component:** `components/matching/matching-results-table.tsx`

- Shows scores, demo labels, unlock checkboxes
- Calls `createUnlockCheckout()` for selected candidates

## Pricing Constants

Defined in `lib/matching/engine.ts`:

```typescript
export const UNLOCK_PRICE_CENTS = 4900;  // $49.00 USD
export const UNLOCK_CURRENCY = "usd";
```

Used by `createUnlockCheckout()` in `lib/employer/actions.ts`.

## Prerequisites for Matching

| Requirement | How to satisfy |
|-------------|----------------|
| Job exists | Employer creates job |
| Candidates ready | `status = ready_for_matching` (onboarding complete) |
| Employer authorized | `requireRole("employer")` + job ownership |

No requirement for job matrix completion or JD upload in Phase 1.

## Future Integration Notes

When replacing the placeholder:

1. Implement scoring in `generatePlaceholderScore` replacement
2. Use `job_matrix_answers` and `candidate_matrix_answers` in scoring
3. Consider job `required_skills`, `form_data`, and profile fields
4. Set `is_placeholder: false` for real results
5. Remove `[DEMO]` UI labels
6. Add unit/integration tests for scoring functions
7. Keep `generatePlaceholderMatches` signature or migrate callers

## Testing Matching Locally

```bash
npm run seed-dummy-users      # Creates ready_for_matching candidates
npm run seed-employer-jobs    # Creates jobs
```

Then as employer: open job → Matching → **Generate Matching Results**.
