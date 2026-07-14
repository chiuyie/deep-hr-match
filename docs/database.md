# Database

Deep HR Match uses **Supabase PostgreSQL**. All application tables live in the `public` schema with **Row Level Security** enabled.

## Migrations

Run in order via Supabase SQL Editor (or `SUPABASE_DB_URL`):

| # | File | Purpose |
|---|------|---------|
| 001 | `supabase/migrations/001_schema.sql` | Tables, enums, indexes, `handle_new_user` trigger |
| 002 | `supabase/migrations/002_rls.sql` | RLS policies + helper functions |
| 003 | `supabase/migrations/003_storage.sql` | Storage buckets + object policies |
| 004 | `supabase/migrations/004_job_form_data.sql` | `jobs.form_data` JSONB column |
| 005 | `supabase/migrations/005_role_security.sql` | Role-change protection, signup metadata trigger |
| 006 | `supabase/migrations/006_fix_signup_trigger.sql` | **Required** — signup INSERT policies + hardened trigger |

**Seed data (manual):** `supabase/seed.sql` — placeholder 7^7 matrix categories, questions, options.

## Enums

| Enum | Values |
|------|--------|
| `user_role` | `candidate`, `employer`, `admin` |
| `candidate_status` | `draft`, `incomplete`, `ready_for_matching` |
| `job_status` | `draft`, `active`, `closed` |
| `matrix_target_role` | `candidate`, `employer`, `both` |
| `question_type` | `single_select`, `multi_select`, `text`, `scale` |
| `payment_status` | `pending`, `paid`, `failed`, `cancelled` |
| `payment_type` | `candidate_profile_unlock` |

## Entity Relationship Diagram

```
auth.users
    │
    └── users (auth_user_id UNIQUE)
            ├── candidate_profiles (user_id UNIQUE)
            │       ├── candidate_cv_files
            │       └── candidate_matrix_answers
            │
            └── employer_profiles (user_id UNIQUE)
                    └── jobs
                            ├── job_jd_files
                            ├── job_matrix_answers
                            ├── match_results ──→ candidate_profiles
                            ├── payments
                            └── unlocks ──→ candidate_profiles

matrix_categories
    └── matrix_questions
            └── matrix_options
                    ├── candidate_matrix_answers (option_id)
                    └── job_matrix_answers (option_id)

activity_logs → users (optional)
```

## Tables

### `users`

Extends Supabase Auth. One row per `auth.users` record.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Application user ID |
| `auth_user_id` | UUID UNIQUE | FK → `auth.users(id)` |
| `role` | `user_role` | Default `candidate` |
| `name` | TEXT | From signup metadata |
| `email` | TEXT | From auth |
| `created_at`, `updated_at` | TIMESTAMPTZ | Auto |

### `candidate_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID UNIQUE | FK → `users` |
| `full_name`, `email`, `phone` | TEXT | |
| `country`, `city` | TEXT | |
| `current_job_title` | TEXT | |
| `years_of_experience` | INTEGER | |
| `highest_education` | TEXT | |
| `skills`, `certifications`, `languages` | TEXT[] | |
| `current_salary`, `expected_salary` | TEXT | |
| `employment_type_preference` | TEXT | |
| `work_arrangement_preference` | TEXT | |
| `availability` | TEXT | |
| `status` | `candidate_status` | Default `draft` |
| `completion_percentage` | INTEGER | 0–100 |

### `employer_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID UNIQUE | FK → `users` |
| `company_name` | TEXT | |
| `registration_number`, `industry`, `company_size` | TEXT | |
| `website`, `company_description` | TEXT | |
| `contact_person_name`, `contact_person_email`, `contact_person_phone` | TEXT | |

### `jobs`

| Column | Type | Notes |
|--------|------|-------|
| `employer_id` | UUID | FK → `employer_profiles` |
| `title` | TEXT | Required |
| `department`, `location`, `employment_type` | TEXT | Legacy columns |
| `salary_range`, `education_required`, `description` | TEXT | |
| `years_experience_required` | INTEGER | |
| `required_skills`, `preferred_skills` | TEXT[] | |
| `status` | `job_status` | Default `draft` |
| `form_data` | JSONB | Extended form fields (migration 004) |

