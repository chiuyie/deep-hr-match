import { describe, expect, it } from "vitest";
import {
  countByJobId,
  jobPrimaryHref,
  jobSearchText,
  statusFilterCounts,
  toEmployerJobListItems,
} from "@/lib/employer/job-list";
import type { Job } from "@/types/database";

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    employer_id: "emp-1",
    title: "Software Engineer",
    department: "Engineering",
    location: "Singapore",
    employment_type: "Full-time",
    salary_range: null,
    years_experience_required: null,
    education_required: null,
    required_skills: null,
    preferred_skills: null,
    description: null,
    status: "active",
    form_data: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("countByJobId", () => {
  it("aggregates row counts per job", () => {
    const counts = countByJobId([
      { job_id: "a" },
      { job_id: "a" },
      { job_id: "b" },
    ]);
    expect(counts.get("a")).toBe(2);
    expect(counts.get("b")).toBe(1);
  });
});

describe("toEmployerJobListItems", () => {
  it("maps jobs with match and unlock counts", () => {
    const items = toEmployerJobListItems(
      [makeJob()],
      new Map([["job-1", 4]]),
      new Map([["job-1", 2]])
    );
    expect(items[0]).toMatchObject({
      title: "Software Engineer",
      matchCount: 4,
      unlockCount: 2,
    });
  });
});

describe("jobPrimaryHref", () => {
  it("links drafts to edit and posted jobs to view", () => {
    expect(jobPrimaryHref({ id: "job-1", status: "draft" })).toBe("/employer/jobs/job-1");
    expect(jobPrimaryHref({ id: "job-1", status: "active" })).toBe(
      "/employer/jobs/job-1/view"
    );
  });
});

describe("jobSearchText", () => {
  it("includes searchable fields", () => {
    const text = jobSearchText({
      id: "job-1",
      title: "Designer",
      location: "Remote",
      department: "Product",
      employment_type: "Contract",
      status: "active",
      created_at: "",
      matchCount: 0,
      unlockCount: 0,
    });
    expect(text).toContain("designer");
    expect(text).toContain("remote");
    expect(text).toContain("product");
  });
});

describe("statusFilterCounts", () => {
  it("counts jobs by status", () => {
    const counts = statusFilterCounts([
      {
        id: "1",
        title: "A",
        location: null,
        department: null,
        employment_type: null,
        status: "active",
        created_at: "",
        matchCount: 0,
        unlockCount: 0,
      },
      {
        id: "2",
        title: "B",
        location: null,
        department: null,
        employment_type: null,
        status: "draft",
        created_at: "",
        matchCount: 0,
        unlockCount: 0,
      },
      {
        id: "3",
        title: "C",
        location: null,
        department: null,
        employment_type: null,
        status: "closed",
        created_at: "",
        matchCount: 0,
        unlockCount: 0,
      },
    ]);
    expect(counts).toEqual({ all: 3, active: 1, draft: 1, closed: 1 });
  });
});
