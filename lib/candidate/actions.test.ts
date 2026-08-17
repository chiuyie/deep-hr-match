import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteCandidateCV,
  getCandidateCvDownloadUrl,
  markCandidateReady,
  saveCandidateMatrixAnswers,
  uploadCandidateCV,
} from "@/lib/candidate/actions";

const requireRole = vi.fn();
const getCandidateProfile = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn();
const fetchCandidateOnboardingState = vi.fn();
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();
const mockCreateClient = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
  getCandidateProfile: (...args: unknown[]) => getCandidateProfile(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

vi.mock("@/lib/candidate/onboarding", () => ({
  fetchCandidateOnboardingState: (...args: unknown[]) => fetchCandidateOnboardingState(...args),
}));

function profileSelectChain(data: unknown) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(async () => ({ data, error: null })),
      })),
    })),
  };
}

function profileIdChain(id: string | null) {
  return profileSelectChain(id ? { id } : null);
}

describe("candidate actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ id: "user-1", role: "candidate" });
    getCandidateProfile.mockResolvedValue({ id: "cand-1" });
    redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mockCreateClient.mockResolvedValue({
      from: mockFrom,
      storage: { from: mockStorageFrom },
    });
    mockStorageFrom.mockReturnValue({
      upload: vi.fn(async () => ({ error: null })),
      remove: vi.fn(async () => ({ error: null })),
      createSignedUrl: vi.fn(async () => ({
        data: { signedUrl: "https://example.com/cv.pdf" },
        error: null,
      })),
    });
  });

  describe("uploadCandidateCV", () => {
    it("rejects missing files", async () => {
      const result = await uploadCandidateCV(new FormData());
      expect(result).toEqual({ error: "Please choose a CV file to upload." });
    });

    it("rejects unsupported file types", async () => {
      mockFrom.mockImplementation((table: string) =>
        table === "candidate_profiles" ? profileIdChain("cand-1") : profileIdChain(null)
      );

      const formData = new FormData();
      formData.set("file", new File(["hello"], "notes.txt", { type: "text/plain" }));

      const result = await uploadCandidateCV(formData);
      expect(result.error).toContain("PDF or Word");
    });

    it("redirects to matrix after first onboarding upload", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "candidate_profiles") return profileIdChain("cand-1");
        if (table === "candidate_cv_files") {
          return { insert: vi.fn(async () => ({ error: null })) };
        }
        return profileIdChain(null);
      });

      const formData = new FormData();
      formData.set("file", new File(["pdf"], "resume.pdf", { type: "application/pdf" }));

      const result = await uploadCandidateCV(formData);
      expect(result).toEqual({
        success: true,
        redirectTo: "/candidate/matrix?step=cv-complete",
      });
    });

    it("stays on CV page when replacing an existing upload", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "candidate_profiles") return profileIdChain("cand-1");
        if (table === "candidate_cv_files") {
          return { insert: vi.fn(async () => ({ error: null })) };
        }
        return profileIdChain(null);
      });

      const formData = new FormData();
      formData.set("file", new File(["pdf"], "resume.pdf", { type: "application/pdf" }));
      formData.set("stay", "1");

      const result = await uploadCandidateCV(formData);
      expect(result).toEqual({ success: true });
      expect(result.redirectTo).toBeUndefined();
    });
  });

  describe("deleteCandidateCV", () => {
    it("requires a profile and file id", async () => {
      mockFrom.mockImplementation((table: string) =>
        table === "candidate_profiles" ? profileIdChain("cand-1") : profileIdChain(null)
      );

      const result = await deleteCandidateCV("");
      expect(result).toEqual({ error: "Missing file id" });
    });

    it("deletes owned CV files", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "candidate_profiles") return profileIdChain("cand-1");
        if (table === "candidate_cv_files") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: "cv-1", file_path: "cand-1/resume.pdf" },
                    error: null,
                  })),
                })),
              })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(async () => ({ error: null })),
              })),
            })),
          };
        }
        return profileIdChain(null);
      });

      const result = await deleteCandidateCV("cv-1");
      expect(result).toEqual({ success: true });
    });
  });

  describe("getCandidateCvDownloadUrl", () => {
    it("returns a signed download URL", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "candidate_profiles") return profileIdChain("cand-1");
        if (table === "candidate_cv_files") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: "cv-1", file_path: "cand-1/resume.pdf" },
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }
        return profileIdChain(null);
      });

      const result = await getCandidateCvDownloadUrl("cv-1");
      expect(result).toEqual({
        success: true,
        downloadUrl: "https://example.com/cv.pdf",
      });
    });
  });

  describe("saveCandidateMatrixAnswers", () => {
    it("validates matrix completion on submit", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "candidate_profiles") return profileIdChain("cand-1");
        if (table === "matrix_categories") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(async () => ({ data: [], error: null })),
              })),
            })),
          };
        }
        if (table === "candidate_matrix_answers") {
          return { upsert: vi.fn(async () => ({ error: null })) };
        }
        return profileIdChain(null);
      });

      const result = await saveCandidateMatrixAnswers(
        [{ question_id: "q-1", option_id: "o-1", matrix_column: 1 }],
        true
      );
      expect(result.error).toBe("Matrix form is not configured");
    });

    it("redirects to status after successful submit", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "candidate_profiles") return profileIdChain("cand-1");
        if (table === "candidate_matrix_answers") {
          return { upsert: vi.fn(async () => ({ error: null })) };
        }
        return profileIdChain(null);
      });

      const result = await saveCandidateMatrixAnswers(
        [{ question_id: "q-1", option_id: "o-1", matrix_column: 1 }],
        false
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe("markCandidateReady", () => {
    it("requires consent before going live", async () => {
      const formData = new FormData();
      await expect(markCandidateReady(formData)).rejects.toThrow("NEXT_REDIRECT");
      expect(redirect).toHaveBeenCalledWith("/candidate/status?error=consent");
    });

    it("blocks readiness when CV is missing", async () => {
      fetchCandidateOnboardingState.mockResolvedValue({
        completionPercentage: 80,
        hasCv: false,
        hasMatrix: true,
      });

      const formData = new FormData();
      formData.set("matching_consent", "on");

      await expect(markCandidateReady(formData)).rejects.toThrow("NEXT_REDIRECT");
      expect(redirect).toHaveBeenCalledWith("/candidate/status?error=cv");
    });

    it("marks profile ready when checklist is complete", async () => {
      fetchCandidateOnboardingState.mockResolvedValue({
        completionPercentage: 100,
        hasCv: true,
        hasMatrix: true,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "candidate_profiles") {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(async () => ({ error: null })),
            })),
          };
        }
        return profileIdChain(null);
      });

      const formData = new FormData();
      formData.set("matching_consent", "on");

      await expect(markCandidateReady(formData)).rejects.toThrow("NEXT_REDIRECT");
      expect(redirect).toHaveBeenCalledWith("/candidate/status?success=ready");
    });
  });
});
