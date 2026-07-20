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
  it("includes child question only when parent option is selected", () => {
    const questions = [
      q({ id: "root", sort_order: 1, parent_option_id: null }),
      q({ id: "child", sort_order: 2, parent_option_id: "opt-a" }),
    ];
    expect(getApplicableMatrixQuestions(questions, {}).map((x) => x.id)).toEqual(["root"]);
    expect(
      getApplicableMatrixQuestions(questions, { root: { option_id: "opt-a" } }).map((x) => x.id)
    ).toEqual(["root", "child"]);
  });
});
