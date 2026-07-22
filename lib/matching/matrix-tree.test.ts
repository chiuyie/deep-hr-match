import { describe, expect, it } from "vitest";
import {
  getApplicableMatrixQuestions,
  getCurrentMatrixQuestion,
  getFactorIdentityRootQuestion,
  getMatrixChoiceQuestions,
} from "@/lib/matching/matrix-tree";
import type { MatrixQuestion } from "@/types/database";

function q(
  partial: Partial<MatrixQuestion> & { id: string; sort_order: number }
): MatrixQuestion {
  return {
    category_id: "c1",
    question_text: "Q",
    question_type: "single_select",
    target_role: "both",
    is_required: true,
    is_active: true,
    parent_option_id: null,
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

describe("getApplicableMatrixQuestions", () => {
  it("shows only the current step (child after parent answered)", () => {
    const questions = [
      q({ id: "root", sort_order: 1, parent_option_id: null }),
      q({ id: "child", sort_order: 2, parent_option_id: "opt-a" }),
    ];
    expect(getApplicableMatrixQuestions(questions, {}).map((x) => x.id)).toEqual(["root"]);
    expect(
      getApplicableMatrixQuestions(questions, { root: { option_id: "opt-a" } }).map((x) => x.id)
    ).toEqual(["child"]);
  });

  it("does not show later root levels until earlier ones are answered", () => {
    const questions = [
      q({ id: "level1", sort_order: 1, parent_option_id: null }),
      q({ id: "level2", sort_order: 2, parent_option_id: null }),
    ];
    expect(getApplicableMatrixQuestions(questions, {}).map((x) => x.id)).toEqual(["level1"]);
    expect(
      getApplicableMatrixQuestions(questions, { level1: { option_id: "opt-1" } }).map((x) => x.id)
    ).toEqual(["level2"]);
  });
});

describe("factor identity vs word choices", () => {
  const questions = [
    q({
      id: "level1-identity",
      sort_order: 1,
      parent_option_id: null,
      question_text: "Factor identity",
    }),
    q({ id: "level2", sort_order: 2, parent_option_id: null, question_text: "Choose a word" }),
    q({
      id: "level2-child",
      sort_order: 3,
      parent_option_id: "word-a",
      question_text: "Sub-level",
    }),
  ];

  it("treats the first root question as factor identity", () => {
    expect(getFactorIdentityRootQuestion(questions)?.id).toBe("level1-identity");
  });

  it("starts word choices at Level 2 (skips Level 1 identity)", () => {
    const choiceQuestions = getMatrixChoiceQuestions(questions);
    expect(choiceQuestions.map((x) => x.id)).toEqual(["level2", "level2-child"]);
    expect(getCurrentMatrixQuestion(choiceQuestions, {})?.id).toBe("level2");
    expect(
      getCurrentMatrixQuestion(choiceQuestions, { level2: { option_id: "word-a" } })?.id
    ).toBe("level2-child");
  });
});
