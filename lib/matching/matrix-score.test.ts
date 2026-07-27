import { describe, expect, it } from "vitest";
import {
  PLATFORM_EQUAL_COLUMN_WEIGHT,
  PLATFORM_MATRIX_COLUMN_WEIGHTS,
  scoreMatrixMatch,
  type MatrixAnswerPick,
} from "./matrix-score";

function pick(
  question_id: string,
  option_id: string | null,
  matrix_column?: number | null
): MatrixAnswerPick {
  return { question_id, option_id, matrix_column };
}

describe("platform equal column weights", () => {
  it("uses equal 1/7 weights across seven factors", () => {
    expect(PLATFORM_MATRIX_COLUMN_WEIGHTS).toHaveLength(7);
    expect(PLATFORM_EQUAL_COLUMN_WEIGHT).toBeCloseTo(1 / 7);
    expect(
      PLATFORM_MATRIX_COLUMN_WEIGHTS.every((w) => w === PLATFORM_EQUAL_COLUMN_WEIGHT)
    ).toBe(true);
    expect(PLATFORM_MATRIX_COLUMN_WEIGHTS.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});

describe("scoreMatrixMatch — legacy (no matrix_column)", () => {
  it("returns perfect score when all picks match", () => {
    const job = [pick("q1", "a"), pick("q2", "b")];
    const candidate = [pick("q1", "a"), pick("q2", "b")];
    expect(scoreMatrixMatch(job, candidate)).toEqual({
      matrixScore: 100,
      matchedCount: 2,
      totalCount: 2,
      columnScores: [],
    });
  });

  it("returns partial score for mixed matches", () => {
    const job = [pick("q1", "a"), pick("q2", "b"), pick("q3", "c")];
    const candidate = [pick("q1", "a"), pick("q2", "x"), pick("q3", "c")];
    expect(scoreMatrixMatch(job, candidate)).toEqual({
      matrixScore: 67,
      matchedCount: 2,
      totalCount: 3,
      columnScores: [],
    });
  });

  it("ignores questions only answered on one side", () => {
    const job = [pick("q1", "a")];
    const candidate = [pick("q1", "a"), pick("q2", "b")];
    expect(scoreMatrixMatch(job, candidate)).toEqual({
      matrixScore: 100,
      matchedCount: 1,
      totalCount: 1,
      columnScores: [],
    });
  });

  it("returns zero when nothing is comparable", () => {
    expect(scoreMatrixMatch([], [])).toEqual({
      matrixScore: 0,
      matchedCount: 0,
      totalCount: 0,
      columnScores: [],
    });
  });

  it("ignores null option_id rows", () => {
    const job = [pick("q1", "a"), pick("q2", null)];
    const candidate = [pick("q1", "a"), pick("q2", "b")];
    expect(scoreMatrixMatch(job, candidate)).toEqual({
      matrixScore: 100,
      matchedCount: 1,
      totalCount: 1,
      columnScores: [],
    });
  });

  it("respects optional questionIds filter when provided", () => {
    const job = [pick("q1", "a"), pick("q2", "b"), pick("q3", "c")];
    const candidate = [pick("q1", "a"), pick("q2", "x"), pick("q3", "c")];
    expect(scoreMatrixMatch(job, candidate, ["q1", "q3"])).toEqual({
      matrixScore: 100,
      matchedCount: 2,
      totalCount: 2,
      columnScores: [],
    });
  });
});

describe("scoreMatrixMatch — column-aware equal weights", () => {
  it("scores each factor column separately and averages with equal weights", () => {
    const job = [pick("q1", "a", 1), pick("q2", "b", 2)];
    const candidate = [pick("q1", "a", 1), pick("q2", "x", 2)];

    const result = scoreMatrixMatch(job, candidate);
    expect(result.matrixScore).toBe(50);
    expect(result.matchedCount).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.columnScores).toEqual([
      {
        column: 1,
        weight: PLATFORM_EQUAL_COLUMN_WEIGHT,
        matchedCount: 1,
        totalCount: 1,
        columnScore: 100,
      },
      {
        column: 2,
        weight: PLATFORM_EQUAL_COLUMN_WEIGHT,
        matchedCount: 0,
        totalCount: 1,
        columnScore: 0,
      },
    ]);
  });

  it("does not collapse the same question_id across different columns", () => {
    const job = [
      pick("root", "col1-word", 1),
      pick("root", "col2-word", 2),
    ];
    const candidate = [
      pick("root", "col1-word", 1),
      pick("root", "other", 2),
    ];

    const result = scoreMatrixMatch(job, candidate);
    expect(result.matrixScore).toBe(50);
    expect(result.columnScores).toHaveLength(2);
  });

  it("gives equal influence to each comparable column regardless of cell count", () => {
    // Col1: 1/1 = 100%; Col2: 1/3 ≈ 33% → equal avg ≈ 67 (not cell-weighted 50)
    const job = [
      pick("a", "1", 1),
      pick("b", "1", 2),
      pick("c", "1", 2),
      pick("d", "1", 2),
    ];
    const candidate = [
      pick("a", "1", 1),
      pick("b", "1", 2),
      pick("c", "x", 2),
      pick("d", "x", 2),
    ];

    const result = scoreMatrixMatch(job, candidate);
    expect(result.matrixScore).toBe(67);
    expect(result.columnScores.map((c) => c.columnScore)).toEqual([100, 33]);
  });

  it("returns 100 when all seven columns match exactly", () => {
    const job = Array.from({ length: 7 }, (_, i) =>
      pick("root", `word-${i + 1}`, i + 1)
    );
    const candidate = Array.from({ length: 7 }, (_, i) =>
      pick("root", `word-${i + 1}`, i + 1)
    );

    const result = scoreMatrixMatch(job, candidate);
    expect(result.matrixScore).toBe(100);
    expect(result.columnScores).toHaveLength(7);
    expect(result.columnScores.every((c) => c.columnScore === 100)).toBe(true);
    expect(result.matchedCount).toBe(7);
    expect(result.totalCount).toBe(7);
  });

  it("returns 0 when all comparable columns disagree", () => {
    const job = [pick("q1", "a", 1), pick("q2", "b", 2), pick("q3", "c", 3)];
    const candidate = [
      pick("q1", "x", 1),
      pick("q2", "y", 2),
      pick("q3", "z", 3),
    ];

    const result = scoreMatrixMatch(job, candidate);
    expect(result.matrixScore).toBe(0);
    expect(result.matchedCount).toBe(0);
    expect(result.totalCount).toBe(3);
    expect(result.columnScores).toHaveLength(3);
  });

  it("renormalizes weights over comparable columns only", () => {
    // Only columns 1 and 7 overlap; missing 2–6 must not dilute the average to ~28
    const job = [pick("q1", "a", 1), pick("q7", "g", 7)];
    const candidate = [pick("q1", "a", 1), pick("q7", "x", 7)];

    const result = scoreMatrixMatch(job, candidate);
    expect(result.matrixScore).toBe(50);
    expect(result.columnScores.map((c) => c.column)).toEqual([1, 7]);
  });

  it("skips columns answered on only one side", () => {
    const job = [pick("q1", "a", 1), pick("q2", "b", 2)];
    const candidate = [pick("q1", "a", 1)];

    const result = scoreMatrixMatch(job, candidate);
    expect(result.matrixScore).toBe(100);
    expect(result.columnScores).toHaveLength(1);
    expect(result.columnScores[0]?.column).toBe(1);
  });

  it("ignores legacy matrix_column 0 when column answers exist", () => {
    const job = [
      pick("legacy", "old", 0),
      pick("q1", "a", 1),
    ];
    const candidate = [
      pick("legacy", "old", 0),
      pick("q1", "a", 1),
    ];

    const result = scoreMatrixMatch(job, candidate);
    expect(result.columnScores).toHaveLength(1);
    expect(result.columnScores[0]?.column).toBe(1);
    expect(result.matrixScore).toBe(100);
  });

  it("ignores out-of-range columns", () => {
    const job = [pick("q1", "a", 1), pick("bad", "x", 99)];
    const candidate = [pick("q1", "a", 1), pick("bad", "x", 99)];

    const result = scoreMatrixMatch(job, candidate);
    expect(result.columnScores).toHaveLength(1);
    expect(result.matrixScore).toBe(100);
  });

  it("scores multi-level paths within a single column", () => {
    const job = [
      pick("lvl2", "initiator", 1),
      pick("sub1", "branch-a", 1),
      pick("sub2", "leaf-a", 1),
    ];
    const candidate = [
      pick("lvl2", "initiator", 1),
      pick("sub1", "branch-a", 1),
      pick("sub2", "leaf-b", 1),
    ];

    const result = scoreMatrixMatch(job, candidate);
    expect(result.matrixScore).toBe(67); // 2/3 within one column
    expect(result.columnScores).toHaveLength(1);
    expect(result.columnScores[0]).toMatchObject({
      column: 1,
      matchedCount: 2,
      totalCount: 3,
      columnScore: 67,
    });
  });

  it("is deterministic for the same inputs", () => {
    const job = [
      pick("q1", "a", 1),
      pick("q2", "b", 2),
      pick("q3", "c", 3),
    ];
    const candidate = [
      pick("q1", "a", 1),
      pick("q2", "x", 2),
      pick("q3", "c", 3),
    ];

    expect(scoreMatrixMatch(job, candidate)).toEqual(
      scoreMatrixMatch(job, candidate)
    );
    expect(scoreMatrixMatch(job, candidate).matrixScore).toBe(67);
  });

  it("returns zero when columns exist but none overlap", () => {
    const job = [pick("q1", "a", 1)];
    const candidate = [pick("q2", "b", 2)];

    expect(scoreMatrixMatch(job, candidate)).toEqual({
      matrixScore: 0,
      matchedCount: 0,
      totalCount: 0,
      columnScores: [],
    });
  });

  it("treats null matrix_column like legacy when no real columns exist", () => {
    const job = [pick("q1", "a", null), pick("q2", "b", null)];
    const candidate = [pick("q1", "a", null), pick("q2", "x", null)];

    expect(scoreMatrixMatch(job, candidate)).toEqual({
      matrixScore: 50,
      matchedCount: 1,
      totalCount: 2,
      columnScores: [],
    });
  });
});
