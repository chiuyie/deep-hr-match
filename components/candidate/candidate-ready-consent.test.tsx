/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidateReadyConsent } from "@/components/candidate/candidate-ready-consent";

const markCandidateReady = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock("@/lib/candidate/actions", () => ({
  markCandidateReady: (...args: unknown[]) => markCandidateReady(...args),
}));

describe("CandidateReadyConsent", () => {
  it("disables consent when checklist is incomplete", () => {
    render(<CandidateReadyConsent enabled={false} />);

    expect(screen.getByRole("button", { name: "Mark ready for matching" })).toBeDisabled();
    expect(
      screen.getByText(/Finish every checklist item above/i)
    ).toBeInTheDocument();
  });

  it("requires agreement before submitting", async () => {
    const user = userEvent.setup();
    render(<CandidateReadyConsent enabled />);

    const submit = screen.getByRole("button", {
      name: "Agree and mark ready for matching",
    });
    expect(submit).toBeDisabled();

    await user.click(
      screen.getByRole("checkbox", { name: /I understand and agree/i })
    );
    expect(submit).toBeEnabled();
  });

  it("shows consent points when enabled", () => {
    render(<CandidateReadyConsent enabled />);

    expect(screen.getByText("Before you go live")).toBeInTheDocument();
    expect(screen.getByText(/true and accurate/i)).toBeInTheDocument();
    expect(screen.getByText(/unlock my profile/i)).toBeInTheDocument();
  });
});
