# Matching Engine Integration (External Service)

The **production matching algorithm** is intended to live in a **separate repository/service**, not in this Next.js app. Both services share the **same Supabase database** — the external engine reads job/candidate data and writes ranked rows to `match_results`.

This app remains responsible for:

- Employer UI (generate / refresh / view matches)
- Lifecycle guards (`lib/employer/job-rules.ts`)
- Unlock payments (Stripe)
- Triggering a match run

The external engine is responsible for:

- Scoring algorithm (7^7 matrix, skills, experience, etc.)
- Reading inputs from Postgres
- Writing the snapshot to `match_results`

## Architecture

```text
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  deep-hr-match (this repo)  │         │  matching-engine (other repo) │
│  Next.js employer portal    │         │  Python / Node / worker etc.  │
└──────────────┬──────────────┘         └──────────────┬───────────────┘
               │  POST /runs (optional)                 │
               │  triggerMatchRun()                     │
               └────────────────────────────────────────►│
                                                         │
               ┌─────────────────────────────────────────┤
               │         Shared Supabase Postgres        │
               │  jobs, candidate_profiles, matrix,      │
               │  match_results, unlocks                 │
               └─────────────────────────────────────────┘
```

### Phase 1 (current)

If `MATCHING_ENGINE_URL` is **not** set, this app runs the inline **placeholder** engine (`lib/matching/engine.ts`) for local dev and demos.

### Phase 2+ (planned)

Set `MATCHING_ENGINE_URL` (and optionally `MATCHING_ENGINE_API_KEY`). The app calls the external service via `lib/matching/trigger.ts` instead of scoring inline.

## Trigger from This App

**Entry point:** `triggerMatchRun()` in `lib/matching/trigger.ts`  
**Called by:** `generateMatchingResults()` in `lib/employer/actions.ts`

| Env var | Required | Description |
|---------|----------|-------------|
| `MATCHING_ENGINE_URL` | For external mode | Base URL, e.g. `https://matching.yourdomain.com` |
| `MATCHING_ENGINE_API_KEY` | Recommended | Bearer token sent to external `POST /runs` |

When external URL is set, this app sends:

```http
POST {MATCHING_ENGINE_URL}/runs
Authorization: Bearer {MATCHING_ENGINE_API_KEY}
Content-Type: application/json

{
  "job_id": "uuid",
  "employer_id": "uuid"
}
```

**Expected responses:**

| HTTP | Body | App behaviour |
|------|------|---------------|
| `200` | `{ "status": "completed" }` or empty | Revalidate matching page; results already in DB |
| `202` | `{ "status": "queued" }` | Revalidate page; UI shows existing snapshot until run finishes (async UX TBD) |
| `4xx/5xx` | error | Show error to employer |

Implement the contract above in your external repo, or adapt `lib/matching/trigger.ts` if your API differs.

## Database Write Contract

The external engine **must** follow the same snapshot rules documented in [Job Lifecycle](./job-lifecycle.md).

### Preconditions

1. Job exists: `jobs.id = job_id` and `jobs.employer_id = employer_id`
2. Job status is `active` (this app enforces before trigger; engine should re-validate)
3. Candidate pool: `candidate_profiles.status = 'ready_for_matching'`

### Write steps (per run)

```sql
-- 1. Replace previous snapshot for this job
DELETE FROM match_results WHERE job_id = :job_id;

-- 2. Insert top N ranked rows (N = 25, see MATCH_DISPLAY_LIMIT in this repo)
INSERT INTO match_results (
  job_id, candidate_id,
  overall_score, matrix_score, profile_score, skills_score,
  experience_score, education_score,
  match_summary, strengths, gaps,
  ranking_position, is_placeholder, generated_at
) VALUES (...);

-- 3. All rows in one run share the same generated_at (ISO timestamp)
```

### Field rules

| Field | Rule |
|-------|------|
| `ranking_position` | 1-based, unique per job, ordered by score desc |
| `is_placeholder` | `false` for real algorithm output; `true` only for demos |
| `generated_at` | Same value on every row in the run |
| `(job_id, candidate_id)` | UNIQUE — one row per candidate per job per snapshot |

### Inputs to read

