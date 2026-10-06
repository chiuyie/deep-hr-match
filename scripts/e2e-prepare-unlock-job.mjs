import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");
const outDir = join(root, "e2e", ".auth");
const statePath = join(outDir, "unlock-job.json");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const employerEmail =
  process.env.E2E_EMPLOYER_EMAIL?.trim() || "employer-demo-1@deephrmatch.test";

function fail(message) {
  console.error(`e2e:prepare-unlock-job: ${message}`);
  process.exit(1);
}

if (!url || !serviceRoleKey) {
  fail("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) fail(listError.message);

  const authUser = authUsers.users.find(
    (user) => user.email?.toLowerCase() === employerEmail.toLowerCase()
  );
  if (!authUser) {
    fail(
      `Employer ${employerEmail} not found. Run: npm run seed-dummy-users (or set E2E_EMPLOYER_EMAIL).`
    );
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();
  if (userError || !appUser) fail(userError?.message || "App user missing for employer");
  if (appUser.role !== "employer") fail(`User ${employerEmail} is not an employer`);

  const { data: employer, error: employerError } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", appUser.id)
    .maybeSingle();
  if (employerError || !employer) fail(employerError?.message || "Employer profile missing");

  const { data: candidate, error: candidateError } = await supabase
    .from("candidate_profiles")
    .select("id, full_name, status")
    .eq("status", "ready_for_matching")
    .limit(1)
    .maybeSingle();
  if (candidateError || !candidate) {
    fail(
      "No ready_for_matching candidate found. Run: npm run seed-dummy-users or reseed-complete-demo-data."
    );
  }

  let jobId = process.env.E2E_JOB_ID?.trim() || "";
  if (!jobId) {
    const { data: existingJob } = await supabase
      .from("jobs")
      .select("id, title, status")
      .eq("employer_id", employer.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingJob?.id) {
      jobId = existingJob.id;
    } else {
      const { data: created, error: jobError } = await supabase
        .from("jobs")
        .insert({
          employer_id: employer.id,
          title: "E2E Unlock QA Role",
          status: "active",
          location: "Singapore",
          department: "Engineering",
          employment_type: "Full-time",
          description: "Seeded job for Playwright unlock flow.",
        })
        .select("id")
        .single();
      if (jobError || !created) fail(jobError?.message || "Failed to create E2E job");
      jobId = created.id;
    }
  }

  // Ensure at least one match row that is not already unlocked.
  await supabase
    .from("unlocks")
    .delete()
    .eq("employer_id", employer.id)
    .eq("job_id", jobId)
    .eq("candidate_id", candidate.id);

  const { error: matchError } = await supabase.from("match_results").upsert(
    {
      job_id: jobId,
      candidate_id: candidate.id,
      ranking_position: 99,
      overall_score: 91,
      is_placeholder: false,
      match_summary: "E2E strong fit for unlock flow QA.",
      strengths: ["E2E strength"],
      gaps: ["E2E gap"],
      generated_at: new Date().toISOString(),
    },
    { onConflict: "job_id,candidate_id" }
  );
  if (matchError) fail(matchError.message);

  // Matches lib/auth/session.ts anonymizeCandidateId
  const anonymousId = `CAND-${String(candidate.id).slice(0, 8).toUpperCase()}`;

  mkdirSync(outDir, { recursive: true });
  const payload = {
    employerEmail,
    employerId: employer.id,
    jobId,
    candidateId: candidate.id,
    candidateName: candidate.full_name,
    anonymousId,
    preparedAt: new Date().toISOString(),
  };
  writeFileSync(statePath, JSON.stringify(payload, null, 2));
  console.log(`Prepared unlock E2E job → ${statePath}`);
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
