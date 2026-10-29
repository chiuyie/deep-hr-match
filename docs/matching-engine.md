# Matching logic

This is the business process the product uses today. The inline engine in `lib/matching/` is that process. An optional external service can replace the whole run later (`MATCHING_ENGINE_URL`); until that URL is set, this document is what runs.

Related: [Job lifecycle](./job-lifecycle.md) for when a snapshot is created, [7^7 matching language](./matrix-matching-language.md) for the form structure.

## The rule in one paragraph

Matching is two steps, in this order.

1. **Filters decide who appears.** If the employer set a requirement and the candidate does not meet it, that candidate is removed. They are not in the match results. They do not receive a lower score.
2. **The score is only the 7^7 matching language.** Everyone who passed the filters is ranked by how closely their 7^7 answers match the job's 7^7 answers. Salary, skills, years of experience, education, job titles, and preferred locations do not change the number.

A high score means the matching language lines up. It does not mean the profile is more complete, and it does not add points for agreeing with filters. Agreement with a filter only keeps the candidate in the list.

## When a match run happens

Matching does not run continuously. Each generate or refresh builds a **snapshot**: a point-in-time list for one job.

| When | What happens |
|------|----------------|
| Job is posted (`active`) and has no results yet | First snapshot runs automatically |
| Employer clicks **Refresh Matches** | The previous list for that job is replaced |
| A new candidate becomes ready later | They are **not** added until the employer refreshes |

A run needs 7^7 answers on the job. If those answers are missing, the run stops and does not invent scores.

The pool is every candidate with `status = 'ready_for_matching'`. Draft and incomplete profiles are not considered. The pool is shared across jobs; each job filters and ranks it separately.

After ranking, only the **top 25** are stored (`MATCH_DISPLAY_LIMIT`). Unlocks are separate: refreshing the list does not revoke a profile the employer already paid to open.

## Step 1 — Filters

Code: `lib/matching/job-filters.ts`. Employer choices live in `jobs.form_data`. Candidate answers live on `candidate_profiles` and in `custom_fields`.

A filter the employer leaves empty, or sets to **No preference**, is off. It removes nobody. The same is true for the inactive values `other`, `n/a`, `na`, and `none` (this is why availability no longer offers "Other" as a real requirement).

If the filter is on:

| Candidate answer | Result |
|------------------|--------|
| Matches the rule below | Stays in |
| Does not match | Removed |
| Blank | Removed |

Blank is not a partial score. The candidate never reaches step 2 for that job.

### Exact filters

These must be the same value, ignoring case and extra spaces:

| Employer field | Candidate answer |
|----------------|------------------|
| Work pass / eligibility | `employment_eligibility_visa` |
| Nationality | `nationality` |
| Ethnicity | `ethnicity` |
| Gender | `gender` |
| Religion | `religion` |
| Dialect | `dialect` |
| Height | `height` |
| Weight | `weight` |
| Fitness level | `fitness_level` |
| Work arrangement | `work_arrangement_preference` |

**Nationalities to exclude** is the reverse: a candidate with that nationality is removed. Anyone else stays in. A blank nationality does not trigger the exclusion.

### Age

The employer picks a band: `18-25`, `26-30`, `31-35`, `36-40`, `41-45`, `46-50`, `51-55`, `56-60`, or `60+`.

The candidate does not pick a band. The band is calculated from **date of birth**. A saved age-range answer is used only when the date of birth is missing. Under 18 does not fall into a band, so an active age filter removes them.

### Country and city

Employer and candidate use one shared list:

- Countries: Singapore, Malaysia, China, India, Indonesia, Philippines, Thailand, Vietnam, Others
- Cities: Singapore, Kuala Lumpur, Penang, Johor Bahru, Jakarta, Bangkok, Manila, Ho Chi Minh, Others

A place that is not on the list counts as **Others**. `Other` and known aliases count too (`Ho Chi Minh City` → `Ho Chi Minh`, `Japan` → `Others`). Birth country uses the country list. Current country and city come from the candidate's About you fields.

**Others** is a real filter. It keeps people outside the named list. It is not "no preference".

### Availability and time in country

Availability is "as soon as the employer needs, or sooner":

