/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DynamicProfileFields } from "@/components/forms/dynamic-profile-fields";
import { makeFormField } from "@/lib/form-fields/test-fixtures";

afterEach(() => {
  cleanup();
});

describe("DynamicProfileFields", () => {
  it("renders standard and custom profile inputs with correct names", () => {
    render(
      <DynamicProfileFields
        variant="candidate"
        values={{
          full_name: "Jane Doe",
          custom_fields: { portfolio: "https://example.com" },
        }}
        fields={[
          makeFormField({ field_key: "full_name", label: "Full Name", is_required: true }),
          makeFormField({
            field_key: "portfolio",
            label: "Portfolio",
            is_custom: true,
            sort_order: 2,
          }),
        ]}
      />
    );

    expect(screen.getByLabelText(/Full Name/i)).toHaveAttribute("name", "full_name");
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue("Jane Doe");
    expect(screen.getByLabelText(/Portfolio/i)).toHaveAttribute("name", "custom_portfolio");
    expect(screen.getByLabelText(/Portfolio/i)).toHaveValue("https://example.com");
  });

  it("renders textarea fields outside the two-column grid", () => {
    render(
      <DynamicProfileFields
        variant="employer"
        values={{ company_description: "We build things." }}
        fields={[
          makeFormField({
            audience: "employer",
            section: "Company Profile",
            field_key: "company_description",
            label: "Description",
            field_type: "textarea",
          }),
        ]}
      />
    );

    const textarea = screen.getByLabelText(/Description/i);
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveValue("We build things.");
  });
});
