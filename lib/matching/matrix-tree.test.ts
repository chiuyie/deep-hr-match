import { describe, expect, it } from "vitest";
import { getApplicableMatrixQuestions } from "@/lib/matching/matrix-tree";
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
