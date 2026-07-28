import { describe, expect, it } from "vitest";
import {
  buildColumnAnswerSteps,
  buildMatrixComparisonRows,
  type MatrixAnswerStep,
} from "@/lib/matching/candidate-matrix-summary";
import {
  columnAnswerKey,
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

function buildCategory(): MatrixCategoryTree {
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

  return {
    id: "cat",
    name: "7^7",
    description: null,
    sort_order: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
    matrix_questions: [lvl1, ...wordRoots],
  };
}

describe("buildColumnAnswerSteps", () => {
  it("returns one step per answered factor with real factor names", () => {
    const answers: ColumnAnswersMap = {
      [columnAnswerKey("lvl2", 1)]: { option_id: "lvl2-c1", matrix_column: 1 },
      [columnAnswerKey("lvl2", 2)]: { option_id: "lvl2-c2", matrix_column: 2 },
    };

    const steps = buildColumnAnswerSteps(buildCategory(), answers);
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({
      column: 1,
      factorLabel: "Character - Roles",
      wordLabel: "Initiator",
    });
    expect(steps[1]).toMatchObject({
      column: 2,
      factorLabel: "Experience",
      wordLabel: "Physical",
    });
  });
});

describe("buildMatrixComparisonRows", () => {
  it("compares by factor column and marks alignment on primary word", () => {
    const jobSteps: MatrixAnswerStep[] = [
      {
        column: 1,
        questionId: "col-1",
        factorLabel: "Character - Roles",
        wordLabel: "Initiator",
        wordPath: ["Initiator"],
      },
      {
        column: 2,
        questionId: "col-2",
        factorLabel: "Experience",
        wordLabel: "Physical",
        wordPath: ["Physical"],
      },
    ];
    const candidateSteps: MatrixAnswerStep[] = [
      {
        column: 1,
        questionId: "col-1",
        factorLabel: "Character - Roles",
        wordLabel: "Initiator",
        wordPath: ["Initiator"],
      },
      {
        column: 2,
        questionId: "col-2",
        factorLabel: "Experience",
        wordLabel: "Cultural",
        wordPath: ["Cultural"],
      },
    ];

    const rows = buildMatrixComparisonRows(jobSteps, candidateSteps);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.aligned).toBe(true);
    expect(rows[1]?.aligned).toBe(false);
    expect(rows[0]?.factorLabel).toBe("Character - Roles");
    expect(rows[1]?.candidateWord).toBe("Cultural");
  });
});
