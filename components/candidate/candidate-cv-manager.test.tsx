/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CandidateCvManager } from "@/components/candidate/candidate-cv-manager";
import { makeCandidateCvFile } from "@/lib/candidate/__fixtures__/candidate-flow";

const uploadCandidateCV = vi.fn();
const routerPush = vi.fn();
const routerRefresh = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/candidate/actions", () => ({
  uploadCandidateCV: (...args: unknown[]) => uploadCandidateCV(...args),
  deleteCandidateCV: vi.fn(),
  getCandidateCvDownloadUrl: vi.fn(),
}));

describe("CandidateCvManager", () => {
  it("shows upload prompt when no CV exists", () => {
    render(<CandidateCvManager files={[]} />);
    expect(screen.getByText("Upload your CV")).toBeInTheDocument();
    expect(screen.getByText(/PDF or Word/i)).toBeInTheDocument();
  });

  it("shows profile-complete alert during onboarding", () => {
    render(<CandidateCvManager files={[]} showProfileComplete />);
    expect(screen.getByText("Profile saved")).toBeInTheDocument();
  });

  it("redirects to matrix on first onboarding upload", async () => {
    const user = userEvent.setup();
    uploadCandidateCV.mockResolvedValue({
      success: true,
      redirectTo: "/candidate/matrix?step=cv-complete",
    });

    render(<CandidateCvManager files={[]} redirectOnFirstUpload />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pdf"], "resume.pdf", { type: "application/pdf" });
    await user.upload(input, file);

    expect(uploadCandidateCV).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith("/candidate/matrix?step=cv-complete");
  });

  it("shows current CV and continue link when files exist", () => {
    render(
      <CandidateCvManager
        files={[makeCandidateCvFile()]}
        continueHref="/candidate/matrix"
        continueLabel="Continue to matrix"
      />
    );

    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue to matrix/i })).toHaveAttribute(
      "href",
      "/candidate/matrix"
    );
  });
});
