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

/**
 * Admin spreadsheet layout:
 * Level 1 = factor labels (Character - Roles … Values)
 * Levels 2–7 = one word per column (Col1 Initiator…Negotiator, Col2 Physical…, …)
 */
function buildAdminSpreadsheetCategory(): MatrixCategoryTree {
  const factorLabels = [
    "Character - Roles",
    "Experience",
    "Knowledge - Domain",
    "Motivations",
    "Skills - Function",
    "Talent",
    "Values",
  ];

  const lvl1 = question({
    id: "lvl1",
    sort_order: 1,
    matrix_options: factorLabels.map((text, index) =>
      option({
        id: `factor-${index + 1}`,
        question_id: "lvl1",
        sort_order: index + 1,
        option_text: text,
      })
    ),
  });

  // rows: Level 2–7; each row has Col1–Col7 cells
  const grid: string[][] = [
    ["Initiator", "Physical", "Comm", "L2W4", "Selling", "Creative", "Enjoyment"],
    ["Leader", "L3C2", "L3C3", "L3C4", "L3C5", "L3C6", "L3C7"],
    ["Planner", "L4C2", "L4C3", "L4C4", "L4C5", "L4C6", "L4C7"],
    ["Teacher", "L5C2", "L5C3", "L5C4", "L5C5", "L5C6", "L5C7"],
    ["Risk Taker", "L6C2", "L6C3", "L6C4", "L6C5", "L6C6", "L6C7"],
    ["Negotiator", "Cultural", "L7C3", "L7C4", "L7C5", "L7C6", "L7C7"],
  ];

  const wordRoots = grid.map((row, rowIndex) => {
    const level = rowIndex + 2;
    const qid = `lvl${level}`;
    return question({
      id: qid,
      sort_order: level,
      matrix_options: row.map((text, colIndex) =>
        option({
          id: `${qid}-c${colIndex + 1}`,
          question_id: qid,
          sort_order: colIndex + 1,
          option_text: text,
        })
      ),
    });
  });

  const initiatorSub = question({
    id: "sub-initiator",
    sort_order: 100,
    parent_option_id: "lvl2-c1",
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

  const physicalSub = question({
    id: "sub-physical",
    sort_order: 101,
    parent_option_id: "lvl2-c2",
    matrix_options: [
      option({
        id: "motor",
        question_id: "sub-physical",
        sort_order: 1,
        option_text: "MotorSkills",
      }),
      option({
        id: "health",
        question_id: "sub-physical",
        sort_order: 2,
        option_text: "Health",
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
    matrix_questions: [lvl1, ...wordRoots, initiatorSub, physicalSub],
  } as MatrixCategoryTree;
}

function finishColumnWithoutSublevel(
  answers: ColumnAnswersMap,
  levelQuestionId: string,
  optionId: string,
  column: number
): ColumnAnswersMap {
  return {
    ...answers,
    [columnAnswerKey(levelQuestionId, column)]: {
      option_id: optionId,
      matrix_column: column,
    },
  };
}

describe("column walk Col1 → Col7 (admin spreadsheet)", () => {
  it("Factor 1 = Character - Roles → Col1 words Initiator…Negotiator", () => {
    const state = getMatrixColumnFlowState(buildAdminSpreadsheetCategory(), {});
    expect(state.current?.column).toBe(1);
    expect(state.current?.factorLabel).toBe("Character - Roles");
    expect(state.current?.options.map((o) => o.option_text)).toEqual([
      "Initiator",
      "Leader",
      "Planner",
      "Teacher",
      "Risk Taker",
      "Negotiator",
    ]);
  });

  it("after Col1 + Initiator sub-level, Factor 2 = Experience → Col2 words", () => {
    const answers: ColumnAnswersMap = {
      [columnAnswerKey("lvl2", 1)]: { option_id: "lvl2-c1", matrix_column: 1 },
      [columnAnswerKey("sub-initiator", 1)]: { option_id: "sub1", matrix_column: 1 },
    };
    const state = getMatrixColumnFlowState(buildAdminSpreadsheetCategory(), answers);
    expect(state.current?.column).toBe(2);
    expect(state.current?.factorLabel).toBe("Experience");
    expect(state.current?.options.map((o) => o.option_text)).toEqual([
      "Physical",
      "L3C2",
      "L4C2",
      "L5C2",
      "L6C2",
      "Cultural",
    ]);
  });

  it("Physical under Experience drills Physical’s sub-level before Col3", () => {
    const answers: ColumnAnswersMap = {
      [columnAnswerKey("lvl2", 1)]: { option_id: "lvl2-c1", matrix_column: 1 },
      [columnAnswerKey("sub-initiator", 1)]: { option_id: "sub1", matrix_column: 1 },
      [columnAnswerKey("lvl2", 2)]: { option_id: "lvl2-c2", matrix_column: 2 },
    };
    const state = getMatrixColumnFlowState(buildAdminSpreadsheetCategory(), answers);
    expect(state.current?.column).toBe(2);
    expect(state.current?.factorLabel).toBe("Experience");
    expect(state.current?.options.map((o) => o.option_text)).toEqual([
      "MotorSkills",
      "Health",
    ]);
  });

  it("walks Col3–Col7 only after prior columns are finished", () => {
    let answers: ColumnAnswersMap = {
      [columnAnswerKey("lvl2", 1)]: { option_id: "lvl2-c1", matrix_column: 1 },
      [columnAnswerKey("sub-initiator", 1)]: { option_id: "sub1", matrix_column: 1 },
      [columnAnswerKey("lvl2", 2)]: { option_id: "lvl2-c2", matrix_column: 2 },
      [columnAnswerKey("sub-physical", 2)]: { option_id: "motor", matrix_column: 2 },
    };

    const expected = [
      { column: 3, factor: "Knowledge - Domain", first: "Comm" },
      { column: 4, factor: "Motivations", first: "L2W4" },
      { column: 5, factor: "Skills - Function", first: "Selling" },
      { column: 6, factor: "Talent", first: "Creative" },
      { column: 7, factor: "Values", first: "Enjoyment" },
    ] as const;

    for (const step of expected) {
      const state = getMatrixColumnFlowState(buildAdminSpreadsheetCategory(), answers);
      expect(state.current?.column).toBe(step.column);
      expect(state.current?.factorLabel).toBe(step.factor);
      expect(state.current?.options[0]?.option_text).toBe(step.first);
      // Finish this column with the Level-2 cell (no sub-level on these in the fixture)
      answers = finishColumnWithoutSublevel(
        answers,
        "lvl2",
        `lvl2-c${step.column}`,
        step.column
      );
    }

    const done = getMatrixColumnFlowState(buildAdminSpreadsheetCategory(), answers);
    expect(done.formComplete).toBe(true);
    expect(done.current).toBeNull();
  });
});
