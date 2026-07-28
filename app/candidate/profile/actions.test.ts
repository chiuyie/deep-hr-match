import { beforeEach, describe, expect, it, vi } from "vitest";
import { profileFormAction, saveProfileStepDraft } from "@/app/candidate/profile/actions";

const saveCandidateProfileCore = vi.fn();
const redirect = vi.fn();

vi.mock("@/lib/candidate/actions", () => ({
  saveCandidateProfileCore: (...args: unknown[]) => saveCandidateProfileCore(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

describe("candidate profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  describe("saveProfileStepDraft", () => {
    it("returns saved state without redirecting", async () => {
      saveCandidateProfileCore.mockResolvedValue({ completionPercentage: 45 });

      const result = await saveProfileStepDraft(new FormData());

      expect(saveCandidateProfileCore).toHaveBeenCalledWith(expect.any(FormData), false);
      expect(result).toEqual({ saved: true, completionPercentage: 45 });
    });

    it("surfaces validation errors", async () => {
      saveCandidateProfileCore.mockResolvedValue({ error: "Full Name is required" });

      const result = await saveProfileStepDraft(new FormData());
      expect(result).toEqual({ error: "Full Name is required" });
    });
  });

  describe("profileFormAction", () => {
    it("redirects to CV when submit meets the completion threshold", async () => {
      saveCandidateProfileCore.mockResolvedValue({ completionPercentage: 72 });

      const formData = new FormData();
      formData.set("intent", "submit");

      await expect(profileFormAction({}, formData)).rejects.toThrow("NEXT_REDIRECT");
      expect(saveCandidateProfileCore).toHaveBeenCalledWith(formData, true);
      expect(redirect).toHaveBeenCalledWith("/candidate/cv?step=profile-complete");
    });

    it("redirects back when submit is below threshold", async () => {
      saveCandidateProfileCore.mockResolvedValue({ completionPercentage: 40 });

      const formData = new FormData();
      formData.set("intent", "submit");

      await expect(profileFormAction({}, formData)).rejects.toThrow("NEXT_REDIRECT");
      expect(redirect).toHaveBeenCalledWith(
        "/candidate/profile?error=profile-incomplete&completion=40"
      );
    });

    it("saves draft intent without requiring threshold", async () => {
      saveCandidateProfileCore.mockResolvedValue({ completionPercentage: 20 });

      const formData = new FormData();
      formData.set("intent", "draft");

      await expect(profileFormAction({}, formData)).rejects.toThrow("NEXT_REDIRECT");
      expect(saveCandidateProfileCore).toHaveBeenCalledWith(formData, false);
      expect(redirect).toHaveBeenCalledWith("/candidate/profile?saved=draft");
    });
  });
});
