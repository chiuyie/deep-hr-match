/**
 * Remove jobs that do not have a complete 7^7 Matching Language form.
 *
 * A job is considered complete when it has answers with option_id on all 7
 * factor columns (matrix_column 1–7).
 *
 * Usage:
 *   npm run cleanup-jobs-without-matrix           # delete incomplete jobs
 *   npm run cleanup-jobs-without-matrix -- --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const REQUIRED_COLUMNS = 7;
const dryRun = process.argv.includes("--dry-run");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const placeholders = new Set([
  "https://your-project.supabase.co",
  "your-anon-key",
  "your-service-role-key",
]);

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!url || placeholders.has(url)) {
  fail("Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
}

if (!serviceRoleKey || placeholders.has(serviceRoleKey)) {
  fail("Set SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function countCompleteColumns(answers) {
  const columns = new Set();
  for (const row of answers ?? []) {
    const column = row.matrix_column ?? 0;
    if (column >= 1 && column <= REQUIRED_COLUMNS && row.option_id) {
      columns.add(column);
    }
  }
  return columns.size;
}

async function main() {
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, status, employer_id, created_at")
    .order("created_at", { ascending: true });

  if (jobsError) fail(jobsError.message);
  if (!jobs?.length) {
    console.log("No jobs found.");
    return;
  }

  const jobIds = jobs.map((job) => job.id);
  const { data: matrixAnswers, error: answersError } = await supabase
    .from("job_matrix_answers")
    .select("job_id, matrix_column, option_id")
    .in("job_id", jobIds);

  if (answersError) fail(answersError.message);

  const answersByJob = new Map();
  for (const row of matrixAnswers ?? []) {
    const list = answersByJob.get(row.job_id) ?? [];
    list.push(row);
    answersByJob.set(row.job_id, list);
  }

  const incomplete = [];
  const complete = [];

  for (const job of jobs) {
    const columnCount = countCompleteColumns(answersByJob.get(job.id));
    if (columnCount >= REQUIRED_COLUMNS) {
      complete.push({ job, columnCount });
    } else {
      incomplete.push({ job, columnCount });
    }
  }

  console.log(`Jobs scanned: ${jobs.length}`);
  console.log(`Complete 7^7: ${complete.length}`);
  console.log(`Incomplete / missing 7^7: ${incomplete.length}`);

  if (!incomplete.length) {
    console.log("Nothing to clean.");
    return;
  }

  console.log("\nJobs to remove:");
  for (const { job, columnCount } of incomplete) {
    console.log(
      `  - ${job.title} (${job.status}) · ${columnCount}/${REQUIRED_COLUMNS} columns · ${job.id}`
    );
  }

  if (dryRun) {
    console.log("\nDry run only — no rows deleted. Re-run without --dry-run to delete.");
    return;
  }

  const idsToDelete = incomplete.map(({ job }) => job.id);
  const { error: deleteError } = await supabase.from("jobs").delete().in("id", idsToDelete);

  if (deleteError) fail(deleteError.message);

  console.log(`\nDeleted ${idsToDelete.length} job(s) and related rows (cascade).`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
