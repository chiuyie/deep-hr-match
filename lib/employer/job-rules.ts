import type { JobStatus } from "@/types/database";

export interface JobLifecycleState {
  status: JobStatus;
  hasMatches: boolean;
  hasUnlocks?: boolean;
}

/**
 * Job lifecycle (employer-facing):
 * 1. Create job (draft → active when posted)
 * 2. Generate anonymous match results (active jobs; repeatable = regenerate)
 * 3. Pay per candidate to unlock full profiles
 * 4. View job + past results anytime; never edit posted jobs — create a new job instead
 */

/** Only unfinished drafts can be edited. Posted jobs are locked to their match history. */
export function canEditJob(state: JobLifecycleState): boolean {
  return state.status === "draft";
}

/** First-time matching run on a posted active job. */
export function canGenerateMatching(state: JobLifecycleState): boolean {
  return state.status === "active" && !state.hasMatches;
}

/** Replace anonymous results with a fresh match run (active jobs only). */
export function canRegenerateMatching(state: JobLifecycleState): boolean {
  return state.status === "active" && state.hasMatches;
}

/** Generate or regenerate matching on an active posted job. */
export function canRunMatching(state: JobLifecycleState): boolean {
  return canGenerateMatching(state) || canRegenerateMatching(state);
}

/** Browse previous anonymous results (and unlock purchases). */
export function canViewMatching(state: JobLifecycleState): boolean {
  return state.hasMatches && (state.status === "active" || state.status === "closed");
}

export function canOpenMatchingPage(state: JobLifecycleState): boolean {
  if (state.status === "active") return true;
  return canViewMatching(state);
}

export function matchingActionLabel(state: JobLifecycleState): string {
  if (canViewMatching(state)) return "View Matching";
  if (canGenerateMatching(state)) return "Generate Matching";
  if (state.status === "active") return "Matching";
  return "Matching";
}

export function matchingRunButtonLabel(state: JobLifecycleState): string {
  if (canRegenerateMatching(state)) return "Refresh Matches";
  if (canGenerateMatching(state)) return "Generate Matches";
  return "Generate Matches";
}

export function editBlockedReason(state: JobLifecycleState): string | null {
  if (canEditJob(state)) return null;
  return "Posted jobs cannot be edited. Matching results are tied to this posting — create a new job if requirements change.";
}

export function runMatchingBlockedReason(state: JobLifecycleState): string | null {
  if (canRunMatching(state)) return null;
  if (state.status === "draft") {
    return "Finish and post the job (Active status) before generating matches.";
  }
  if (state.status === "closed") {
    return "This job is closed. You can view past results but cannot generate new ones.";
  }
  return null;
}

export function refreshMatchingWarning(state: JobLifecycleState): string | null {
  if (!canRegenerateMatching(state)) return null;
  if (state.hasUnlocks) {
    return "Refreshing creates a new snapshot of the candidate pool. Rankings may change; unlocked profiles stay available on the Unlocked tab.";
  }
  return "Refreshing re-scores the current candidate pool and replaces this snapshot (includes any new candidates since last run).";
}

/** @deprecated Use refreshMatchingWarning */
export const regenerateWarning = refreshMatchingWarning;

/** Where to send the employer after submitting the job 7^7 form. */
export function getEmployerMatrixSubmitRedirect(jobId: string, status: JobStatus): string {
  if (status === "draft") {
    return `/employer/jobs/${jobId}?matrix=complete`;
  }
  return `/employer/jobs/${jobId}/matching?matrix=complete`;
}
