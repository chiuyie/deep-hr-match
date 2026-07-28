/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UnlockedMatchReportSections } from "@/components/employer/unlocked-match-report";

afterEach(() => {
  cleanup();
});

const comparisonRows = [
  {
    column: 1,
    factorLabel: "Character - Roles",
    jobWord: "Leader",
    candidateWord: "Leader",
    jobWords: ["Leader"],
    candidateWords: ["Leader"],
    aligned: true,
  },
  {
    column: 2,
    factorLabel: "Experience",
    jobWord: "Senior",
    candidateWord: "Junior",
    jobWords: ["Senior"],
    candidateWords: ["Junior"],
    aligned: false,
  },
];

describe("UnlockedMatchReportSections", () => {
  it("returns null when every disclosure section is hidden", () => {
    const { container } = render(
      <UnlockedMatchReportSections
        overallScore={88}
        rankingPosition={1}
        showMatchScore={false}
        showMatchRank={false}
        showMatrixAnswers={false}
        showMatrixComparison={false}
        candidateSteps={[]}
        comparisonRows={[]}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders score and comparison rows when disclosure allows it", () => {
    render(
      <UnlockedMatchReportSections
        overallScore={88}
        rankingPosition={2}
        showMatchScore
        showMatchRank
        showMatrixAnswers={false}
        showMatrixComparison
        candidateSteps={[]}
        comparisonRows={comparisonRows}
      />
    );

    expect(screen.getByText("7^7 match")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("Character - Roles")).toBeInTheDocument();
    expect(screen.getByText("Match")).toBeInTheDocument();
    expect(screen.getByText("Different")).toBeInTheDocument();
    expect(screen.getByText(/factors aligned/i)).toBeInTheDocument();
  });
});
