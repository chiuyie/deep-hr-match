import { describe, expect, it } from "vitest";
import {
  calculateProfileCompletion,
  formatCurrency,
  formatDate,
  formatFileSize,
  getProfileCompletionDetails,
  parseCommaList,
  statusBadgeClassName,
  statusLabel,
} from "@/lib/utils/profile";

describe("calculateProfileCompletion", () => {
  it("returns 0 for empty profile", () => {
    expect(calculateProfileCompletion({})).toBe(0);
  });

  it("counts filled scalar and array fields", () => {
    const completion = calculateProfileCompletion({
      full_name: "Jane Doe",
      email: "jane@example.com",
      skills: ["TypeScript"],
      years_of_experience: 3,
    });
    // 4 of 16 fields filled = 25%
    expect(completion).toBe(25);
  });

  it("treats empty arrays as unfilled", () => {
    expect(
      calculateProfileCompletion({
        full_name: "Jane Doe",
        skills: [],
      })
    ).toBe(6); // 1 of 16
  });

  it("returns 100 when all fields are filled", () => {
    const completion = calculateProfileCompletion({
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "+65 1234 5678",
      country: "Singapore",
      city: "Singapore",
      current_job_title: "Engineer",
      years_of_experience: 5,
      highest_education: "Bachelor's",
      skills: ["TypeScript"],
      certifications: ["AWS"],
      languages: [{ language: "English", proficiency: "Fluent" }],
      current_salary: "SGD 8000",
      expected_salary: "SGD 10000",
      employment_type_preference: "Full-time",
      work_arrangement_preference: "Hybrid",
      availability: "Immediate",
    });
    expect(completion).toBe(100);
  });
});

describe("getProfileCompletionDetails", () => {
  it("lists missing field labels", () => {
    const details = getProfileCompletionDetails({ full_name: "Jane" });
    expect(details.percentage).toBe(6);
    expect(details.missingFields.length).toBe(15);
    expect(details.missingFields.some((f) => f.key === "email")).toBe(true);
  });
});

describe("parseCommaList", () => {
  it("returns empty array for falsy input", () => {
    expect(parseCommaList()).toEqual([]);
    expect(parseCommaList(null)).toEqual([]);
    expect(parseCommaList("")).toEqual([]);
  });

  it("splits, trims, and drops empty segments", () => {
    expect(parseCommaList(" React , Node.js, , TypeScript ")).toEqual([
      "React",
      "Node.js",
      "TypeScript",
    ]);
  });
});

describe("formatDate", () => {
  it("returns em dash for missing date", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats ISO date strings", () => {
    expect(formatDate("2026-07-14T00:00:00.000Z")).toMatch(/Jul/);
    expect(formatDate("2026-07-14T00:00:00.000Z")).toMatch(/2026/);
  });
});

describe("formatFileSize", () => {
  it("handles empty values", () => {
    expect(formatFileSize(null)).toBe("—");
    expect(formatFileSize(undefined)).toBe("—");
  });

  it("formats bytes through megabytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
  });
});

describe("formatCurrency", () => {
  it("formats cents as USD by default", () => {
    expect(formatCurrency(4900)).toBe("$49.00");
  });

  it("supports other currencies", () => {
    expect(formatCurrency(100000, "sgd")).toMatch(/1,000\.00/);
  });
});

describe("statusLabel", () => {
  it("title-cases underscore-separated status values", () => {
    expect(statusLabel("ready_for_matching")).toBe("Ready For Matching");
    expect(statusLabel("draft")).toBe("Draft");
  });
});

describe("statusBadgeClassName", () => {
  it("uses different styles for draft and closed", () => {
    expect(statusBadgeClassName("draft")).not.toBe(statusBadgeClassName("closed"));
    expect(statusBadgeClassName("draft")).toContain("amber");
    expect(statusBadgeClassName("closed")).toContain("slate");
  });
});
