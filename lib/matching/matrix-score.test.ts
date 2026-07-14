import { describe, expect, it } from "vitest";
import { scoreMatrixMatch } from "./matrix-score";

describe("scoreMatrixMatch", () => {
  it("returns perfect score when all picks match", () => {
    const job = [
      { question_id: "q1", option_id: "a" },
      { question_id: "q2", option_id: "b" },
    ];
    const candidate = [
      { question_id: "q1", option_id: "a" },
      { question_id: "q2", option_id: "b" },
    ];
    expect(scoreMatrixMatch(job, candidate)).toEqual({
      matrixScore: 100,
      matchedCount: 2,
      totalCount: 2,
    });
  });

  it("returns partial score for mixed matches", () => {
    const job = [
      { question_id: "q1", option_id: "a" },
      { question_id: "q2", option_id: "b" },
      { question_id: "q3", option_id: "c" },
    ];
    const candidate = [
      { question_id: "q1", option_id: "a" },
      { question_id: "q2", option_id: "x" },
      { question_id: "q3", option_id: "c" },
    ];
    expect(scoreMatrixMatch(job, candidate)).toEqual({
      matrixScore: 67,
      matchedCount: 2,
      totalCount: 3,
    });
  });

  it("ignores questions only answered on one side", () => {
    const job = [{ question_id: "q1", option_id: "a" }];
    const candidate = [
      { question_id: "q1", option_id: "a" },
      { question_id: "q2", option_id: "b" },
    ];
    expect(scoreMatrixMatch(job, candidate)).toEqual({
      matrixScore: 100,
      matchedCount: 1,
      totalCount: 1,
    });
  });

  it("returns zero when nothing is comparable", () => {
    expect(scoreMatrixMatch([], [])).toEqual({
      matrixScore: 0,
      matchedCount: 0,
      totalCount: 0,
    });
  });
});