| Table | Purpose |
|-------|---------|
| `jobs` | Title, skills, experience, education, `form_data` |
| `job_matrix_answers` | Employer 7^7 answers for this job |
| `candidate_profiles` | Profile fields for ready candidates |
| `candidate_matrix_answers` | Candidate 7^7 answers |

**7^7 word matching (Phase 1):** For each sub-level question, compare `option_id` on job vs candidate. Exact match = 1 point; score = matched / comparable × 100. See [matrix-matching-language.md](./matrix-matching-language.md) and `lib/matching/matrix-score.ts`.
| `candidate_cv_files` | Optional — path/metadata for future CV parsing |

Do **not** expose candidate PII to employers via `match_results` — names/emails stay hidden until unlock.

### Supabase access

The external service should connect with **`SUPABASE_SERVICE_ROLE_KEY`** (server-side only) or a dedicated DB role with:

- `SELECT` on jobs, profiles, matrix answers (respecting your security model)
- `DELETE` + `INSERT` on `match_results` for the target `job_id`

RLS policies on `match_results` allow employer inserts for own jobs; the service role bypasses RLS for batch writes.

## Sync vs Async Runs

| Mode | Flow | When to use |
|------|------|-------------|
| **Sync** | External engine completes write before HTTP response | Small pools, fast scoring |
| **Async** | Return `202 queued`; worker writes later | LLM / heavy scoring |

For async, consider adding a `match_runs` table (future migration):

```text
match_runs(id, job_id, status, requested_at, completed_at, error_message)
```

This app would show "Matching in progress…" and poll until `status = completed`. Not implemented in Phase 1 — document only.

## Snapshot & Staleness (unchanged)

- Each run is a **point-in-time snapshot** — new candidates appear only after employer clicks **Refresh Matches**
- Unlocks in `unlocks` are **independent** — paid access survives snapshot refresh
- Top **25** candidates stored per run (`MATCH_DISPLAY_LIMIT`)

## Local Development

```bash
# Default — inline placeholder, no external service
unset MATCHING_ENGINE_URL
npm run dev

# Point at local matching service
MATCHING_ENGINE_URL=http://localhost:8080
MATCHING_ENGINE_API_KEY=dev-secret
npm run dev
```

Keep placeholder mode for CI and contributors without the matching repo.

## Bootstrap an Empty GitHub Repo

You do **not** need the external repo to work on this app. Until the service exists, leave `MATCHING_ENGINE_URL` unset and use the inline placeholder.

When you are ready to build the matching repo, follow this order:

### Step 1 — Clone and scaffold

```bash
git clone git@github.com:YOUR_ORG/deep-hr-match-engine.git
cd deep-hr-match-engine
npm init -y
npm install express @supabase/supabase-js dotenv
npm install -D typescript tsx @types/express @types/node
```

Suggested layout:

```text
deep-hr-match-engine/
  src/
    index.ts          # HTTP server — POST /runs
    run-matching.ts   # DB read, score, write match_results
    score.ts          # Your algorithm (start with stub)
  .env.example
  README.md
  package.json
```

Copy the **same Supabase env vars** from `deep-hr-match/.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MATCHING_ENGINE_API_KEY=dev-secret
PORT=8080
```

### Step 2 — Minimal `POST /runs` (copy-paste starter)

This satisfies the contract this app expects. Replace scoring later with your real algorithm.

