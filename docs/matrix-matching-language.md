# 7^7 Matching Language

Tentative specification for the Deep HR Match proprietary matching framework. Phase 1 uses **placeholder words**; the structure is stable so the real taxonomy can replace content later.

## Structure

```
Level 1: 7 matching factors (categories)
    └── Each factor: multiple sub-levels (target: 7 levels deep)
            └── Each sub-level: exactly 7 words to choose from
```

At full depth, each path through the tree has **7 choices at 7 consecutive levels** → **7^7 = 823,543** possible combination paths per factor branch.

### Phase 1 placeholder

| Layer | Count | Notes |
|-------|-------|-------|
| Factors | 7 | Numbered only — Matching Factor 1 … 7 (no HR-themed categories) |
| Sub-levels per factor | 1 (expandable to 7) | One question per factor in seed; run `npm run seed-matrix-77` for full 7×7 depth |
| Words per sub-level | 7 | Single-select; exact word match scores perfectly |

## Shared form

The 7^7 form contains **only** the seven matching factors. Each factor has sub-levels with seven word choices — no separate questions about work style, skills, or other profile topics (those live elsewhere in the app).

**Employers (per job)** and **candidates** answer the **same questions** (`target_role = 'both'`).

| Role | Table | Meaning |
|------|-------|---------|
| Employer | `job_matrix_answers` | Ideal / required profile for the role |
| Candidate | `candidate_matrix_answers` | Self-assessment |

## Scoring (Phase 1)

Implemented in `lib/matching/matrix-score.ts`:

1. For each sub-level question where **both** sides picked a word (`option_id`)
2. **Exact same `option_id`** → perfect match for that cell (1 point)
3. Different word → 0 for that cell
4. **Matrix score** = `(matched cells / comparable cells) × 100`

Overall ranking in the inline placeholder engine uses `matrix_score` as `overall_score` when the job form has answers. Sub-scores (profile, skills, etc.) remain demo offsets until the external engine ships.

## Requirements

- Every **factor** must have an answer before submit (all required questions)
- Only `single_select` word picks participate in matrix scoring
- Text/scale questions are excluded from the 7^7 model (not seeded in placeholder)

## Data model

```
matrix_categories     → 7 factors
matrix_questions      → sub-levels (linked to category)
matrix_options        → 7 words per question
job_matrix_answers    → employer picks (option_id)
candidate_matrix_answers → candidate picks (option_id)
```

## Seeding

```bash
# Minimal (7 factors × 1 sub-level × 7 words) — in supabase/seed.sql
# Full depth (7 factors × 7 sub-levels × 7 words):
npm run seed-matrix-77
```

The seed script replaces existing matrix categories/questions/options. Existing matrix answers may become orphaned — re-run forms after seeding.

## External matching engine

The separate matching service should implement the same comparison rules when reading from Supabase. See [matching-engine-integration.md](./matching-engine-integration.md).

## Future

- Nested drill-down UI (choice at level N reveals level N+1 within a factor)
- Weighted factors / partial credit between related words
- Final confirmed word taxonomy from Deep HR Match product team
