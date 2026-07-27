# Matching Engine

**Default:** scoring runs **in this repo** (`lib/matching/`). An optional external service can take over later via `MATCHING_ENGINE_URL` (same Supabase `match_results` writes).

**Integration guide:** [Matching Engine Integration (External Service)](./matching-engine-integration.md)

**Files (this repo):**
- `lib/matching/trigger.ts` — dispatches inline engine or external HTTP service
- `lib/matching/engine.ts` — snapshot generation + ranking into `match_results`
- `lib/matching/matrix-score.ts` — platform-default equal column weights (7^7)
- `lib/matching/snapshot.ts` — snapshot metadata helpers
- `lib/employer/job-rules.ts` — when employers can generate/refresh

See also [Job Lifecycle & Matching Snapshots](./job-lifecycle.md) for business rules.

## Status

| Aspect | Current |
|--------|---------|
| Algorithm | Platform-default **equal column weights** (1/7) when job has matrix answers |
| `is_placeholder` flag | `false` for matrix-scored rows; `true` only for empty-job demo fallback |
| UI labeling | DEMO banner only when placeholder rows are present |
| Job matrix answers | **Required** for active jobs and for any match run |
| Candidate filter | `status = 'ready_for_matching'` only |
| Display limit | Top **25** per snapshot (`MATCH_DISPLAY_LIMIT`) |
| Snapshot model | Point-in-time; stale until employer refreshes |

```typescript
// TODO: Replace placeholder scoring logic after Deep HR Match matching algorithm is finalized.
```

## Snapshot Model

Matching does **not** run continuously. Each generate/refresh creates a **snapshot**:

1. Score all ready candidates at run time
2. Delete previous `match_results` for the job
3. Insert top `MATCH_DISPLAY_LIMIT` ranked rows
4. Set shared `generated_at` on all inserted rows

New candidates who join after a snapshot are **not included** until the employer clicks **Refresh Matches**. The UI shows last-matched time and a count of new pool members since that timestamp.

**Unlocks are independent of snapshots** — see [Job Lifecycle](./job-lifecycle.md#unlocks-vs-snapshots).

## Entry Point

**This app (trigger only):**

```typescript
triggerMatchRun(supabase, { jobId, employerId })
```

- If `MATCHING_ENGINE_URL` is unset → runs `generatePlaceholderMatches()` inline
- If set → `POST {MATCHING_ENGINE_URL}/runs` (external service writes to DB)

**Inline placeholder (dev):**

```typescript
generatePlaceholderMatches(supabase, { jobId, employerId })
```

**Triggered by:**
- Auto on job post: `saveJob()` when status becomes `active` and no matches exist yet
- Manual: `generateMatchingResults()` from **Generate / Refresh Matches** on `/employer/jobs/[id]/matching`

## Algorithm Flow

1. **Validate job** — must exist and belong to `employerId`
2. **Load job + candidate matrix answers** — including `matrix_column`
3. **Query candidates** — all `candidate_profiles` where `status = 'ready_for_matching'`
4. **Clear previous results** — `DELETE FROM match_results WHERE job_id = ?`
5. **Generate scores** — equal-weight column match when job has answers; demo fallback otherwise
6. **Sort** — by `overall_score` descending
7. **Assign ranks** — `ranking_position` 1, 2, 3, ...
8. **Truncate** — keep top `MATCH_DISPLAY_LIMIT` (25) rows
9. **Insert** — batch insert into `match_results`

Returns `{ count, results }`.

## Constants

```typescript
export const MATCH_DISPLAY_LIMIT = 25;
export const UNLOCK_PRICE_CENTS = 4900;  // $49.00 USD
export const UNLOCK_CURRENCY = "usd";
```

## Scoring

When the job has 7^7 answers, `scoreMatrixMatch()` applies **equal column weights** (see [matrix matching language](./matrix-matching-language.md)). `overall_score` = `matrix_score`. Non-matrix sub-scores are left null.

### Empty-job fallback

If the job has no matrix answers, ranks use non-deterministic demo scores (`is_placeholder: true`) until the form is completed.

## Snapshot Helpers

**File:** `lib/matching/snapshot.ts`

| Function | Purpose |
|----------|---------|
| `getSnapshotGeneratedAt(rows)` | Read `generated_at` from first result row |
| `countNewReadyCandidatesSince(supabase, since)` | Count pool growth after snapshot |
| `newCandidatesNotice(count)` | Human-readable refresh prompt |

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
| `generated_at` | TIMESTAMPTZ | Snapshot timestamp (shared per run) |

Unique constraint: `(job_id, candidate_id)`.

## Employer Display

**Page:** `app/employer/jobs/[id]/matching/page.tsx`

- Match snapshot banner (last matched, new candidates in pool)
- Refresh / generate CTA with lifecycle guards
- Loads `match_results` ordered by `ranking_position`
- Anonymizes candidates via `anonymizeCandidateId()` → `CAND-XXXXXXXX`
- Does not expose name/email/phone until unlock

**Component:** `components/matching/matching-results-table.tsx`

- Shows top-N scores, demo labels, unlock checkboxes
- Footer note: generation free, unlock priced
- Calls `createUnlockCheckout()` for selected candidates

## Prerequisites for Matching

| Requirement | How to satisfy |
|-------------|----------------|
| Job exists | Employer creates job |
| Job is active | `status = 'active'` (posted) |
| Candidates ready | `status = ready_for_matching` (onboarding complete) |
| Employer authorized | `requireRole("employer")` + job ownership |

No requirement for job matrix completion or JD upload in Phase 1.

## Future Integration Notes

When replacing the placeholder:

1. Implement real scoring (job matrix + candidate matrix + profile fields)
2. Consider minimum score threshold before top-N truncation
3. Set `is_placeholder: false` for real results
4. Add `ready_at` on candidates for accurate staleness detection
5. Optional `match_runs` table for historical snapshots
6. Remove `[DEMO]` UI labels
7. Add unit/integration tests for scoring functions

## Testing Matching Locally

```bash
npm run seed-dummy-users      # Creates ready_for_matching candidates
npm run seed-employer-jobs    # Creates jobs
```

Then as employer: open job → Matching → **Generate Matches** → optionally **Refresh Matches** after seeding more candidates.