```typescript
// src/index.ts
import "dotenv/config";
import express from "express";
import { runMatching } from "./run-matching";

const app = express();
app.use(express.json());

const apiKey = process.env.MATCHING_ENGINE_API_KEY;

app.post("/runs", async (req, res) => {
  if (apiKey) {
    const auth = req.headers.authorization ?? "";
    if (auth !== `Bearer ${apiKey}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const { job_id, employer_id } = req.body ?? {};
  if (!job_id || !employer_id) {
    return res.status(400).json({ error: "job_id and employer_id required" });
  }

  try {
    const count = await runMatching(job_id, employer_id);
    return res.status(200).json({ status: "completed", count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(process.env.PORT ?? 8080, () => {
  console.log(`Matching engine on :${process.env.PORT ?? 8080}`);
});
```

```typescript
// src/run-matching.ts — mirror lib/matching/engine.ts write contract
import { createClient } from "@supabase/supabase-js";

const MATCH_DISPLAY_LIMIT = 25;

export async function runMatching(jobId: string, employerId: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("employer_id", employerId)
    .single();

  if (jobError || !job) throw new Error("Job not found");
  if (job.status !== "active") throw new Error("Job must be active");

  const { data: candidates } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("status", "ready_for_matching");

  if (!candidates?.length) return 0;

  const generatedAt = new Date().toISOString();

  // TODO: real scoring — stub ranks by created_at for now
  const scored = candidates
    .map((c, i) => ({
      job_id: jobId,
      candidate_id: c.id,
      overall_score: 90 - i,
      matrix_score: 88 - i,
      profile_score: 86 - i,
      skills_score: 87 - i,
      experience_score: 85 - i,
      education_score: 84 - i,
      match_summary: "Scored by external engine (stub)",
      strengths: [] as string[],
      gaps: [] as string[],
      ranking_position: i + 1,
      is_placeholder: false,
      generated_at: generatedAt,
    }))
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, MATCH_DISPLAY_LIMIT);

  scored.forEach((row, i) => {
    row.ranking_position = i + 1;
  });

  const { error: deleteError } = await supabase
    .from("match_results")
    .delete()
    .eq("job_id", jobId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("match_results")
    .insert(scored);
  if (insertError) throw insertError;

  return scored.length;
}
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts"
  }
}
```

### Step 3 — Run both repos locally

**Terminal 1 — matching engine:**

```bash
cd deep-hr-match-engine
cp .env.example .env
npm run dev
# → http://localhost:8080
```

**Terminal 2 — this app:**

```bash
cd deep-hr-match
# Add to .env.local:
# MATCHING_ENGINE_URL=http://localhost:8080
# MATCHING_ENGINE_API_KEY=dev-secret
npm run dev
```

**Test:** employer portal → active job → **Generate Matches**. This app calls `POST http://localhost:8080/runs`; the engine writes to Supabase; refresh the matching page to see results.

### Step 4 — Replace stub scoring

1. Read `job_matrix_answers` + `candidate_matrix_answers` in `run-matching.ts`
2. Implement real logic in `src/score.ts`
3. Set `is_placeholder: false` (already in starter)
4. Add unit tests for scoring functions in the engine repo

### Step 5 — Deploy

Deploy the engine (Railway, Fly.io, Cloud Run, etc.) and set production env on **this** app:

```env
MATCHING_ENGINE_URL=https://your-engine.example.com
MATCHING_ENGINE_API_KEY=long-random-secret
```

### What to copy from this repo as reference

| This repo | Use in engine repo |
|-----------|-------------------|
| `lib/matching/engine.ts` | Write contract (delete + insert top 25) |
| `docs/matching-engine-integration.md` | Full contract |
| `docs/job-lifecycle.md` | Snapshot / refresh rules |
| `docs/database.md` | Table columns |
| `supabase/migrations/001_schema.sql` | `match_results` schema |

### Until the engine repo is ready

| Situation | What to do |
|-----------|------------|
| Building employer UI / unlocks | Leave `MATCHING_ENGINE_URL` unset |
| Testing end-to-end with real HTTP | Use Step 2 starter in engine repo |
| CI for this repo | Never set `MATCHING_ENGINE_URL` — inline placeholder runs |

## Checklist for External Repo

- [ ] Accept `POST /runs` with `job_id`, `employer_id`
- [ ] Authenticate requests (shared API key or mTLS)
- [ ] Validate job is `active` and owned by `employer_id`
- [ ] Load job + candidate pool + matrix answers
- [ ] Score and rank candidates
- [ ] `DELETE` old `match_results` for job, `INSERT` top 25 with shared `generated_at`
- [ ] Set `is_placeholder = false` for production scores
- [ ] Log run duration and candidate count
- [ ] Handle failures without partial snapshots (transaction recommended)

## Related Docs

- [Matching Engine (Phase 1 placeholder)](./matching-engine.md)
- [Job Lifecycle & Snapshots](./job-lifecycle.md)
- [Database schema](./database.md#match_results)
- [Security / RLS](./security.md)
