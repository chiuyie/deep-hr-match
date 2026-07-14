# 7^7 Matching Language

Tentative specification for the Deep HR Match proprietary matching framework. Phase 1 uses **placeholder words**; the structure is stable so the real taxonomy can replace content later.

## Structure

```
Level 1: 7 matching factors (categories)
    └── Level 2: 7 words — first pick per factor
            └── Levels 3–8: each prior word expands into 7 more words (up to full 7^7 depth)
```

Users must choose **one word from every factor** at each word level. At full depth, each path through the tree has **7 choices at 7 consecutive word levels** → **7^7 = 823,543** combination paths per factor branch.

### Numbering

| Level | Meaning |
|-------|---------|
| **Level 1** | The 7 matching factors (columns) |
| **Level 2** | The first set of 7 words per factor |
| **Levels 3+** | Deeper expansion — each word at the previous level can branch into 7 more words |

### Phase 1 placeholder

| Layer | Count | Notes |
|-------|-------|-------|
| Level 1 · Factors | 7 | Numbered only — Matching Factor 1 … 7 (no HR-themed categories) |
| Word levels per factor | 1 (expandable to 7) | Level 2 only in seed; run `npm run seed-matrix-77` for full depth |
| Words per level | 7 | Single-select; exact word match scores perfectly |

## Shared form

The 7^7 form contains **only** the seven matching factors at Level 1. Levels 2+ are word choices within each factor — no separate questions about work style, skills, or other profile topics (those live elsewhere in the app).

**Employers (per job)** and **candidates** answer the **same questions** (`target_role = 'both'`).

| Role | Table | Meaning |
|------|-------|---------|
| Employer | `job_matrix_answers` | Ideal / required profile for the role |
| Candidate | `candidate_matrix_answers` | Self-assessment |

## Scoring (Phase 1)

Implemented in `lib/matching/matrix-score.ts`:

1. For each word level where **both** sides picked a word (`option_id`)
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
matrix_categories     → Level 1: 7 factors
matrix_questions      → Level 2+ word layers (linked to category)
matrix_options        → 7 words per word level
job_matrix_answers    → employer picks (option_id)
candidate_matrix_answers → candidate picks (option_id)
```

## Seeding

```bash
# Minimal (7 factors × Level 2 only × 7 words) — in supabase/seed.sql
# Full depth (7 factors × 7 word levels × 7 words):
npm run seed-matrix-77
```

The seed script replaces existing matrix categories/questions/options. Existing matrix answers may become orphaned — re-run forms after seeding.

## External matching engine

The separate matching service should implement the same comparison rules when reading from Supabase. See [matching-engine-integration.md](./matching-engine-integration.md).

## Future

- Nested drill-down UI (choice at level N reveals level N+1 within a factor)
- Weighted factors / partial credit between related words
- Final confirmed word taxonomy from Deep HR Match product team
