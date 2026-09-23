import { describe, expect, it } from "vitest";
import { readableIssueMessage, toUserFacingMessage } from "@/lib/ui/readable-error";

describe("toUserFacingMessage", () => {
  it("hides Zod dumps", () => {
    expect(
      toUserFacingMessage("Invalid input: expected nonoptional, received undefined", {
        label: "Years of experience",
      })
    ).toBe("Years of experience needs a valid answer.");
  });

  it("keeps sentences we already wrote", () => {
    expect(toUserFacingMessage("Date of birth is required.")).toBe(
      "Date of birth is required."
    );
  });

  it("hides database errors", () => {
    expect(
      toUserFacingMessage(
        'null value in column "date_of_birth" of relation "candidate_profiles" violates not-null constraint'
      )
    ).toBe("Something went wrong. Try again.");
  });
});

describe("readableIssueMessage", () => {
  it("names the field when the validator sentence does not", () => {
    expect(
      readableIssueMessage(
        { message: "must be a valid date.", path: ["date_of_birth"] },
        "Date of birth"
      )
    ).toBe("Date of birth: must be a valid date.");
  });
});
