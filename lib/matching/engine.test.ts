import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generatePlaceholderMatches,
  MATCH_DISPLAY_LIMIT,
} from "@/lib/matching/engine";

type JobAnswer = {
  question_id: string;
  option_id: string | null;
  matrix_column: number | null;
};

type CandidateAnswer = JobAnswer & { candidate_id: string };

type Fixture = {
  job: { id: string; employer_id: string } | null;
  jobAnswers: JobAnswer[];
  candidates: { id: string; status: string }[];
  candidateAnswers: CandidateAnswer[];
};

function createSupabaseMock(fixture: Fixture) {
  let insertedRows: Record<string, unknown>[] = [];

  const supabase = {
    from(table: string) {
      if (table === "jobs") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () =>
                  fixture.job
                    ? { data: fixture.job, error: null }
                    : { data: null, error: { message: "not found" } },
              }),
            }),
          }),
        };
      }

      if (table === "job_matrix_answers") {
        return {
          select: () => ({
            eq: async () => ({ data: fixture.jobAnswers, error: null }),
          }),
        };
      }

      if (table === "candidate_profiles") {
        return {
          select: () => ({
            eq: async () => ({ data: fixture.candidates, error: null }),
          }),
        };
      }

      if (table === "candidate_matrix_answers") {
        return {
          select: () => ({
            in: async () => ({ data: fixture.candidateAnswers, error: null }),
          }),
        };
      }

      if (table === "match_results") {
        return {
          delete: () => ({
            eq: async () => ({ error: null }),
          }),
          upsert: (rows: Record<string, unknown>[]) => {
            insertedRows = rows;
            return {
              select: async () => ({ data: rows, error: null }),
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return {
    supabase: supabase as unknown as SupabaseClient,
    getInserted: () => insertedRows,
  };
}

describe("generatePlaceholderMatches", () => {
  it("throws when job is missing or not owned", async () => {
    const { supabase } = createSupabaseMock({
      job: null,
      jobAnswers: [],
      candidates: [],
      candidateAnswers: [],
    });

    await expect(
      generatePlaceholderMatches(supabase, {
        jobId: "job-1",
        employerId: "emp-1",
      })
    ).rejects.toThrow("Job not found or access denied");
  });

  it("returns empty when no ready candidates exist", async () => {
    const { supabase } = createSupabaseMock({
      job: { id: "job-1", employer_id: "emp-1" },
      jobAnswers: [{ question_id: "q1", option_id: "a", matrix_column: 1 }],
      candidates: [],
      candidateAnswers: [],
    });

    await expect(
      generatePlaceholderMatches(supabase, {
        jobId: "job-1",
        employerId: "emp-1",
      })
    ).resolves.toEqual({ count: 0, results: [] });
  });

  it("ranks candidates by equal-weight matrix score and clears placeholder flag", async () => {
    const { supabase, getInserted } = createSupabaseMock({
      job: { id: "job-1", employer_id: "emp-1" },
      jobAnswers: [
        { question_id: "q1", option_id: "a", matrix_column: 1 },
        { question_id: "q2", option_id: "b", matrix_column: 2 },
      ],
      candidates: [
        { id: "cand-low", status: "ready_for_matching" },
        { id: "cand-high", status: "ready_for_matching" },
        { id: "cand-mid", status: "ready_for_matching" },
      ],
      candidateAnswers: [
        // high: both columns match → 100
        { candidate_id: "cand-high", question_id: "q1", option_id: "a", matrix_column: 1 },
        { candidate_id: "cand-high", question_id: "q2", option_id: "b", matrix_column: 2 },
        // mid: one of two → 50
        { candidate_id: "cand-mid", question_id: "q1", option_id: "a", matrix_column: 1 },
        { candidate_id: "cand-mid", question_id: "q2", option_id: "x", matrix_column: 2 },
        // low: none → 0
        { candidate_id: "cand-low", question_id: "q1", option_id: "x", matrix_column: 1 },
        { candidate_id: "cand-low", question_id: "q2", option_id: "y", matrix_column: 2 },
      ],
    });

    const { count, results } = await generatePlaceholderMatches(supabase, {
      jobId: "job-1",
      employerId: "emp-1",
    });

    expect(count).toBe(3);
    expect(results?.map((r) => r.candidate_id)).toEqual([
      "cand-high",
      "cand-mid",
      "cand-low",
    ]);
    expect(results?.map((r) => r.overall_score)).toEqual([100, 50, 0]);
    expect(results?.map((r) => r.ranking_position)).toEqual([1, 2, 3]);
    expect(results?.every((r) => r.is_placeholder === false)).toBe(true);
    expect(results?.every((r) => r.profile_score === null)).toBe(true);
    expect(results?.[0]?.match_summary).toContain("equal column weights");

    const inserted = getInserted();
    expect(inserted).toHaveLength(3);
    expect(inserted[0]?.generated_at).toBe(inserted[1]?.generated_at);
  });

  it("does not collapse same question_id across columns when ranking", async () => {
    const { supabase } = createSupabaseMock({
      job: { id: "job-1", employer_id: "emp-1" },
      jobAnswers: [
        { question_id: "root", option_id: "col1", matrix_column: 1 },
        { question_id: "root", option_id: "col2", matrix_column: 2 },
      ],
      candidates: [{ id: "cand-1", status: "ready_for_matching" }],
      candidateAnswers: [
        { candidate_id: "cand-1", question_id: "root", option_id: "col1", matrix_column: 1 },
        { candidate_id: "cand-1", question_id: "root", option_id: "other", matrix_column: 2 },
      ],
    });

    const { results } = await generatePlaceholderMatches(supabase, {
      jobId: "job-1",
      employerId: "emp-1",
    });

    expect(results?.[0]?.overall_score).toBe(50);
    expect(results?.[0]?.is_placeholder).toBe(false);
  });

  it("throws when job has no matrix answers", async () => {
    const { supabase } = createSupabaseMock({
      job: { id: "job-1", employer_id: "emp-1" },
      jobAnswers: [],
      candidates: [
        { id: "cand-a", status: "ready_for_matching" },
        { id: "cand-b", status: "ready_for_matching" },
      ],
      candidateAnswers: [],
    });

    await expect(
      generatePlaceholderMatches(supabase, {
        jobId: "job-1",
        employerId: "emp-1",
      })
    ).rejects.toThrow(/7\^7 matching language/);
  });

  it("caps inserted rows at MATCH_DISPLAY_LIMIT", async () => {
    const candidates = Array.from({ length: MATCH_DISPLAY_LIMIT + 5 }, (_, i) => ({
      id: `cand-${i}`,
      status: "ready_for_matching",
    }));

    const { supabase, getInserted } = createSupabaseMock({
      job: { id: "job-1", employer_id: "emp-1" },
      jobAnswers: [{ question_id: "q1", option_id: "a", matrix_column: 1 }],
      candidates,
      candidateAnswers: candidates.map((c) => ({
        candidate_id: c.id,
        question_id: "q1",
        option_id: "a",
        matrix_column: 1,
      })),
    });

    const { count } = await generatePlaceholderMatches(supabase, {
      jobId: "job-1",
      employerId: "emp-1",
    });

    expect(count).toBe(MATCH_DISPLAY_LIMIT);
    expect(getInserted()).toHaveLength(MATCH_DISPLAY_LIMIT);
  });
});
