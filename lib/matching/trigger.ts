/**
 * Dispatches a match run to the configured engine.
 *
 * Phase 1 default: inline placeholder in this repo (`lib/matching/engine.ts`).
 * Production: set MATCHING_ENGINE_URL to your separate matching service; that
 * service writes `match_results` to the same Supabase database.
 *
 * @see docs/matching-engine-integration.md
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { generatePlaceholderMatches } from "@/lib/matching/engine";

export interface MatchRunRequest {
  jobId: string;
  employerId: string;
}

export type MatchRunSource = "inline" | "external";
export type MatchRunStatus = "completed" | "queued";

export interface MatchRunResult {
  source: MatchRunSource;
  status: MatchRunStatus;
}

export function resolveMatchingEngineMode(): MatchRunSource {
  return process.env.MATCHING_ENGINE_URL?.trim() ? "external" : "inline";
}

export async function triggerMatchRun(
  supabase: SupabaseClient,
  request: MatchRunRequest
): Promise<MatchRunResult> {
  const engineUrl = process.env.MATCHING_ENGINE_URL?.trim();

  if (engineUrl) {
    return requestExternalMatchRun(engineUrl, request);
  }

  await generatePlaceholderMatches(supabase, request);
  return { source: "inline", status: "completed" };
}

async function requestExternalMatchRun(
  engineUrl: string,
  request: MatchRunRequest
): Promise<MatchRunResult> {
  const apiKey = process.env.MATCHING_ENGINE_API_KEY?.trim();
  const base = engineUrl.replace(/\/$/, "");

  const response = await fetch(`${base}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      job_id: request.jobId,
      employer_id: request.employerId,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Matching engine request failed (${response.status})${detail ? `: ${detail}` : ""}`
    );
  }

  let payload: { status?: string } = {};
  try {
    payload = (await response.json()) as { status?: string };
  } catch {
    // Empty or non-JSON body — treat as completed sync run
  }

  const status: MatchRunStatus =
    payload.status === "queued" || payload.status === "pending" ? "queued" : "completed";

  return { source: "external", status };
}
