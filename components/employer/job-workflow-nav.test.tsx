/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";

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

describe("JobWorkflowNav", () => {
  it("marks the current workflow step", () => {
    render(<JobWorkflowNav jobId="job-1" currentStep="matching" />);

    const current = screen.getByRole("link", { name: /Matching/i });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveAttribute("href", "/employer/jobs/job-1/matching");
  });

  it("hides the edit step when the job is read-only", () => {
    render(<JobWorkflowNav jobId="job-1" currentStep="view" canEdit={false} />);

    expect(screen.queryByRole("link", { name: /Edit Job/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Job/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /JD Upload/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Unlocked/i })).toBeInTheDocument();
  });

  it("shows the edit step for draft jobs", () => {
    render(<JobWorkflowNav jobId="job-1" currentStep="edit" canEdit />);

    expect(screen.getByRole("link", { name: /Edit Job/i })).toHaveAttribute(
      "href",
      "/employer/jobs/job-1"
    );
  });
});