| Answer | Treated as |
|--------|------------|
| Immediate | 0 days |
| 1 week | 7 |
| 2 weeks | 14 |
| 1 month | 30 |
| 2 months | 60 |
| 3+ months | 90 |

If the job needs someone within 2 weeks, Immediate and 2 weeks stay in. 1 month is removed.

Time in the current country is a minimum. The candidate enters the date they started living there, and the band is calculated from that date on each match run, so it moves forward without another save. An older saved band is used only when that date is missing.

### Languages

If the job lists languages, the candidate must have every one of them. Proficiency is not compared.

### Role yes/no questions

These are hard filters only when the employer answers **Yes** (the role requires it). The candidate must also answer **Yes**. **No** or blank removes them. An employer **No** does not filter.

| Employer question | Candidate must answer Yes |
|-------------------|---------------------------|
| Overtime required | Willing to work overtime |
| Work outside standard hours | Willing to work outside standard hours |
| Weekend or public holiday work | Willing to work those days |
| Driving licence required | Has a valid driving licence |
| Personal vehicle required | Has access to a vehicle |
| Work-related travel required | Willing to travel for work |
| Must be willing to relocate | Willing to relocate |
| Background check required | Willing to undergo a background check |

**Accessibility is not a filter.** The employer question records whether the role needs workplace accessibility arrangements. It does not remove candidates, whether they need arrangements, do not need them, or leave it blank.

## Step 2 — 7^7 score

Code: `lib/matching/matrix-score.ts`.

Only candidates who passed every active filter are scored. The job's `job_matrix_answers` are compared with each candidate's `candidate_matrix_answers`.

| Rule | Detail |
|------|--------|
| What is compared | The same factor column (`matrix_column` 1–7) and the same question |
| What counts as a match | The same `option_id` |
| Column score | Share of comparable picks in that column that match, as 0–100 |
| Overall score | Weighted average across columns that both sides answered, then rounded. Skills - Function is 16%; each other factor is 14% |
| Missing column | Left out and the remaining columns keep their relative weights. It does not add a zero |
| No comparable answers | Score is 0 |

`overall_score` and `matrix_score` are that same number. `profile_score`, `skills_score`, `experience_score`, and `education_score` are stored as null. They are not calculated.

Results are sorted by `overall_score`, highest first. Ties keep their relative order from the pool. `ranking_position` is 1, 2, 3, and so on. Rows are written with `is_placeholder = false`.

Fit labels on the report (strong / mixed / weak) are bands on this same number: 80 and above, 50–79, and below 50. They do not add another score.

## What does not affect the score

These can still appear on a profile or an unlock. They do not filter and they do not change rank:

- Current salary and expected salary
- Skills, years of experience, and education derived from the timelines
- Desired job titles, preferred locations, and employment type
- Home address and postal code
- How many optional matching fields the candidate filled in, once they have already passed the filters

Two candidates with the same 7^7 answers and the same filter pass get the same score. Extra profile detail does not raise it.

## What the employer sees

The matching page reads the stored snapshot, ordered by rank. Names, email, and phone stay hidden until unlock. The score and the 7^7 comparison describe language alignment among people who already cleared the job's filters.

Refreshing deletes `match_results` for that job and writes a new top 25. Someone who no longer passes a filter, or who falls below the top 25, drops off the anonymous list. A previously unlocked profile stays available on the Unlocked tab.

## Code map

| File | Role |
|------|------|
| `lib/matching/trigger.ts` | Inline run, or HTTP to an external engine when configured |
| `lib/matching/engine.ts` | Load pool, filter, score, rank, write top 25 |
| `lib/matching/job-filters.ts` | Step 1 |
| `lib/matching/age-range.ts` | Date of birth → age band |
| `lib/constants/match-locations.ts` | Shared country and city list |
| `lib/constants/job-form.ts` | Employer filter and role-question definitions |
| `lib/matching/matrix-score.ts` | Step 2 |
| `lib/matching/match-narrative.ts` | Wording for the score band |
| `lib/matching/snapshot.ts` | Snapshot time and "new candidates since" count |

## Constants

```typescript
export const MATCH_DISPLAY_LIMIT = 25;
export const UNLOCK_PRICE_CENTS = 1000; // S$10.00
export const UNLOCK_CURRENCY = "sgd";
```
