/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmployerJobsList } from "@/components/employer/employer-jobs-list";
import {
  makeEmployerJobListItem,
} from "@/lib/employer/__fixtures__/employer-flow";

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

const jobs = [
  makeEmployerJobListItem({
    id: "job-active",
    title: "Product Designer",
    status: "active",
    location: "Singapore",
    matchCount: 4,
    unlockCount: 1,
  }),
  makeEmployerJobListItem({
    id: "job-draft",
    title: "Backend Engineer",
    status: "draft",
    location: "Remote",
    matchCount: 0,
    unlockCount: 0,
  }),
  makeEmployerJobListItem({
    id: "job-closed",
    title: "Closed Role",
    status: "closed",
    matchCount: 2,
    unlockCount: 0,
  }),
];

describe("EmployerJobsList", () => {
  it("defaults to the active tab and shows active jobs only", () => {
    render(<EmployerJobsList jobs={jobs} />);

    expect(screen.getAllByText("Product Designer").length).toBeGreaterThan(0);
    expect(screen.queryByText("Backend Engineer")).not.toBeInTheDocument();
    expect(screen.queryByText("Closed Role")).not.toBeInTheDocument();
  });

  it("filters jobs by search query", async () => {
    const user = userEvent.setup();
    render(<EmployerJobsList jobs={jobs} />);

    await user.click(screen.getByRole("tab", { name: /All/i }));
    await user.type(screen.getByRole("searchbox", { name: "Search jobs" }), "remote");

    expect(screen.getAllByText("Backend Engineer").length).toBeGreaterThan(0);
    expect(screen.queryByText("Product Designer")).not.toBeInTheDocument();
  });

  it("shows summary stats across all jobs", () => {
    render(<EmployerJobsList jobs={jobs} />);

    expect(screen.getByText("Active postings")).toBeInTheDocument();
    expect(screen.getByText("Candidates matched")).toBeInTheDocument();
    expect(screen.getByText("Profiles unlocked")).toBeInTheDocument();
    expect(screen.getAllByText("6").length).toBeGreaterThanOrEqual(1);
  });

  it("links draft jobs to edit and active jobs to view", async () => {
    const user = userEvent.setup();
    render(<EmployerJobsList jobs={jobs} />);

    await user.click(screen.getByRole("tab", { name: /Drafts/i }));
    expect(screen.getAllByRole("link", { name: "Backend Engineer" })[0]).toHaveAttribute(
      "href",
      "/employer/jobs/job-draft"
    );

    await user.click(screen.getByRole("tab", { name: /Active/i }));
    expect(screen.getAllByRole("link", { name: "Product Designer" })[0]).toHaveAttribute(
      "href",
      "/employer/jobs/job-active/view"
    );
  });
});
