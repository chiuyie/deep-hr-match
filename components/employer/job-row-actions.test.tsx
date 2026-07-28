/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobRowActions } from "@/components/employer/job-row-actions";

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

describe("JobRowActions", () => {
  it("shows edit for draft jobs and hides it for posted jobs", () => {
    const { rerender } = render(
      <JobRowActions
        jobId="job-1"
        lifecycle={{ status: "draft", hasMatches: false }}
      />
    );

    expect(screen.getByRole("link", { name: /Edit/i })).toHaveAttribute(
      "href",
      "/employer/jobs/job-1"
    );

    rerender(
      <JobRowActions
        jobId="job-1"
        lifecycle={{ status: "active", hasMatches: true }}
      />
    );

    expect(screen.queryByRole("link", { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Matching/i })).toHaveAttribute(
      "href",
      "/employer/jobs/job-1/matching"
    );
  });

  it("shows generate matching for active jobs without results", () => {
    render(
      <JobRowActions
        jobId="job-1"
        lifecycle={{ status: "active", hasMatches: false }}
      />
    );

    expect(screen.getByRole("link", { name: /Generate Matching/i })).toBeInTheDocument();
  });

  it("hides matching for drafts", () => {
    render(
      <JobRowActions
        jobId="job-1"
        lifecycle={{ status: "draft", hasMatches: false }}
      />
    );

    expect(screen.queryByRole("link", { name: /Matching/i })).not.toBeInTheDocument();
  });
});
