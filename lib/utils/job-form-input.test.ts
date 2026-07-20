import { describe, expect, it } from "vitest";
import {
  buildSalaryRangeLabel,
  sanitizeMoneyInput,
  validateCompensationRange,
} from "@/lib/utils/job-form-input";

describe("job-form-input", () => {
  it("sanitizes money input", () => {
    expect(sanitizeMoneyInput("S$5,000")).toBe("5000");
  });

  it("validates min/max budget order", () => {
    expect(
      validateCompensationRange({
        desired_minimum_salary: "9000",
        desired_maximum_salary: "5000",
      }).ok
    ).toBe(false);
  });

  it("builds salary_range label for jobs table", () => {
    expect(
      buildSalaryRangeLabel({
        desired_minimum_salary: "5000",
        desired_maximum_salary: "8000",
      })
    ).toBe("SGD 5,000 – 8,000 / month");
  });
});
