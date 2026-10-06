import { test as setup, expect } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const authDir = path.join(__dirname, ".auth");
const authFile = path.join(authDir, "employer.json");
const jobStateFile = path.join(authDir, "unlock-job.json");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
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

setup("authenticate employer and prepare unlock job", async ({ page }) => {
  loadEnvLocal();

  const email =
    process.env.E2E_EMPLOYER_EMAIL?.trim() || "employer-demo-1@deephrmatch.test";
  const password =
    process.env.E2E_EMPLOYER_PASSWORD?.trim() ||
    process.env.DUMMY_USER_PASSWORD?.trim() ||
    "DemoUser123!";

  setup.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Supabase env missing — set .env.local before running Playwright unlock E2E"
  );

  mkdirSync(authDir, { recursive: true });

  execFileSync("node", ["scripts/e2e-prepare-unlock-job.mjs"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
  });

  expect(existsSync(jobStateFile)).toBeTruthy();

  await page.goto("/auth/sign-in?role=employer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /log in as/i }).click();

  await expect(page).toHaveURL(/\/employer(\/|$)/, { timeout: 30_000 });
  await page.context().storageState({ path: authFile });
});
