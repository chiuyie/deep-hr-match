/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidateDashboardView } from "@/components/candidate/candidate-dashboard-view";
import { makeDashboardSteps } from "@/lib/candidate/__fixtures__/candidate-flow";

afterEach(() => {
  cleanup();
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

describe("CandidateDashboardView", () => {
  it("prompts onboarding when not ready", () => {
    render(
      <CandidateDashboardView
        userName="Alex Chen"
        completionPercentage={45}
        status="draft"
        statusLabel="Draft"
        lastUpdated="Jan 1, 2026"
        isReady={false}
        steps={makeDashboardSteps()}
      />
    );

    expect(screen.getByText(/get your profile match-ready/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue: Complete profile/i })).toHaveAttribute(
      "href",
      "/candidate/profile"
    );
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("shows ready state when matching is enabled", () => {
    render(
      <CandidateDashboardView
        userName="Alex Chen"
        completionPercentage={100}
        status="ready_for_matching"
        statusLabel="Ready for matching"
        lastUpdated="Jan 2, 2026"
        isReady
        steps={makeDashboardSteps({
          profile: true,
          cv: true,
          matrix: true,
          status: true,
        })}
      />
    );

    expect(screen.getByText(/ready to be discovered/i)).toBeInTheDocument();
    expect(screen.getByText("Profile live for matching")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View status" })).toHaveAttribute(
      "href",
      "/candidate/status"
    );
  });

  it("renders onboarding journey and quick actions", () => {
    render(
      <CandidateDashboardView
        completionPercentage={75}
        status="incomplete"
        statusLabel="Incomplete"
        lastUpdated="Jan 1, 2026"
        isReady={false}
        steps={makeDashboardSteps({ profile: true, cv: true })}
      />
    );

    expect(screen.getByText("Your onboarding journey")).toBeInTheDocument();
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Edit profile/i })).toHaveAttribute(
      "href",
      "/candidate/profile"
    );
    expect(screen.getByRole("link", { name: /Manage CV/i })).toHaveAttribute(
      "href",
      "/candidate/cv"
    );
  });
});
