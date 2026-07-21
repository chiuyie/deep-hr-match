import { describe, expect, it } from "vitest";
import {
  filterMatrixOptionsByQuery,
  matrixOptionPublicLabel,
} from "@/lib/matching/matrix-option-display";
import type { MatrixOption } from "@/types/database";

function opt(partial: Partial<MatrixOption> & Pick<MatrixOption, "id">): MatrixOption {
  return {
    question_id: "q1",
    option_text: "Level2Word1",
    option_value: "level2word1",
    sort_order: 1,
    is_active: true,
    description: null,
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

describe("matrix option display", () => {
  it("shows description to end users, not internal label", () => {
    expect(
      matrixOptionPublicLabel(
        opt({ id: "1", option_text: "factor1", description: "How you collaborate" })
      )
    ).toBe("How you collaborate");
  });

  it("filters by internal label while hiding it in display", () => {
    const options = [
      opt({ id: "a", option_text: "factor2", description: "Team player" }),
      opt({ id: "b", option_text: "factor3", description: "Independent" }),
    ];
    const matches = filterMatrixOptionsByQuery(options, "factor2");
    expect(matches).toHaveLength(1);
    expect(matrixOptionPublicLabel(matches[0]!)).toBe("Team player");
  });
});
