/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchingResultsTable } from "@/components/matching/matching-results-table";
import { makeAnonymousCandidateMatch } from "@/lib/employer/__fixtures__/employer-flow";

const createUnlockCheckout = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/employer/actions", () => ({
  createUnlockCheckout: (...args: unknown[]) => createUnlockCheckout(...args),
}));

const results = [
  makeAnonymousCandidateMatch({
    id: "cand-1",
    anonymous_id: "CAND-00000001",
    ranking_position: 1,
    overall_score: 92,
    is_unlocked: false,
  }),
  makeAnonymousCandidateMatch({
    id: "cand-2",
    anonymous_id: "CAND-00000002",
    display_name: "Jordan Unlocked",
    ranking_position: 2,
    overall_score: 85,
    is_unlocked: true,
  }),
];

describe("MatchingResultsTable", () => {
  it("renders ranked anonymous candidates", () => {
    render(
      <MatchingResultsTable
        jobId="job-1"
        results={results}
        showMatchScore
        showMatchRank
        mockPayments
      />
    );

    expect(screen.getAllByText("CAND-00000001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("92%").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Unlock 1/i })).not.toBeInTheDocument();
  });

  it("does not show unlock checkout button until a candidate is selected", () => {
    render(
      <MatchingResultsTable
        jobId="job-1"
        results={results}
        showMatchScore
        mockPayments
      />
    );

    expect(
      screen.queryByRole("button", { name: /Unlock \d+ candidate/i })
    ).not.toBeInTheDocument();
  });

  it("submits selected candidates to checkout", async () => {
    const user = userEvent.setup();
    createUnlockCheckout.mockResolvedValue({ error: null });

    render(
      <MatchingResultsTable
        jobId="job-1"
        results={results}
        showMatchScore
        mockPayments
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(
      screen.getByRole("button", { name: /Unlock 1 candidate \(mock\)/i })
    );

    expect(createUnlockCheckout).toHaveBeenCalledWith("job-1", ["cand-1"]);
  });

  it("surfaces checkout errors from unlock action", async () => {
    const user = userEvent.setup();
    createUnlockCheckout.mockResolvedValue({
      error: "Select candidates from this job’s current match results.",
    });

    render(
      <MatchingResultsTable
        jobId="job-1"
        results={results}
        showMatchScore
        mockPayments
      />
    );

    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(
      screen.getByRole("button", { name: /Unlock 1 candidate \(mock\)/i })
    );

    expect(screen.getByText("Unlock failed")).toBeInTheDocument();
    expect(
      screen.getByText(/Select candidates from this job/i)
    ).toBeInTheDocument();
  });

  it("shows unlocked badge for purchased candidates", () => {
    render(
      <MatchingResultsTable
        jobId="job-1"
        results={results}
        showMatchScore
        mockPayments
      />
    );

    expect(screen.getAllByText("Unlocked").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0);
  });

  it("shows real name for unlocked candidates instead of anonymous id", () => {
    render(
      <MatchingResultsTable
        jobId="job-1"
        results={results}
        showMatchScore
        mockPayments
      />
    );

    expect(screen.getAllByText("Jordan Unlocked").length).toBeGreaterThan(0);
    // Anonymous id remains as a secondary correlation hint under the real name.
    expect(screen.getAllByText("CAND-00000002").length).toBeGreaterThan(0);
  });
});
