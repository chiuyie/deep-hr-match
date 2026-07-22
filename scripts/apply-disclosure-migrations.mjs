/**
 * Apply disclosure-related migrations that may be missing on remote Supabase:
 * 008 (employer_disclosure_mode), 011 (platform_disclosure_items), 012 (matrix RLS).
 *
 * Prefers SUPABASE_DB_URL (Postgres). Falls back to exec_sql RPC if present.
 *
 * Usage: node scripts/apply-disclosure-migrations.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

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

const migrations = [
  "008_form_field_disclosure.sql",
  "011_platform_disclosure.sql",
  "012_unlocked_matrix_answers_read.sql",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl = process.env.SUPABASE_DB_URL?.trim();

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!url) fail("Set NEXT_PUBLIC_SUPABASE_URL in .env.local");

const files = migrations.map((name) => ({
  name,
  sql: readFileSync(join(root, "supabase", "migrations", name), "utf8"),
}));

async function applyWithPg() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const file of files) {
      console.log(`Applying ${file.name}...`);
      await client.query(file.sql);
      console.log(`  OK ${file.name}`);
    }
  } finally {
    await client.end();
  }
}

async function applyWithRpc() {
  if (!serviceRoleKey) return false;
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const file of files) {
    console.log(`Applying ${file.name} via exec_sql...`);
    const { error } = await supabase.rpc("exec_sql", { query: file.sql });
    if (error) {
      console.error(`  Failed ${file.name}: ${error.message}`);
      return false;
    }
    console.log(`  OK ${file.name}`);
  }
  return true;
}

async function verify() {
  if (!serviceRoleKey) return;
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: modeErr } = await supabase
    .from("form_fields")
    .select("employer_disclosure_mode")
    .limit(1);
  if (modeErr) fail(`Verify employer_disclosure_mode failed: ${modeErr.message}`);

  const { data: platform, error: platformErr } = await supabase
    .from("platform_disclosure_items")
    .select("disclosure_key")
    .order("sort_order");
  if (platformErr) fail(`Verify platform_disclosure_items failed: ${platformErr.message}`);
  console.log(
    `Verified: employer_disclosure_mode present; platform_disclosure_items=${platform?.length ?? 0} rows`
  );
}

console.log("Applying disclosure migrations...");
console.log("");

if (dbUrl) {
  try {
    await import("pg");
  } catch {
    console.log("Installing pg...");
    const { execSync } = await import("node:child_process");
    execSync("npm install pg --no-save", { stdio: "inherit", cwd: root });
  }
  try {
    await applyWithPg();
    await verify();
    console.log("Done.");
    process.exit(0);
  } catch (error) {
    console.error("Failed via SUPABASE_DB_URL:", error.message);
    console.log("");
  }
}

const rpcOk = await applyWithRpc();
if (rpcOk) {
  await verify();
  console.log("Done.");
  process.exit(0);
}

console.log("Could not apply automatically (need SUPABASE_DB_URL or exec_sql RPC).");
console.log("");
console.log("Run these files in order in Supabase Dashboard → SQL Editor:");
for (const file of files) {
  console.log(`  supabase/migrations/${file.name}`);
}
process.exit(1);
