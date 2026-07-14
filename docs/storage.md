# Storage

Deep HR Match stores uploaded files in **Supabase Storage** private buckets. Files are never public — access is controlled by storage RLS policies and signed URLs.

## Buckets

Defined in `supabase/migrations/003_storage.sql`:

| Bucket | Public | Size limit | Allowed MIME types |
|--------|--------|------------|------------------|
| `candidate-cvs` | No | 10 MB | PDF, DOC, DOCX |
| `job-jds` | No | 10 MB | PDF, DOC, DOCX |

## Path Conventions

| Bucket | Path pattern | Example |
|--------|--------------|---------|
| `candidate-cvs` | `{candidate_profile_id}/{timestamp}-{filename}` | `a1b2c3.../1720000000-resume.pdf` |
| `job-jds` | `{job_id}/{timestamp}-{filename}` | `d4e5f6.../1720000000-jd.pdf` |

The first path segment is used by storage RLS policies to verify ownership.

## Upload Flow

### Candidate CV

**Action:** `uploadCandidateCV()` in `lib/candidate/actions.ts`

1. `requireRole("candidate")`
2. Resolve `candidate_profiles.id` for current user
3. Upload file to `candidate-cvs` bucket
4. Insert row into `candidate_cv_files` with `file_path`, `file_url`, metadata

### Job JD

**Action:** `uploadJobJD()` in `lib/employer/actions.ts`

1. `requireRole("employer")`
2. Verify job belongs to current employer
3. Upload to `job-jds` bucket
4. Insert row into `job_jd_files`

## Download Flow

### Employer CV access (after unlock)

**File:** `lib/auth/unlock.ts` → `getUnlockedCandidateDetails()`

1. Verify `unlocks` record exists
2. Load latest `candidate_cv_files` for candidate
3. Generate signed URL:
   ```typescript
   supabase.storage.from("candidate-cvs").createSignedUrl(file_path, 3600)
   ```
4. Return URL to page (1-hour expiry)

### Employer JD access

Employers read their own JD files via storage SELECT policy (job ownership). Admin can read all.

## Storage RLS Policies

### `candidate-cvs`

| Operation | Policy |
|-----------|--------|
| INSERT | Authenticated; folder name = `get_candidate_profile_id()` |
| SELECT | Own folder or admin |
| UPDATE / DELETE | Own folder |

Employers do **not** get storage SELECT on CVs directly — they receive signed URLs after unlock via server action.

### `job-jds`

| Operation | Policy |
|-----------|--------|
| INSERT | Authenticated; folder job ID owned by employer |
| SELECT | Own jobs or admin |
| UPDATE / DELETE | Own jobs |

## Database File Metadata

File metadata is duplicated in Postgres for querying and admin views:

| Table | Links to |
|-------|----------|
| `candidate_cv_files` | `candidate_profiles.id` |
| `job_jd_files` | `jobs.id` |

Columns: `file_name`, `file_url`, `file_path`, `file_type`, `file_size`, `uploaded_at`

Admin can view all file metadata at `/admin/files`.

## Troubleshooting

| Issue | Check |
|-------|-------|
| Upload fails with policy error | Migration 003 applied; user authenticated; correct folder path |
| CV download 403 | Unlock record exists; signed URL not expired |
| File too large | 10 MB limit per bucket config |
