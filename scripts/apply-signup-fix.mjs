import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

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
const migrationPath = join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "006_fix_signup_trigger.sql"
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl = process.env.SUPABASE_DB_URL?.trim();

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!url) {
  fail("Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
}

const sql = readFileSync(migrationPath, "utf8");

async function verifySignupWorks() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) {
    return;
  }

  const email = `signup-verify-${Date.now()}@mailinator.com`;
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      email,
      password: "TestPass123!",
      data: { name: "Signup Verify", role: "employer" },
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    fail(`Signup still failing (${response.status}): ${body}`);
  }

  console.log("Signup verification succeeded for a fresh employer email.");
}

async function applyWithPg() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function applyWithSupabaseCli() {
  const projectRef = new URL(url).hostname.split(".")[0];
  const { execSync } = await import("node:child_process");
  execSync(`npx supabase db push --db-url "${dbUrl}"`, {
    stdio: "inherit",
    cwd: join(__dirname, ".."),
    env: {
      ...process.env,
      SUPABASE_PROJECT_REF: projectRef,
    },
  });
}

console.log("Applying signup fix migration...");
console.log("");

if (dbUrl) {
  try {
    await applyWithPg();
    console.log("Migration applied via SUPABASE_DB_URL.");
    await verifySignupWorks();
    process.exit(0);
  } catch (error) {
    console.error("Failed to apply via SUPABASE_DB_URL:", error.message);
    console.log("");
  }
}

if (serviceRoleKey) {
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (!error) {
    console.log("Migration applied via exec_sql RPC.");
    await verifySignupWorks();
    process.exit(0);
  }
}

console.log("Could not apply automatically.");
console.log("");
console.log("Run this SQL in the Supabase Dashboard -> SQL Editor:");
console.log("");
console.log(sql);
console.log("");
console.log(
  "Optional: add SUPABASE_DB_URL to .env.local (Database Settings -> Connection string) and rerun:"
);
console.log("  node scripts/apply-signup-fix.mjs");
process.exit(1);
