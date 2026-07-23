/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormFieldsComparisonEditor } from "@/components/admin/form-fields-comparison-editor";
import {
  makeFormField,
  makeSectionGroup,
  sampleCandidateSections,
  sampleEmployerSections,
} from "@/lib/form-fields/test-fixtures";
import { PLATFORM_DISCLOSURE_DEFAULTS } from "@/lib/employer/platform-disclosure";

const platformDisclosure = PLATFORM_DISCLOSURE_DEFAULTS;

const refresh = vi.fn();

afterEach(() => {
  cleanup();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/admin/form-field-actions", () => ({
  saveFormField: vi.fn(async () => ({ success: true })),
  deleteFormField: vi.fn(async () => ({ success: true })),
  toggleFormFieldActive: vi.fn(async () => ({ success: true })),
  createFormField: vi.fn(async () => ({ success: true })),
  createFormSection: vi.fn(async () => ({ success: true })),
  renameFormSection: vi.fn(async () => ({ success: true })),
  deleteFormSection: vi.fn(async () => ({ success: true })),
  reorderFormFields: vi.fn(async () => ({ success: true })),
  reorderFormSections: vi.fn(async () => ({ success: true })),
  updateEmployerDisclosureMode: vi.fn(async () => ({ success: true })),
  updateShowOnAnonymousMatch: vi.fn(async () => ({ success: true })),
}));

describe("FormFieldsComparisonEditor", () => {
  it("renders profile sections with field counts", () => {
    render(
      <FormFieldsComparisonEditor
        candidate={sampleCandidateSections}
        employerProfile={sampleEmployerSections}
        employerJob={[]}
        platformDisclosure={platformDisclosure}
      />
    );

    expect(screen.getByRole("heading", { name: "Form Fields & Match Disclosure" })).toBeInTheDocument();
    expect(screen.getAllByText("Candidate profile").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Employer profile").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Full Name").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Company Name").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Phone").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: /Add section/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("shows employer job fields on the job tab", async () => {
    const user = userEvent.setup();
    const jobSections = [
      makeSectionGroup("Job Identification", [
        makeFormField({
          audience: "employer",
          form_group: "job",
          section: "Job Identification",
          field_key: "job_title",
          label: "Job Title",
        }),
      ]),
    ];

    render(
      <FormFieldsComparisonEditor
        candidate={sampleCandidateSections}
        employerProfile={sampleEmployerSections}
        employerJob={jobSections}
        platformDisclosure={platformDisclosure}
      />
    );

    await user.click(screen.getAllByRole("tab", { name: /Create job form/i })[0]!);
    expect(screen.getByText("Employer create-job form")).toBeInTheDocument();
    expect(screen.getByText("Job Title")).toBeInTheDocument();
  });

  it("opens inline edit for a field", async () => {
    const user = userEvent.setup();
    render(
      <FormFieldsComparisonEditor
        candidate={sampleCandidateSections}
        employerProfile={sampleEmployerSections}
        employerJob={[]}
        platformDisclosure={platformDisclosure}
      />
    );

    const fullNameRow = screen.getAllByText("Full Name")[0]!.closest("div.group");
    expect(fullNameRow).toBeTruthy();
    const editButton = within(fullNameRow as HTMLElement).getByRole("button", {
      name: /Edit( field)?/i,
    });
    await user.click(editButton);

    expect(screen.getByDisplayValue("Full Name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
  });

  it("shows add field controls for both sides", () => {
    render(
      <FormFieldsComparisonEditor
        candidate={sampleCandidateSections}
        employerProfile={sampleEmployerSections}
        employerJob={[]}
        platformDisclosure={platformDisclosure}
      />
    );

    const addButtons = screen.getAllByRole("button", { name: /^Add field$/i });
    expect(addButtons.length).toBeGreaterThanOrEqual(2);
  });
});
