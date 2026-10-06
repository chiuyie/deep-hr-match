import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type UnlockJobState = {
  jobId: string;
  candidateId: string;
  candidateName?: string | null;
  anonymousId?: string | null;
  employerEmail: string;
};

function readUnlockJob(): UnlockJobState {
  const file = path.join(__dirname, ".auth", "unlock-job.json");
  if (!existsSync(file)) {
    throw new Error(
      "Missing e2e/.auth/unlock-job.json — global setup should create it via scripts/e2e-prepare-unlock-job.mjs"
    );
  }
  return JSON.parse(readFileSync(file, "utf8")) as UnlockJobState;
}

function anonymousLabel(candidateId: string) {
  // Matches lib/auth/session.ts anonymizeCandidateId
  return `CAND-${candidateId.slice(0, 8).toUpperCase()}`;
}

test.describe("employer unlock match flow", () => {
  test("matching → mock unlock → unlocked profile report", async ({ page }) => {
    const job = readUnlockJob();
    const selectName = job.anonymousId || anonymousLabel(job.candidateId);

    await page.goto(`/employer/jobs/${job.jobId}/matching`);
    await expect(page.getByRole("heading", { name: /ranked candidates/i })).toBeVisible();
    await expect(page.getByText(/how unlock works/i)).toBeVisible();

    // Prefer the prepared candidate row; fall back to first locked checkbox.
    const preparedCheckbox = page.getByRole("checkbox", {
      name: new RegExp(`select ${selectName}`, "i"),
    });
    if (await preparedCheckbox.count()) {
      await preparedCheckbox.check();
    } else {
      const selectCheckbox = page.getByRole("checkbox", { name: /select/i }).first();
      if (await selectCheckbox.count()) {
        await selectCheckbox.check();
      } else {
        await page.getByText(/select to unlock/i).first().click();
      }
    }

    // Mock: "Unlock 1 candidate (mock)" · Stripe UI: "Unlock 1 — S$49.00"
    const unlockButton = page.getByRole("button", { name: /^Unlock \d+/i });
    await expect(unlockButton).toBeVisible();
    await unlockButton.click();

    await expect(page).toHaveURL(
      new RegExp(`/employer/jobs/${job.jobId}/unlocked`),
      { timeout: 45_000 }
    );

    const onDetail = page.url().includes(`/unlocked/${job.candidateId}`);
    if (onDetail) {
      await expect(page.getByText(/unlocked/i).first()).toBeVisible();
      if (job.candidateName) {
        await expect(page.getByRole("heading", { name: job.candidateName })).toBeVisible({
          timeout: 15_000,
        });
      }
      await expect(
        page.getByRole("link", { name: /back to matching results/i })
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("heading", { name: /unlocked candidates/i }).first()
      ).toBeVisible();
      await expect(page.getByRole("link", { name: /full report/i }).first()).toBeVisible();
      await page.getByRole("link", { name: /full report/i }).first().click();
      await expect(page).toHaveURL(
        new RegExp(`/employer/jobs/${job.jobId}/unlocked/`)
      );
    }
  });

  test("unlocked list remains reachable after purchase", async ({ page }) => {
    const job = readUnlockJob();
    await page.goto(`/employer/jobs/${job.jobId}/unlocked`);
    await expect(
      page.getByRole("heading", { name: /unlocked candidates/i }).first()
    ).toBeVisible();
  });
});
