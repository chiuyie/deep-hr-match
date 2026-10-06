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

  it("renders meaningful insight and grouped comparison sections", () => {
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
    expect(screen.getByText("Strong fit")).toBeInTheDocument();
    expect(screen.getByText("What this means")).toBeInTheDocument();
    expect(screen.getByText(/Aligned on 1 of 2 factors/i)).toBeInTheDocument();
    expect(screen.getAllByText("Where you align").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Where you differ").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Character - Roles").length).toBeGreaterThan(0);
    expect(screen.getByText("Match")).toBeInTheDocument();
    expect(screen.getByText("Different")).toBeInTheDocument();
    expect(screen.getByText(/factors aligned/i)).toBeInTheDocument();
  });

  it("renders stored match narrative when disclosure allows and no comparison", () => {
    render(
      <UnlockedMatchReportSections
        overallScore={null}
        showMatchScore={false}
        showMatchNarrative
        matchSummary="Strong overall alignment on leadership."
        strengths={["Clear communicator"]}
        gaps={["Limited industry tenure"]}
        showMatrixAnswers={false}
        showMatrixComparison={false}
        candidateSteps={[]}
        comparisonRows={[]}
      />
    );

    expect(screen.getByText("Match summary")).toBeInTheDocument();
    expect(screen.getByText("Strong overall alignment on leadership.")).toBeInTheDocument();
    expect(screen.getByText("Clear communicator")).toBeInTheDocument();
    expect(screen.getByText("Limited industry tenure")).toBeInTheDocument();
  });

  it("hides stored narrative when disclosure disables it", () => {
    render(
      <UnlockedMatchReportSections
        overallScore={88}
        showMatchScore
        showMatchNarrative={false}
        matchSummary="Should stay hidden"
        strengths={["Hidden strength"]}
        gaps={["Hidden gap"]}
        showMatrixAnswers={false}
        showMatrixComparison={false}
        candidateSteps={[]}
        comparisonRows={[]}
      />
    );

    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.queryByText("Should stay hidden")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden strength")).not.toBeInTheDocument();
  });

  it("prefers live comparison insight over technical stored summary", () => {
    render(
      <UnlockedMatchReportSections
        overallScore={50}
        showMatchScore
        showMatchNarrative
        matchSummary="7^7 match (equal column weights): should not show"
        strengths={["Legacy strength"]}
        gaps={["Legacy gap"]}
        showMatrixAnswers={false}
        showMatrixComparison
        candidateSteps={[]}
        comparisonRows={comparisonRows}
      />
    );

    expect(screen.getByText("What this means")).toBeInTheDocument();
    expect(screen.queryByText(/equal column weights/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Legacy strength")).not.toBeInTheDocument();
    expect(screen.getByText("Mixed fit")).toBeInTheDocument();
  });
});
