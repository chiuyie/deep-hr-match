import { describe, expect, it } from "vitest";
import {
  flattenMultilevelOptions,
  formStateToJobPayload,
  jobRecordToFormState,
  parseJobFormState,
} from "@/lib/utils/job-form";

describe("flattenMultilevelOptions", () => {
  it("returns empty array for empty input", () => {
    expect(flattenMultilevelOptions(null)).toEqual([]);
    expect(flattenMultilevelOptions({})).toEqual([]);
  });

  it("flattens nested objects with pipe-separated paths", () => {
    const result = flattenMultilevelOptions({
      Engineering: ["Frontend", "Backend"],
      Design: { UI: ["Figma"] },
    });
    expect(result).toContain("Engineering | Frontend");
    expect(result).toContain("Engineering | Backend");
    expect(result).toContain("Design | UI | Figma");
  });
});

describe("parseJobFormState", () => {
  it("parses string fields and boolean FAQ flags", () => {
    const formData = new FormData();
    formData.set("job_title", "Software Engineer");
    formData.set("department", "Engineering");
    formData.set("faq_remote", "true");
    formData.set("faq_relocation", "false");
    formData.append("benefits_package", "Health");
    formData.append("benefits_package", "Dental");

    expect(parseJobFormState(formData)).toEqual({
      job_title: "Software Engineer",
      department: "Engineering",
      faq_remote: true,
      faq_relocation: false,
      benefits_package: ["Health", "Dental"],
    });
  });
});

describe("jobRecordToFormState", () => {
  it("merges legacy columns into form state when form_data is empty", () => {
    const state = jobRecordToFormState({
      title: "Data Analyst",
      description: "Analyze metrics",
      form_data: {},
      department: "Analytics",
      location: "Singapore",
      employment_type: "Full-time",
      salary_range: "SGD 6000",
      years_experience_required: 2,
      education_required: "Bachelor's",
      required_skills: ["SQL", "Python"],
      preferred_skills: ["Tableau"],
      status: "active",
    });

    expect(state.job_title).toBe("Data Analyst");
    expect(state.job_description).toBe("Analyze metrics");
    expect(state.department).toBe("Analytics");
    expect(state.required_skills).toBe("SQL, Python");
    expect(state.years_experience_required).toBe("2");
    expect(state.status).toBe("active");
  });
});

describe("formStateToJobPayload", () => {
  it("maps form state to DB columns and nested form_data", () => {
    const payload = formStateToJobPayload({
      job_title: "  Product Manager ",
      job_description: "Lead product",
      department: "Product",
      location: "Remote",
      employment_type: "Full-time",
      salary_range: "SGD 9000",
      years_experience_required: "4",
      education_required: "MBA",
      required_skills: "Roadmaps, Stakeholders",
      preferred_skills: "B2B SaaS",
      status: "draft",
      custom_field: "value",
    });

    expect(payload.title).toBe("Product Manager");
    expect(payload.description).toBe("Lead product");
    expect(payload.department).toBe("Product");
    expect(payload.years_experience_required).toBe(4);
    expect(payload.required_skills).toEqual(["Roadmaps", "Stakeholders"]);
    expect(payload.preferred_skills).toEqual(["B2B SaaS"]);
    expect(payload.status).toBe("draft");
    expect(payload.form_data).toEqual({ custom_field: "value" });
  });

  it("defaults invalid status to active", () => {
    const payload = formStateToJobPayload({
      job_title: "Role",
      job_description: "",
      status: "invalid",
    });
    expect(payload.status).toBe("active");
  });
});
