import { describe, expect, it } from "vitest";
import {
  columnAnswerKey,
  getMatrixColumnFlowState,
  type ColumnAnswersMap,
  type MatrixCategoryTree,
} from "@/lib/matching/matrix-column-flow";
import type { MatrixOption, MatrixQuestion } from "@/types/database";

function option(
  partial: Partial<MatrixOption> & {
    id: string;
    sort_order: number;
    option_text: string;
    question_id: string;
  }
): MatrixOption {
  return {
    option_value: partial.option_text,
    is_active: true,
    description: null,
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

function question(
  partial: Partial<MatrixQuestion> & {
    id: string;
    sort_order: number;
    matrix_options?: MatrixOption[];
  }
): MatrixQuestion & { matrix_options: MatrixOption[] } {
  return {
    category_id: "cat",
    question_text: "Q",
    question_type: "single_select",
    target_role: "both",
    is_required: true,
    is_active: true,
    parent_option_id: null,
    created_at: "",
    updated_at: "",
    matrix_options: [],
    ...partial,
  };
}

/** Mirrors live admin layout: Col1 Level2–7 = Initiator, Leader, … Negotiator */
function buildLiveLikeCategory(): MatrixCategoryTree {
  const lvl1 = question({
    id: "lvl1",
    sort_order: 1,
    matrix_options: [
      option({
        id: "character",
        question_id: "lvl1",
        sort_order: 1,
        option_text: "Character - Roles",
      }),
      option({
        id: "experience",
        question_id: "lvl1",
        sort_order: 2,
        option_text: "Experience",
      }),
    ],
  });

  const col1Words = [
    ["lvl2", "initiator", "Initiator"],
    ["lvl3", "leader", "Leader"],
    ["lvl4", "planner", "Planner"],
    ["lvl5", "teacher", "Teacher"],
    ["lvl6", "risk", "Risk Taker"],
    ["lvl7", "negotiator", "Negotiator"],
  ] as const;

  const wordRoots = col1Words.map(([qid, oid, text], index) =>
    question({
      id: qid,
      sort_order: index + 2,
      matrix_options: [
        option({
          id: oid,
          question_id: qid,
          sort_order: 1,
          option_text: text,
        }),
        // Other columns — must never appear under Character - Roles
        option({
          id: `${qid}-col2`,
          question_id: qid,
          sort_order: 2,
          option_text: `OtherCol2-${text}`,
        }),
      ],
    })
  );

  const initiatorSub = question({
    id: "sub-initiator",
    sort_order: 100,
    parent_option_id: "initiator",
    matrix_options: [
      option({
        id: "sub1",
        question_id: "sub-initiator",
        sort_order: 1,
        option_text: "Level2SubLevel1Word1",
      }),
      option({
        id: "sub2",
        question_id: "sub-initiator",
        sort_order: 2,
        option_text: "Level2SubLevel1Word2",
      }),
    ],
  });

  return {
    id: "cat",
    name: "Matching Language",
    description: null,
    sort_order: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
    matrix_questions: [lvl1, ...wordRoots, initiatorSub],
  } as MatrixCategoryTree;
}

describe("getMatrixColumnFlowState — live Character-Roles layout", () => {
  it("Factor 1 shows Col1 words across Level 2–7: Initiator…Negotiator", () => {
    const state = getMatrixColumnFlowState(buildLiveLikeCategory(), {});
    expect(state.current?.factorLabel).toBe("Character - Roles");
    expect(state.current?.isFactorWordPick).toBe(true);
    expect(state.current?.options.map((o) => o.option_text)).toEqual([
      "Initiator",
      "Leader",
      "Planner",
      "Teacher",
      "Risk Taker",
      "Negotiator",
    ]);
  });

  it("does not include other columns’ Level 2 words (Physical, Selling, …)", () => {
    const state = getMatrixColumnFlowState(buildLiveLikeCategory(), {});
    const labels = state.current?.options.map((o) => o.option_text) ?? [];
    expect(labels.some((l) => l.startsWith("OtherCol2-"))).toBe(false);
  });

  it("after picking Initiator, shows Initiator’s sub-level", () => {
    const answers: ColumnAnswersMap = {
      [columnAnswerKey("lvl2", 1)]: { option_id: "initiator", matrix_column: 1 },
    };
    const state = getMatrixColumnFlowState(buildLiveLikeCategory(), answers);
    expect(state.current?.isFactorWordPick).toBe(false);
    expect(state.current?.options.map((o) => o.option_text)).toEqual([
      "Level2SubLevel1Word1",
      "Level2SubLevel1Word2",
    ]);
  });

  it("after finishing Character-Roles, moves to Experience (Col2)", () => {
    const answers: ColumnAnswersMap = {
      [columnAnswerKey("lvl2", 1)]: { option_id: "initiator", matrix_column: 1 },
      [columnAnswerKey("sub-initiator", 1)]: { option_id: "sub1", matrix_column: 1 },
    };
    const state = getMatrixColumnFlowState(buildLiveLikeCategory(), answers);
    expect(state.current?.column).toBe(2);
    expect(state.current?.factorLabel).toBe("Experience");
    expect(state.current?.options.map((o) => o.option_text)).toEqual([
      "OtherCol2-Initiator",
      "OtherCol2-Leader",
      "OtherCol2-Planner",
      "OtherCol2-Teacher",
      "OtherCol2-Risk Taker",
      "OtherCol2-Negotiator",
    ]);
  });
});
