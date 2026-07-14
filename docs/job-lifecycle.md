# Job Lifecycle & Matching Snapshots

This document defines employer-facing job rules and how matching snapshots work. Implementation lives in `lib/employer/job-rules.ts`, `lib/matching/engine.ts`, and `lib/matching/snapshot.ts`.

## Overview

```text
Create job (draft) → Post job (active) → Generate match snapshot → Unlock profiles (paid)
                                              ↓
                                    Refresh snapshot (optional)
```

| Concept | Rule |
|---------|------|
| **Job posting** | Free, unlimited |
| **Job edit** | Draft only — posted jobs are read-only |
| **Match generation** | Free — produces an anonymous ranked snapshot |
| **Profile unlock** | Paid ($49/candidate) — reveals full PII + CV |
| **Refresh matches** | Free — replaces snapshot with a new run against the current pool |

## Job States

| Status | Edit job | Generate matches | Refresh matches | View past matches |
|--------|----------|------------------|-----------------|-------------------|
| `draft` | Yes | No (must post first) | No | No |
| `active` | No | Yes (first time) | Yes (if results exist) | Yes |
| `closed` | No | No | No | Yes (frozen snapshot) |

### Why posted jobs cannot be edited

Matching results are tied to a specific job definition (title, skills, matrix answers, etc.). If requirements change, the employer should **create a new job** rather than edit an existing posting. This keeps match history auditable and avoids inconsistent scores.

**UI enforcement:**
- `/employer/jobs/[id]` redirects to `/view` when `status !== 'draft'`
- `saveJob()` rejects updates when `status !== 'draft'`
- Jobs list shows **View** + **Matching** for posted jobs; **Edit** only for drafts

## Match Snapshots

A **match snapshot** is a point-in-time ranked list of anonymous candidates for one job.

### Candidate pool

Each run scores candidates where:

```sql
status = 'ready_for_matching'
```

This excludes draft/incomplete candidates. The pool is **global** (not employer-scoped) and **shared across all jobs** — each job gets its own ranking from the same pool.

### Snapshot behaviour

1. Employer clicks **Generate Matches** (first run) or **Refresh Matches** (subsequent run).
2. This app calls `triggerMatchRun()` — inline placeholder locally, or HTTP to **external matching service** when configured (see [integration doc](./matching-engine-integration.md)).
3. The engine (inline or external) scores ready candidates and writes to `match_results`.
4. Previous `match_results` rows for that job are **deleted** before insert.
5. Top **25** candidates are stored (`MATCH_DISPLAY_LIMIT`).
6. All rows share the same `generated_at` timestamp.

### Staleness — new candidates after a snapshot

The candidate pool **grows over time** as new people complete onboarding. A snapshot does **not** auto-update.

```text
Day 1: Generate snapshot → 50 ready candidates in pool → top 25 stored
Day 2: 3 new candidates join → NOT in snapshot until refresh
Day 5: Employer clicks Refresh Matches → re-scores pool → new top 25
```

**Detection:** `countNewReadyCandidatesSince()` counts `candidate_profiles` where `status = 'ready_for_matching'` and `updated_at > generated_at` (proxy until a dedicated `ready_at` column exists).

**UI:**
- Matching page shows **Last matched** date and new-candidate count
- View job page shows snapshot date and refresh hint
- Refresh button labelled **Refresh Matches** with warning copy

### Unlocks vs snapshots

Unlocks are stored separately in `unlocks` and are **permanent per `(employer, job, candidate_id)`**.

| Action | Effect on unlocks |
|--------|-------------------|
| Refresh matches | Unlocks **persist** — paid access is not revoked |
| Refresh matches | Rankings in anonymous list **change** |
| Refresh matches | Unlocked candidate may disappear from new top 25 but remains on **Unlocked** tab |

## Pricing Model

| Action | Cost |
|--------|------|
| Post job | Free |
| Generate / refresh matches | Free |
| Unlock candidate profile | $49 USD each |

Generation is free to maximise funnel conversion; revenue is collected at unlock time when the employer has seen anonymous value.

## Employer Workflow (Jobs List)

| Job state | Actions shown |
|-----------|---------------|
| Draft | View, **Edit**, Matching (if active path N/A) |
| Active, no matches | View, **Generate Matching** |
| Active, has matches | View, **View Matching** (page also offers Refresh) |
| Closed, has matches | View, **View Matching** (read-only snapshot) |

Rules implemented in `components/employer/job-row-actions.tsx` via `lib/employer/job-rules.ts`.

## Code Reference

| File | Responsibility |
|------|----------------|
| `lib/employer/job-rules.ts` | `canEditJob`, `canRunMatching`, `canViewMatching`, UI labels, warnings |
| `lib/employer/job-rules.test.ts` | Unit tests for lifecycle rules |
| `lib/matching/trigger.ts` | Inline vs external engine dispatch |
| `lib/matching/engine.ts` | Phase 1 placeholder (dev when no external URL) |
| `lib/matching/snapshot.ts` | Snapshot time, new-candidate count, UI notices |
| `lib/matching/snapshot.test.ts` | Unit tests for snapshot helpers |
| `lib/employer/actions.ts` | `generateMatchingResults()`, `saveJob()` guards |
| `app/employer/jobs/[id]/matching/page.tsx` | Snapshot status banner, refresh CTA |
| `app/employer/jobs/[id]/view/page.tsx` | Read-only job + snapshot summary |

## Future Improvements

| Enhancement | Purpose |
|-------------|---------|
| `ready_at` column on `candidate_profiles` | Precise new-candidate detection |
| `match_runs` table | Historical snapshots / audit trail |
| Incremental refresh | Add new candidates without full re-rank |
| Email/badge notification | "New matches available for [Job Title]" |
| Minimum score threshold | Hide poor fits even if within top N |
| Real matching algorithm | Replace placeholder scoring |

## Related Docs

- [Matching Engine Integration](./matching-engine-integration.md) — external service contract
- [Matching Engine](./matching-engine.md) — placeholder + trigger details
- [Payments](./payments.md) — Stripe unlock flow
- [Server Actions](./server-actions.md) — `generateMatchingResults`, `saveJob`