### `matrix_categories` / `matrix_questions` / `matrix_options`

Admin-managed 7^7 framework content. Questions have `target_role` (`candidate`, `employer`, `both`) and `question_type`.

### `candidate_matrix_answers` / `job_matrix_answers`

| Column | Notes |
|--------|-------|
| `question_id` | FK → `matrix_questions` |
| `option_id` | FK → `matrix_options` (nullable) |
| `answer_text` | For text/scale questions |
| UNIQUE | `(candidate_id, question_id)` or `(job_id, question_id)` |

### `candidate_cv_files` / `job_jd_files`

| Column | Notes |
|--------|-------|
| `file_name`, `file_url`, `file_path` | Storage reference |
| `file_type`, `file_size` | Metadata |
| `uploaded_at` | Timestamp |

### `match_results`

| Column | Type | Notes |
|--------|------|-------|
| `job_id`, `candidate_id` | UUID | UNIQUE together |
| `overall_score` | NUMERIC(5,2) | |
| `matrix_score`, `profile_score`, etc. | NUMERIC | Sub-scores |
| `match_summary` | TEXT | |
| `strengths`, `gaps` | TEXT[] | |
| `ranking_position` | INTEGER | |
| `is_placeholder` | BOOLEAN | Phase 1 = true |
| `generated_at` | TIMESTAMPTZ | |

### `payments`

| Column | Notes |
|--------|-------|
| `employer_id`, `job_id` | FKs |
| `candidate_id` | Nullable (legacy single) |
| `selected_candidate_ids` | UUID[] |
| `stripe_session_id` | TEXT |
| `amount` | INTEGER (cents) |
| `currency` | TEXT (default `usd`) |
| `status` | `payment_status` |
| `payment_type` | `candidate_profile_unlock` |
| `paid_at` | TIMESTAMPTZ |

### `unlocks`

| Column | Notes |
|--------|-------|
| `employer_id`, `job_id`, `candidate_id` | UNIQUE together |
| `payment_id` | FK → `payments` |
| `unlocked_at` | TIMESTAMPTZ |

### `activity_logs`

| Column | Notes |
|--------|-------|
| `user_id` | FK → `users` (nullable) |
| `action`, `entity_type`, `entity_id` | Audit fields |
| `metadata` | JSONB |

## Database Functions

### RLS helpers (`002_rls.sql`)

| Function | Returns |
|----------|---------|
| `get_user_role()` | Current user's `user_role` |
| `get_user_id()` | Current user's `users.id` |
| `get_candidate_profile_id()` | Current candidate's profile ID |
| `get_employer_profile_id()` | Current employer's profile ID |
| `is_admin()` | Boolean |
| `has_unlock(job_id, candidate_id)` | Whether employer unlocked candidate for job |

### Triggers

| Trigger | Table | Purpose |
|---------|-------|---------|
| `update_*_updated_at` | 9 tables | Auto-set `updated_at` |
| `on_auth_user_created` | `auth.users` | `handle_new_user()` provisioning |

### `handle_new_user()` (migration 006)

Runs `AFTER INSERT ON auth.users`:

1. Reads `name` and `role` from `raw_user_meta_data`
2. Inserts `public.users` with role (`employer` if metadata says so, else `candidate`)
3. Creates `employer_profiles` or `candidate_profiles`

`SECURITY DEFINER SET search_path = public` — required for RLS bypass during signup.

## Indexes

Key indexes from `001_schema.sql`:

- `users(auth_user_id)`, `users(role)`
- `candidate_profiles(status)`
- `jobs(employer_id)`, `jobs(status)`
- `match_results(job_id)`, `match_results(candidate_id)`
- `payments(employer_id)`
- `unlocks(employer_id, job_id)`

## TypeScript Types

Shared types live in `types/database.ts`. Keep in sync when schema changes.
