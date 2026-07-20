import { describe, expect, it } from "vitest";
import {
  candidateProfileSchema,
  employerProfileSchema,
  jobSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validations/schemas";

describe("signUpSchema", () => {
  it("accepts valid candidate sign-up input", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      name: "Jane Doe",
      role: "candidate",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "short",
      name: "Jane Doe",
      role: "employer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid roles", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      name: "Jane Doe",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("requires email and password", () => {
    expect(signInSchema.safeParse({ email: "", password: "" }).success).toBe(false);
    expect(
      signInSchema.safeParse({ email: "user@example.com", password: "secret" }).success
    ).toBe(true);
  });
});

describe("candidateProfileSchema", () => {
  it("requires full name and valid email", () => {
    expect(
      candidateProfileSchema.safeParse({ full_name: "Jane", email: "not-an-email" }).success
    ).toBe(false);
    expect(
      candidateProfileSchema.safeParse({ full_name: "Jane", email: "jane@example.com" }).success
    ).toBe(true);
  });

  it("coerces years_of_experience to a number", () => {
    const result = candidateProfileSchema.safeParse({
      full_name: "Jane",
      email: "jane@example.com",
      years_of_experience: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.years_of_experience).toBe(5);
    }
  });
});

describe("employerProfileSchema", () => {
  it("requires company name", () => {
    expect(employerProfileSchema.safeParse({ company_name: "" }).success).toBe(false);
    expect(employerProfileSchema.safeParse({ company_name: "Acme" }).success).toBe(true);
  });

  it("allows empty website and contact email", () => {
    expect(
      employerProfileSchema.safeParse({
        company_name: "Acme",
        website: "",
        contact_person_email: "",
      }).success
    ).toBe(true);
  });
});

describe("jobSchema", () => {
  it("requires job title and description", () => {
    expect(jobSchema.safeParse({ job_title: "" }).success).toBe(false);
    expect(jobSchema.safeParse({ job_title: "Engineer" }).success).toBe(false);
    expect(
      jobSchema.safeParse({ job_title: "Engineer", job_description: "Build features" }).success
    ).toBe(true);
  });
});
