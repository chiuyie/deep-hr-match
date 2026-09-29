/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CandidateProfileForm } from "@/components/candidate/candidate-profile-form";
import { makeFormField } from "@/lib/form-fields/test-fixtures";
import type { ProfileFieldSection } from "@/components/forms/dynamic-profile-fields";

const saveProfileStepDraft = vi.fn();
const profileFormAction = vi.fn(async () => ({ saved: true, completionPercentage: 50 }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.history.replaceState({}, "", "/candidate/profile");
  saveProfileStepDraft.mockResolvedValue({ saved: true, completionPercentage: 42 });
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

vi.mock("@/app/candidate/profile/actions", () => ({
  saveProfileStepDraft: (...args: unknown[]) => saveProfileStepDraft(...args),
  profileFormAction: (...args: unknown[]) => profileFormAction(...args),
}));

vi.mock("@/components/forms/dynamic-profile-fields", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/forms/dynamic-profile-fields")
  >("@/components/forms/dynamic-profile-fields");
  return {
    ...actual,
    DynamicProfileFields: ({
      sections,
    }: {
      sections: ProfileFieldSection[];
    }) => (
      <div data-testid={`section-fields-${sections[0]?.title ?? "unknown"}`}>
        {sections[0]?.title} fields
        <input type="hidden" name="probe" value="1" />
      </div>
    ),
  };
});

function makeSections(): ProfileFieldSection[] {
  return [
    {
      title: "About you",
      description: "Basics",
      fields: [
        makeFormField({
          field_key: "full_name",
          label: "Full Name",
          is_required: true,
          section: "About you",
        }),
      ],
    },
    {
      title: "Experience: Work-Life",
      description: "History",
      fields: [
        makeFormField({
          field_key: "certifications",
          label: "Certifications",
          section: "Experience: Work-Life",
        }),
      ],
    },
    {
      title: "Compensation",
      description: "Pay",
      fields: [
        makeFormField({
          field_key: "current_salary",
          label: "Current salary",
          section: "Compensation",
        }),
      ],
    },
  ];
}

function renderWizard(overrides?: {
  initialStepIndex?: number;
  isOnboardingProfileStep?: boolean;
  values?: Record<string, unknown>;
}) {
  return render(
    <CandidateProfileForm
      values={overrides?.values ?? { full_name: "Ada Lovelace" }}
      sections={makeSections()}
      completionPercentage={40}
      missingFieldLabels={[]}
      isOnboardingProfileStep={overrides?.isOnboardingProfileStep ?? false}
      initialStepIndex={overrides?.initialStepIndex ?? 0}
    />
  );
}

describe("CandidateProfileForm wizard", () => {
  it("saves then moves to the next page after Save profile on Compensation", async () => {
    const user = userEvent.setup();
    renderWizard({
      initialStepIndex: 1,
      values: { full_name: "Ada Lovelace" },
    });

    expect(screen.getByRole("heading", { name: "Experience: Work-Life" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Save profile/i }));

    await waitFor(() => {
      expect(saveProfileStepDraft).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("heading", { name: "Compensation" })).toBeInTheDocument();
    expect(screen.getByText(/Page 3 of 3/i)).toBeInTheDocument();
    expect(window.location.search).toContain("step=3");
    expect(profileFormAction).not.toHaveBeenCalled();
  });

  it("saves then moves to the next page after Save for later during onboarding", async () => {
    const user = userEvent.setup();
    renderWizard({
      initialStepIndex: 1,
      isOnboardingProfileStep: true,
      values: { full_name: "Ada Lovelace" },
    });

    expect(screen.getByRole("heading", { name: "Experience: Work-Life" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Save for later/i }));

    await waitFor(() => {
      expect(saveProfileStepDraft).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("heading", { name: "Compensation" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "About you" })).not.toBeInTheDocument();
  });

  it("stays on the last page after Save profile", async () => {
    const user = userEvent.setup();
    renderWizard({ initialStepIndex: 2 });

    expect(screen.getByRole("heading", { name: "Compensation" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Save profile/i }));

    await waitFor(() => {
      expect(saveProfileStepDraft).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("heading", { name: "Compensation" })).toBeInTheDocument();
    expect(screen.getByText(/Page 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Progress saved|Profile saved/i)).toBeInTheDocument();
  });

  it("advances to the next page when Next succeeds", async () => {
    const user = userEvent.setup();
    renderWizard({
      initialStepIndex: 1,
      values: { full_name: "Ada Lovelace" },
    });

    expect(screen.getByRole("heading", { name: "Experience: Work-Life" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Next$/i }));

    await waitFor(() => {
      expect(saveProfileStepDraft).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("heading", { name: "Compensation" })).toBeInTheDocument();
    expect(screen.getByText(/Page 3 of 3/i)).toBeInTheDocument();
    expect(window.location.search).toContain("step=3");
  });

  it("restores the open page from the URL after remount", () => {
    window.history.replaceState({}, "", "/candidate/profile?step=3");

    renderWizard({ initialStepIndex: 0 });

    expect(screen.getByRole("heading", { name: "Compensation" })).toBeInTheDocument();
    expect(screen.getByText(/Page 3 of 3/i)).toBeInTheDocument();
  });
});
